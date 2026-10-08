// ESP32 Hardware Simulator adhering to firmware algorithm in iot-rain-domain/SKILL.md
import { StatePayload, TelemetryPayload, EventPayload } from '../types/iot';

export interface SimulatorState {
  isActive: boolean;
  rainMode: 'dry' | 'light_rain' | 'heavy_rain';
  temperature: number;
  humidity: number;
  batteryPct: number;
  batteryVoltage: number;
  rssi: number;
  isOnline: boolean;
  currentRaw: number;
  currentPct: number;
  ema: number;
  wet: boolean;
  sinceMs: number;
}

type SimulatorCallback = {
  onState: (p: StatePayload) => void;
  onTelemetry: (p: TelemetryPayload) => void;
  onEvent: (p: EventPayload) => void;
};

class Esp32Simulator {
  private timer: number | null = null;
  private stateTimer: number | null = null;
  private deviceId: string = 'hs-8f3a1c9d2b70';
  private callbacks: SimulatorCallback | null = null;

  // Algorithm constants from iot-rain-domain/SKILL.md
  private readonly ALPHA = 0.15;
  private readonly AMBANG = 60;
  private readonly LEPAS = 45;
  private readonly RAW_KERING = 3800;
  private readonly RAW_BASAH = 400;

  public state: SimulatorState = {
    isActive: true, // active by default if offline or demo mode
    rainMode: 'dry',
    temperature: 28.4,
    humidity: 78,
    batteryPct: 85,
    batteryVoltage: 4.02,
    rssi: -58,
    isOnline: true,
    currentRaw: 3750,
    currentPct: 4,
    ema: 4,
    wet: false,
    sinceMs: Date.now() - 3600000,
  };

  public init(deviceId: string, callbacks: SimulatorCallback): void {
    this.deviceId = deviceId;
    this.callbacks = callbacks;
    if (this.state.isActive) {
      this.start();
    }
  }

  public setRainMode(mode: 'dry' | 'light_rain' | 'heavy_rain'): void {
    this.state.rainMode = mode;
    this.step();
  }

  public setOnline(online: boolean): void {
    this.state.isOnline = online;
    if (!online) {
      this.callbacks?.onState({
        v: 1,
        deviceId: this.deviceId,
        status: 'offline',
        ts: Date.now(),
      });
      this.callbacks?.onEvent({
        v: 1,
        deviceId: this.deviceId,
        type: 'device_offline',
        ts: Date.now(),
      });
    } else {
      this.state.sinceMs = Date.now();
      this.emitState();
      this.callbacks?.onEvent({
        v: 1,
        deviceId: this.deviceId,
        type: 'device_online',
        ts: Date.now(),
      });
    }
  }

  public toggleActive(active?: boolean): boolean {
    this.state.isActive = active !== undefined ? active : !this.state.isActive;
    if (this.state.isActive) {
      this.start();
    } else {
      this.stop();
    }
    return this.state.isActive;
  }

  public start(): void {
    this.stop();
    // Emit initial retained state
    this.emitState();

    // Telemetry loop every 3 seconds (API.md Bagian A.3)
    this.timer = window.setInterval(() => {
      this.step();
    }, 3000);

    // State loop every 5 seconds (API.md Bagian A.3)
    this.stateTimer = window.setInterval(() => {
      if (this.state.isOnline) {
        this.emitState();
      }
    }, 5000);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.stateTimer) {
      clearInterval(this.stateTimer);
      this.stateTimer = null;
    }
  }

  private step(): void {
    if (!this.state.isOnline) return;

    // 1. Calculate simulated target raw ADC based on mode
    let targetRaw = this.RAW_KERING;
    if (this.state.rainMode === 'heavy_rain') {
      targetRaw = this.RAW_BASAH + (Math.random() * 200 - 100);
    } else if (this.state.rainMode === 'light_rain') {
      targetRaw = 1600 + (Math.random() * 300 - 150);
    } else {
      targetRaw = this.RAW_KERING + (Math.random() * 100 - 50);
    }
    targetRaw = Math.max(200, Math.min(4095, Math.round(targetRaw)));
    this.state.currentRaw = targetRaw;

    // 2. Map raw to percentage (0 - 100)
    // Sensor optik: RAW_KERING = 0%, RAW_BASAH = 100%
    const rawRatio = (this.RAW_KERING - targetRaw) / (this.RAW_KERING - this.RAW_BASAH);
    const targetPct = Math.max(0, Math.min(100, Math.round(rawRatio * 100)));
    this.state.currentPct = targetPct;

    // 3. EMA Smoothing (ALPHA = 0.15)
    this.state.ema = this.state.ema + this.ALPHA * (targetPct - this.state.ema);

    // 4. Hysteresis check (AMBANG = 60, LEPAS = 45)
    const prevWet = this.state.wet;
    if (!this.state.wet) {
      if (this.state.ema >= this.AMBANG) {
        this.state.wet = true;
      }
    } else {
      if (this.state.ema < this.LEPAS) {
        this.state.wet = false;
      }
    }

    const now = Date.now();

    // Check transition for events
    if (prevWet !== this.state.wet) {
      this.state.sinceMs = now;
      if (this.state.wet) {
        // rain_start
        this.callbacks?.onEvent({
          v: 1,
          deviceId: this.deviceId,
          type: 'rain_start',
          ts: now,
          data: { pct: Math.round(this.state.ema), raw: this.state.currentRaw },
        });
      } else {
        // rain_stop
        this.callbacks?.onEvent({
          v: 1,
          deviceId: this.deviceId,
          type: 'rain_stop',
          ts: now,
          data: { pct: Math.round(this.state.ema), raw: this.state.currentRaw },
        });
      }
    }

    // Fluctuate environment slightly
    this.state.temperature = +(28.2 + (Math.random() * 0.4 - 0.2)).toFixed(1);
    this.state.humidity = +(this.state.wet ? 92 : 75 + Math.round(Math.random() * 4 - 2));

    // Emit telemetry
    this.callbacks?.onTelemetry({
      v: 1,
      deviceId: this.deviceId,
      ts: now,
      raw: this.state.currentRaw,
      pct: Math.round(this.state.ema),
      wet: this.state.wet,
      tempC: this.state.temperature,
      hum: this.state.humidity,
      vbat: this.state.batteryVoltage,
      rssi: this.state.rssi,
    });
  }

  private emitState(): void {
    this.callbacks?.onState({
      v: 1,
      deviceId: this.deviceId,
      status: this.state.isOnline ? 'online' : 'offline',
      fw: '1.0.0',
      ts: Date.now(),
      uptimeS: Math.floor((Date.now() - this.state.sinceMs) / 1000) + 1240,
      rssi: this.state.rssi,
      ip: '192.168.1.42',
      rain: {
        raw: this.state.currentRaw,
        pct: Math.round(this.state.ema),
        wet: this.state.wet,
        thresholdPct: this.AMBANG,
        sinceMs: this.state.sinceMs,
      },
      env: {
        tempC: this.state.temperature,
        hum: this.state.humidity,
      },
      power: {
        vbat: this.state.batteryVoltage,
        pct: this.state.batteryPct,
        charging: false,
      },
      loc: {
        adm4: '31.71.03.1001',
      },
    });
  }
}

export const simulator = new Esp32Simulator();
