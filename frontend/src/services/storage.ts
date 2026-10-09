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
  deviceId: 'hs-24e1796dc9a1',
  nama: 'Jemuran ESP32 Utama',
  brokerUrl: 'wss://43-133-136-149.sslip.io/ws',
  lokasiAdm4: '31.71.03.1001',
  fwVersi: '1.1.0',
  lastSeenTs: 0,
  online: false,
  ambangPct: 60,
  deteksiBerkepanjanganMs: 60000,
};

export function getDefaultBackendUrl(): string {
  // If explicitly specified in Vite build environment
  const metaEnv = (import.meta as { env?: Record<string, string> }).env;
  if (metaEnv?.VITE_BACKEND_URL) {
    return metaEnv.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    // Staging / Dev detection:
    if (
      host.includes('staging') ||
      host.includes('-git-staging') ||
      host.includes('dev') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    ) {
      return 'https://staging-43-133-136-149.sslip.io';
    }
    // Production (e.g. rintik-self.vercel.app, main branch, or custom domain)
    return 'https://43-133-136-149.sslip.io';
  }
  return 'https://staging-43-133-136-149.sslip.io';
}

const DEFAULT_SETTINGS: Pengaturan = {
  deviceIdActive: 'hs-24e1796dc9a1',
  tema: 'system',
  rentangGrafik: '1h',
  izinNotif: false,
  ambangPlotting: 60,
  backendUrl: getDefaultBackendUrl(),
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
  getDevices(userId?: string): Perangkat[] {
    try {
      const key = userId ? `${KEYS.DEVICES}.${userId}` : KEYS.DEVICES;
      const raw = localStorage.getItem(key);
      if (!raw) return [DEFAULT_DEVICE];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((d: Perangkat) => {
          const validTs = d.lastSeenTs && d.lastSeenTs > 1577836800000 ? d.lastSeenTs : 0;
          const isOnline = validTs > 0 && Date.now() - validTs <= 15000;
          return {
            ...d,
            lastSeenTs: validTs,
            online: isOnline,
          };
        });
      }
      return [DEFAULT_DEVICE];
    } catch {
      return [DEFAULT_DEVICE];
    }
  },

  saveDevices(devices: Perangkat[], userId?: string): void {
    const key = userId ? `${KEYS.DEVICES}.${userId}` : KEYS.DEVICES;
    const trimmed = devices.slice(0, 5); // Max 5 devices
    safeSetItem(key, JSON.stringify(trimmed));
  },

  getSettings(): Pengaturan {
    try {
      const raw = localStorage.getItem(KEYS.SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      // Always resolve backend URL automatically based on the environment
      parsed.backendUrl = getDefaultBackendUrl();
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
