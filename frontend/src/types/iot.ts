// Types for IoT Sensor Hujan Jemuran based on API.md and ERD.md

export interface Perangkat {
  deviceId: string; // 12 hex prefix 'hs-', e.g. 'hs-8f3a1c9d2b70'
  nama: string; // e.g. 'Jemuran Utama'
  brokerUrl: string; // e.g. 'wss://broker.emqx.io:8884/mqtt'
  lokasiAdm4: string; // e.g. '31.71.03.1001'
  fwVersi: string;
  lastSeenTs: number;
  online: boolean;
  ambangPct: number;
  deteksiBerkepanjanganMs?: number;
}

export interface PembacaanHujan {
  deviceId: string;
  ts: number; // epoch ms
  raw: number; // ADC 0-4095
  pct: number; // 0-100%
  wet: boolean; // hysteresis result
  suhuC: number | null; // null if no DHT22
  lembapPct: number | null; // null if no DHT22
  bateraiV: number | null; // voltage (e.g. 3.91V)
  bateraiPct: number | null; // 0-100%
  rssi: number | null; // dBm e.g. -58
}

export type JenisPeristiwa =
  | 'rain_start'
  | 'rain_stop'
  | 'device_boot'
  | 'wifi_fail'
  | 'mqtt_retry'
  | 'device_online'
  | 'device_offline';

export interface Peristiwa {
  deviceId: string;
  ts: number;
  jenis: JenisPeristiwa;
  data?: Record<string, unknown>;
}

export interface Notifikasi {
  id: string;
  deviceId: string;
  ts: number;
  saluran: 'in_app' | 'browser' | 'telegram';
  judul: string;
  isi: string;
  dibaca: boolean;
}

export interface Pengaturan {
  deviceIdActive: string;
  tema: 'light' | 'dark' | 'system';
  rentangGrafik: '5m' | '1h' | 'session';
  izinNotif: boolean;
  ambangPlotting: number;
  backendUrl?: string;
}

// MQTT Payloads Schema v1
export interface StatePayload {
  v: number;
  deviceId: string;
  status: 'online' | 'offline';
  fw?: string;
  ts?: number;
  uptimeS?: number;
  rssi?: number;
  ip?: string;
  rain?: {
    raw: number;
    pct: number;
    wet: boolean;
    thresholdPct: number;
    sinceMs: number;
  };
  env?: {
    tempC: number;
    hum: number;
  } | null;
  power?: {
    vbat: number;
    pct: number;
    charging: boolean;
  } | null;
  loc?: {
    adm4: string;
  };
}

export interface TelemetryPayload {
  v: number;
  deviceId: string;
  ts: number;
  raw: number;
  pct: number;
  wet: boolean;
  tempC?: number | null;
  hum?: number | null;
  vbat?: number | null;
  rssi?: number | null;
}

export interface EventPayload {
  v: number;
  deviceId: string;
  type: JenisPeristiwa;
  ts: number;
  data?: Record<string, unknown>;
}
