// Browser Notification & In-App Alerts Service

export interface InAppToast {
  id: string;
  type: 'info' | 'rain' | 'warning' | 'success' | 'danger';
  title: string;
  message: string;
  timestamp: number;
}

type ToastListener = (toasts: InAppToast[]) => void;

class NotificationService {
  private listeners: Set<ToastListener> = new Set();
  private activeToasts: InAppToast[] = [];
  private lastRainAlertTs = 0;
  private readonly COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes cooldown

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const res = await Notification.requestPermission();
      return res;
    } catch {
      return 'denied';
    }
  }

  public playAlertSound(type: 'rain' | 'info' | 'warning'): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'rain') {
        // High alert tone sequence (880Hz -> 660Hz -> 880Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(587, ctx.currentTime + 0.15);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else {
        // Gentle beep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      console.warn('Audio playback not allowed or failed:', e);
    }
  }

  public showRainAlert(deviceName: string, wetPct: number, raw: number): boolean {
    const now = Date.now();
    if (now - this.lastRainAlertTs < this.COOLDOWN_MS) {
      console.log('Rain alert suppressed by 10-minute cooldown');
      return false;
    }
    this.lastRainAlertTs = now;

    const title = '🌧️ Hujan Terdeteksi!';
    const message = `Sensor di "${deviceName}" mendeteksi basah ${wetPct}% (analog ${raw}). Segera amankan jemuran Anda!`;

    // 1. Play sound
    this.playAlertSound('rain');

    // 2. In-app toast
    this.addToast({
      id: 'rain-' + now,
      type: 'rain',
      title,
      message,
      timestamp: now,
    });

    // 3. Browser native notification if granted
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/icons/icon-192.svg',
          tag: 'hujan-alert',
        });
      } catch (err) {
        console.warn('Native notification failed:', err);
      }
    }

    return true;
  }

  public addToast(toast: InAppToast): void {
    this.activeToasts = [toast, ...this.activeToasts.slice(0, 4)];
    this.notify();

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      this.dismissToast(toast.id);
    }, 6000);
  }

  public dismissToast(id: string): void {
    this.activeToasts = this.activeToasts.filter((t) => t.id !== id);
    this.notify();
  }

  public subscribeToasts(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener(this.activeToasts);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l([...this.activeToasts]));
  }
}

export const Notifications = new NotificationService();
