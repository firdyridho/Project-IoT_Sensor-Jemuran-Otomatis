/**
 * Audio Alarm Synthesizer & Cross-Tab Controller for Rintik IoT Jemuran Otomatis
 * Implements REQ-FE-12: Persistent Looping Rain Alarms & Cross-Tab Sync
 * Implements REQ-FE-13: Custom Audio File Playback & Offline Cache Resilience
 */

export type AlarmToneType = 'emergency_siren' | 'phone_ring' | 'radar_alert' | 'chime' | 'custom';

export interface ToneOption {
  id: AlarmToneType;
  label: string;
  description: string;
}

export const ALARM_TONE_OPTIONS: ToneOption[] = [
  {
    id: 'emergency_siren',
    label: 'Emergency Siren (Bawaan)',
    description: 'Sirine darurat melolong cepat bernada tinggi untuk respon sigap',
  },
  {
    id: 'phone_ring',
    label: 'Digital Phone Ring',
    description: 'Dering telepon ganda terus-menerus bernada tegas & mendesak',
  },
  {
    id: 'radar_alert',
    label: 'Tactical Radar Alert',
    description: 'Pulsa radar berfrekuensi tinggi dengan ritme ketukan taktis',
  },
  {
    id: 'chime',
    label: 'High Pitch Chime',
    description: 'Kombinasi melodi arpeggio kristal yang jernih dan elegan',
  },
  {
    id: 'custom',
    label: 'Nada Dering Kustom (Unggah Sendiri)',
    description: 'Berkas audio rekaman atau musik pilihan Anda (.mp3, .wav, .ogg, .m4a)',
  },
];

const CACHE_NAME = 'rintik-custom-tones-v1';

/**
 * Cache custom audio to Cache Storage for offline resilience during storms (REQ-FE-13)
 */
export async function cacheCustomAudio(url: string): Promise<string> {
  if (typeof window === 'undefined' || !url) return url;
  try {
    if ('caches' in window) {
      const cache = await caches.open(CACHE_NAME);
      const existing = await cache.match(url);
      if (!existing) {
        try {
          await cache.add(url);
        } catch {
          // If direct cache.add fails (e.g. CORS), fetch and put
          const resp = await fetch(url, { mode: 'cors' });
          if (resp.ok) {
            await cache.put(url, resp.clone());
          }
        }
      }
      const cachedResponse = await cache.match(url);
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        return URL.createObjectURL(blob);
      }
    }
  } catch (err) {
    console.warn('Cache Storage fallback to direct URL:', err);
  }
  return url;
}

class AudioAlarmController {
  private ctx: AudioContext | null = null;
  private isLooping = false;
  private loopIntervalId: number | null = null;
  private currentGainNode: GainNode | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private activeTone: AlarmToneType = 'emergency_siren';
  private activeVolume: number = 80;
  private previewTimeoutId: number | null = null;
  private customAudioElement: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel('rintik_alarm_channel');
          this.broadcastChannel.onmessage = (event) => {
            if (event.data?.type === 'DISMISS_ALARM') {
              this.stopAlarmLocal();
            }
          };
        }
      } catch (err) {
        console.warn('BroadcastChannel not available:', err);
      }

      // Fallback cross-tab synchronization via storage event
      window.addEventListener('storage', (event) => {
        if (event.key === 'rintik.alarm.dismiss_signal') {
          this.stopAlarmLocal();
        }
      });
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Synthesize a single burst of the chosen tone
   */
  private playToneBurst(tone: AlarmToneType, volumePct: number = 80) {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    const vol = Math.max(0.05, Math.min(1, volumePct / 100));
    masterGain.gain.setValueAtTime(vol * 0.4, now);
    masterGain.connect(ctx.destination);
    this.currentGainNode = masterGain;

    if (tone === 'emergency_siren' || tone === 'custom') {
      // Rapid dual sweep sawtooth siren (default or fallback)
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(1050, now + 0.3);
      osc.frequency.linearRampToValueAtTime(650, now + 0.6);
      osc.frequency.linearRampToValueAtTime(1050, now + 0.9);
      osc.frequency.linearRampToValueAtTime(650, now + 1.2);

      masterGain.gain.setValueAtTime(vol * 0.35, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + 1.25);
    } else if (tone === 'phone_ring') {
      // Dual-frequency telecom ring (440Hz + 480Hz USA standard telephone cadence)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      // 2 quick pulses
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.setValueAtTime(vol * 0.45, now + 0.05);
      masterGain.gain.setValueAtTime(0, now + 0.45);
      masterGain.gain.setValueAtTime(vol * 0.45, now + 0.55);
      masterGain.gain.setValueAtTime(0, now + 0.95);

      osc1.connect(masterGain);
      osc2.connect(masterGain);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.1);
      osc2.stop(now + 1.1);
    } else if (tone === 'radar_alert') {
      // Tactical radar ping: 3 quick downward frequency chirps
      for (let i = 0; i < 3; i++) {
        const offset = i * 0.35;
        const osc = ctx.createOscillator();
        const chirpGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, now + offset);
        osc.frequency.exponentialRampToValueAtTime(600, now + offset + 0.25);

        chirpGain.gain.setValueAtTime(vol * 0.4, now + offset);
        chirpGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.28);

        osc.connect(chirpGain);
        chirpGain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.29);
      }
    } else {
      // High pitch crystalline chime arpeggio: C6, E6, G6, C7
      const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
      freqs.forEach((freq, idx) => {
        const offset = idx * 0.15;
        const osc = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);

        chimeGain.gain.setValueAtTime(vol * 0.35, now + offset);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.8);

        osc.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.85);
      });
    }
  }

  /**
   * Preview a tone sample for 1.5 - 4 seconds and stop
   */
  public async previewTone(tone: AlarmToneType, volumePct: number = 80, customUrl?: string) {
    this.stopPreview();

    if (tone === 'custom' && customUrl) {
      try {
        const resolvedSrc = await cacheCustomAudio(customUrl);
        const audio = new Audio(resolvedSrc);
        audio.volume = Math.max(0.05, Math.min(1, volumePct / 100));
        this.customAudioElement = audio;
        await audio.play();

        this.previewTimeoutId = window.setTimeout(() => {
          this.stopPreview();
        }, 4000);
      } catch (err) {
        console.warn('Custom audio preview failed, playing siren fallback:', err);
        this.playToneBurst('emergency_siren', volumePct);
      }
    } else {
      this.playToneBurst(tone, volumePct);
      this.previewTimeoutId = window.setTimeout(() => {
        this.stopPreview();
      }, 1500);
    }
  }

  public stopPreview() {
    if (this.previewTimeoutId) {
      window.clearTimeout(this.previewTimeoutId);
      this.previewTimeoutId = null;
    }
    if (this.customAudioElement) {
      try {
        this.customAudioElement.pause();
        this.customAudioElement.currentTime = 0;
      } catch {}
      this.customAudioElement = null;
    }
    if (this.currentGainNode && this.ctx) {
      try {
        this.currentGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.currentGainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
      } catch {}
    }
  }

  /**
   * Start indefinite continuous looping alarm until manually dismissed
   */
  public async startPersistentAlarm(
    tone: AlarmToneType = 'emergency_siren',
    volumePct: number = 80,
    customUrl?: string
  ) {
    if (this.isLooping) return;
    this.isLooping = true;
    this.activeTone = tone;
    this.activeVolume = volumePct;

    if (tone === 'custom' && customUrl) {
      try {
        const resolvedSrc = await cacheCustomAudio(customUrl);
        const audio = new Audio(resolvedSrc);
        audio.loop = true;
        audio.volume = Math.max(0.05, Math.min(1, volumePct / 100));
        this.customAudioElement = audio;
        await audio.play();
        return;
      } catch (err) {
        console.warn('Playing custom audio failed, falling back to emergency siren loop:', err);
      }
    }

    // Immediately play first burst of synthesizer
    this.playToneBurst(this.activeTone, this.activeVolume);

    // Interval repeat based on tone cadence
    const intervalMs = tone === 'phone_ring' ? 2000 : 1600;
    this.loopIntervalId = window.setInterval(() => {
      if (!this.isLooping) return;
      this.playToneBurst(this.activeTone, this.activeVolume);
    }, intervalMs);
  }

  /**
   * Dismiss and stop alarm across ALL open browser tabs
   */
  public dismissAlarm() {
    this.stopAlarmLocal();

    // Broadcast dismiss signal to other tabs
    try {
      this.broadcastChannel?.postMessage({ type: 'DISMISS_ALARM', timestamp: Date.now() });
    } catch {}

    try {
      localStorage.setItem('rintik.alarm.dismiss_signal', String(Date.now()));
    } catch {}
  }

  /**
   * Stop loop only in this local tab
   */
  private stopAlarmLocal() {
    this.isLooping = false;
    if (this.loopIntervalId) {
      window.clearInterval(this.loopIntervalId);
      this.loopIntervalId = null;
    }
    if (this.customAudioElement) {
      try {
        this.customAudioElement.pause();
        this.customAudioElement.currentTime = 0;
      } catch {}
      this.customAudioElement = null;
    }
    if (this.currentGainNode && this.ctx) {
      try {
        this.currentGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.currentGainNode.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      } catch {}
    }
  }

  public getIsAlarmLooping(): boolean {
    return this.isLooping;
  }
}

export const AudioAlarmService = new AudioAlarmController();
