// LocalStorage Manager according to ERD.md rules
import { Perangkat, PembacaanHujan, Peristiwa, Notifikasi, Pengaturan } from '../types/iot';
import { BmkgResponse } from '../types/bmkg';

const KEYS = {
  DEVICES: 'hujan.devices',
  SETTINGS: 'hujan.settings',
  READINGS_PREFIX: 'hujan.readings.',
  EVENTS_PREFIX: 'hujan.events.',
  NOTIFICATIONS_PREFIX: 'hujan.notifications.',
  BMKG_PREFIX: 'hujan.bmkg.cache.',
};

const DEFAULT_DEVICE: Perangkat = {
  deviceId: 'hs-8f3a1c9d2b70',
  nama: 'Jemuran Utama',
  brokerUrl: 'wss://test.mosquitto.org:8081/mqtt',
  lokasiAdm4: '31.71.03.1001',
  fwVersi: '1.0.0',
  lastSeenTs: Date.now(),
  online: true,
  ambangPct: 60,
  deteksiBerkepanjanganMs: 60000,
};

const DEFAULT_SETTINGS: Pengaturan = {
  deviceIdActive: 'hs-8f3a1c9d2b70',
  tema: 'system',
  rentangGrafik: '1h',
  izinNotif: false,
  ambangPlotting: 60,
};

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e: unknown) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      console.warn('Storage quota exceeded. Pruning old readings and retrying...');
      // Prune all readings by half
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(KEYS.READINGS_PREFIX)) {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                localStorage.setItem(k, JSON.stringify(list.slice(Math.floor(list.length / 2))));
              }
            }
          } catch {
            localStorage.removeItem(k);
          }
        }
      }
      try {
        localStorage.setItem(key, value);
      } catch (retryErr) {
        console.error('Failed to write to localStorage after pruning:', retryErr);
      }
    }
  }
}

export const StorageService = {
  getDevices(): Perangkat[] {
    try {
      const raw = localStorage.getItem(KEYS.DEVICES);
      if (!raw) return [DEFAULT_DEVICE];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_DEVICE];
    } catch {
      return [DEFAULT_DEVICE];
    }
  },

  saveDevices(devices: Perangkat[]): void {
    const trimmed = devices.slice(0, 5); // Max 5 devices
    safeSetItem(KEYS.DEVICES, JSON.stringify(trimmed));
  },

  getSettings(): Pengaturan {
    try {
      const raw = localStorage.getItem(KEYS.SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Pengaturan): void {
    safeSetItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  getReadings(deviceId: string): PembacaanHujan[] {
    try {
      const raw = localStorage.getItem(KEYS.READINGS_PREFIX + deviceId);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveReadings(deviceId: string, readings: PembacaanHujan[]): void {
    const trimmed = readings.slice(-1000); // Ring buffer max 1000 items
    safeSetItem(KEYS.READINGS_PREFIX + deviceId, JSON.stringify(trimmed));
  },

  getEvents(deviceId: string): Peristiwa[] {
    try {
      const raw = localStorage.getItem(KEYS.EVENTS_PREFIX + deviceId);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveEvents(deviceId: string, events: Peristiwa[]): void {
    const trimmed = events.slice(-200); // Max 200 events
    safeSetItem(KEYS.EVENTS_PREFIX + deviceId, JSON.stringify(trimmed));
  },

  addEvent(deviceId: string, event: Peristiwa): void {
    const current = this.getEvents(deviceId);
    current.push(event);
    this.saveEvents(deviceId, current);
  },

  getNotifications(deviceId: string): Notifikasi[] {
    try {
      const raw = localStorage.getItem(KEYS.NOTIFICATIONS_PREFIX + deviceId);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveNotifications(deviceId: string, notifications: Notifikasi[]): void {
    const trimmed = notifications.slice(-100);
    safeSetItem(KEYS.NOTIFICATIONS_PREFIX + deviceId, JSON.stringify(trimmed));
  },

  addNotification(deviceId: string, notif: Notifikasi): void {
    const current = this.getNotifications(deviceId);
    current.unshift(notif);
    this.saveNotifications(deviceId, current);
  },

  getBmkgCache(adm4: string): { data: BmkgResponse; isStale: boolean } | null {
    try {
      const raw = localStorage.getItem(KEYS.BMKG_PREFIX + adm4);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { ts: number; data: BmkgResponse };
      if (!parsed || !parsed.ts || !parsed.data) return null;
      const TTL = 3 * 60 * 60 * 1000; // 3 hours in ms
      const isStale = Date.now() - parsed.ts > TTL;
      return { data: parsed.data, isStale };
    } catch {
      return null;
    }
  },

  saveBmkgCache(adm4: string, data: BmkgResponse): void {
    const record = {
      ts: Date.now(),
      data,
    };
    safeSetItem(KEYS.BMKG_PREFIX + adm4, JSON.stringify(record));
  },

  clearAllData(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('hujan.')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.error('Error clearing data:', e);
    }
  },
};
