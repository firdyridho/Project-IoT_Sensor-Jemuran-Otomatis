/**
 * Weather Audio Synthesizer using Web Audio API
 * Generates procedural realistic rain, drizzle, and thunder sounds without external audio file dependencies.
 */

class WeatherAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private thunderGain: GainNode | null = null;
  private isMuted: boolean = true; // Default muted to respect autoplay
  private currentCondition: 'cerah' | 'gerimis' | 'hujan' | 'badai' = 'cerah';
  private thunderTimer: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.generateNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Pre-generate 5 seconds of pinkish noise for realistic rain texture
   */
  private generateNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise filter approximation (Paul Kellet's algorithm)
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    this.noiseBuffer = buffer;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    } else {
      this.initContext();
      this.play(this.currentCondition);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public play(condition: 'cerah' | 'gerimis' | 'hujan' | 'badai') {
    this.currentCondition = condition;

    if (this.isMuted || condition === 'cerah') {
      this.stop();
      return;
    }

    this.initContext();
    if (!this.ctx || !this.noiseBuffer) return;

    // Stop existing thunder timer
    if (this.thunderTimer) {
      window.clearTimeout(this.thunderTimer);
      this.thunderTimer = null;
    }

    // Configure rain sounds based on condition
    let targetGain = 0;
    let filterFreq = 1200;
    let filterQ = 0.8;

    if (condition === 'gerimis') {
      targetGain = 0.18;
      filterFreq = 1400; // soft higher-frequency drizzle
      filterQ = 0.5;
    } else if (condition === 'hujan') {
      targetGain = 0.38;
      filterFreq = 950; // fuller rain resonance
      filterQ = 0.9;
    } else if (condition === 'badai') {
      targetGain = 0.55;
      filterFreq = 800; // heavy pouring rain
      filterQ = 1.2;
      this.scheduleRandomThunder();
    }

    if (!this.noiseNode) {
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = this.noiseBuffer;
      this.noiseNode.loop = true;

      this.rainFilter = this.ctx.createBiquadFilter();
      this.rainFilter.type = 'lowpass';
      this.rainFilter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
      this.rainFilter.Q.setValueAtTime(filterQ, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.rainGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 1.2);

      this.noiseNode.connect(this.rainFilter);
      this.rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.ctx.destination);

      this.noiseNode.start(0);
    } else if (this.rainGain && this.rainFilter) {
      this.rainGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.8);
      this.rainFilter.frequency.linearRampToValueAtTime(filterFreq, this.ctx.currentTime + 0.8);
    }
  }

  /**
   * Synthesize a realistic thunder clap (halilintar)
   */
  public triggerThunder() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Initial sharp crackle (lightning bolt crack)
    const crackleBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.4), this.ctx.sampleRate);
    const crackleData = crackleBuffer.getChannelData(0);
    for (let i = 0; i < crackleData.length; i++) {
      crackleData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }

    const crackleSource = this.ctx.createBufferSource();
    crackleSource.buffer = crackleBuffer;

    const crackleFilter = this.ctx.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.setValueAtTime(800, now);

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.setValueAtTime(0.5, now);
    crackleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    crackleSource.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(this.ctx.destination);
    crackleSource.start(now);

    // 2. Deep rolling rumble (sub-bass boom + decaying resonance)
    const rumbleOsc = this.ctx.createOscillator();
    rumbleOsc.type = 'sawtooth';
    rumbleOsc.frequency.setValueAtTime(85, now);
    rumbleOsc.frequency.exponentialRampToValueAtTime(32, now + 2.8);

    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(140, now);
    rumbleFilter.frequency.exponentialRampToValueAtTime(50, now + 3.0);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.7, now + 0.05);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

    rumbleOsc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.ctx.destination);

    rumbleOsc.start(now + 0.04);
    rumbleOsc.stop(now + 3.3);
  }

  private scheduleRandomThunder() {
    if (this.currentCondition !== 'badai' || this.isMuted) return;

    // Trigger thunderclap every 6 to 12 seconds in storm mode
    const delay = 6000 + Math.random() * 6000;
    this.thunderTimer = window.setTimeout(() => {
      this.triggerThunder();
      this.scheduleRandomThunder();
    }, delay);
  }

  public stop() {
    if (this.thunderTimer) {
      window.clearTimeout(this.thunderTimer);
      this.thunderTimer = null;
    }

    if (this.rainGain && this.ctx) {
      this.rainGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
      setTimeout(() => {
        if (this.noiseNode) {
          try {
            this.noiseNode.stop();
            this.noiseNode.disconnect();
          } catch {
            // ignore if already stopped
          }
          this.noiseNode = null;
        }
      }, 500);
    }
  }

  /**
   * Preview rain alarm sound for settings (FE-10)
   */
  public previewAlarmSound(type: 'sirine' | 'bell' | 'hujan', volumePct: number = 70) {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    const vol = Math.max(0.05, Math.min(1, volumePct / 100));
    gain.connect(this.ctx.destination);

    if (type === 'sirine') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.3);
      osc.frequency.linearRampToValueAtTime(600, now + 0.6);
      osc.frequency.linearRampToValueAtTime(950, now + 0.9);
      osc.frequency.linearRampToValueAtTime(600, now + 1.2);

      gain.gain.setValueAtTime(vol * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 1.3);
    } else if (type === 'bell') {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc2.frequency.setValueAtTime(1760, now); // A6 overtone

      gain.gain.setValueAtTime(vol * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc1.connect(gain);
      osc2.connect(gain);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.5);
      osc2.stop(now + 1.5);
    } else {
      // type === 'hujan'
      if (!this.noiseBuffer) return;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      gain.gain.setValueAtTime(vol * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      noise.connect(filter);
      filter.connect(gain);
      noise.start(now);
      noise.stop(now + 2.0);
    }
  }
}

export const weatherAudio = new WeatherAudioSynthesizer();
