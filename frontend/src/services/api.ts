// Service for interacting with Tencent Lighthouse Golang Backend API & WebSocket
import { Perangkat, PembacaanHujan, Peristiwa, TelemetryPayload, StatePayload, EventPayload } from '../types/iot';

export interface BackendHealth {
  status: string;
  app: string;
  version: string;
}

export const BackendService = {
  async checkHealth(baseUrl: string): Promise<BackendHealth | null> {
    if (!baseUrl) return null;
    try {
      const clean = baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${clean}/health`, { method: 'GET' });
      if (res.ok) {
        return (await res.json()) as BackendHealth;
      }
      return null;
    } catch {
      return null;
    }
  },

  async getDevices(baseUrl: string, userId?: string, token?: string): Promise<Perangkat[]> {
    if (!baseUrl) return [];
    try {
      const clean = baseUrl.replace(/\/+$/, '');
      const url = userId ? `${clean}/api/devices?userId=${encodeURIComponent(userId)}` : `${clean}/api/devices`;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(url, { headers });
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((item: any) => {
        const parsedTs = item.lastSeenAt ? new Date(item.lastSeenAt).getTime() : 0;
        const validTs = parsedTs > 1577836800000 ? parsedTs : 0;
        const isOnline = item.status === 'online' && validTs > 0 && Date.now() - validTs <= 15000;
        return {
          deviceId: item.deviceId,
          nama: item.name,
          brokerUrl: item.brokerUrl || 'wss://43-133-136-149.sslip.io/ws',
          lokasiAdm4: item.lokasiAdm4 || '31.71.03.1001',
          fwVersi: '1.0.0',
          lastSeenTs: validTs,
          online: isOnline,
          ambangPct: item.ambangPct || 60,
        };
      });
    } catch {
      return [];
    }
  },

  async getLatest(baseUrl: string, deviceId: string): Promise<{ status: string; isStale: boolean; lastSeenAt: string; telemetry?: any } | null> {
    if (!baseUrl || !deviceId) return null;
    try {
      const clean = baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${clean}/api/devices/${encodeURIComponent(deviceId)}/latest`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async createDevice(baseUrl: string, device: Perangkat, userId?: string, token?: string): Promise<boolean> {
    if (!baseUrl) return false;
    try {
      const clean = baseUrl.replace(/\/+$/, '');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${clean}/api/devices`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          deviceId: device.deviceId,
          userId: userId || undefined,
          name: device.nama,
          brokerUrl: device.brokerUrl,
          lokasiAdm4: device.lokasiAdm4,
          ambangPct: device.ambangPct || 60,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateDevice(baseUrl: string, device: Perangkat): Promise<boolean> {
    if (!baseUrl) return false;
    try {
      const clean = baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${clean}/api/devices/${encodeURIComponent(device.deviceId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: device.nama,
          brokerUrl: device.brokerUrl,
          lokasiAdm4: device.lokasiAdm4,
          ambangPct: device.ambangPct || 60,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteDevice(baseUrl: string, deviceId: string, token?: string): Promise<boolean> {
    if (!baseUrl) return false;
    try {
      const clean = baseUrl.replace(/\/+$/, '');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${clean}/api/devices/${encodeURIComponent(deviceId)}`, {
        method: 'DELETE',
        headers,
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getTelemetry(baseUrl: string, deviceId: string, range: string): Promise<PembacaanHujan[]> {
    if (!baseUrl || !deviceId) return [];
    try {
      const clean = baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${clean}/api/devices/${deviceId}/telemetry?range=${range}&limit=1000`);
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((item: any) => ({
        deviceId: item.deviceId,
        ts: item.ts,
        raw: item.raw,
        pct: item.pct,
        wet: item.wet,
        suhuC: item.tempC ?? null,
        lembapPct: item.hum ?? null,
        bateraiV: item.vbat ?? null,
        bateraiPct: item.vbat != null ? Math.min(100, Math.round(((item.vbat - 3.2) / 1.0) * 100)) : null,
        rssi: item.rssi ?? null,
      }));
    } catch {
      return [];
    }
  },

  async getEvents(baseUrl: string, deviceId: string): Promise<Peristiwa[]> {
    if (!baseUrl || !deviceId) return [];
    try {
      const clean = baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${clean}/api/devices/${deviceId}/events?limit=100`);
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((item: any) => {
        let dataParsed = {};
        try {
          if (item.data) dataParsed = JSON.parse(item.data);
        } catch {
          // empty
        }
        return {
          deviceId: item.deviceId,
          ts: item.ts,
          jenis: item.type,
          data: dataParsed,
        };
      });
    } catch {
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // AI Engine Endpoints (BE-05, BE-06)
  // ---------------------------------------------------------------------------
  async predictRain(
    baseUrl: string,
    deviceId: string,
    lookbackMinutes: number = 30
  ): Promise<import('../types/ai').AIPredictResponse | null> {
    if (!baseUrl || !deviceId) return null;
    try {
      const clean = baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${clean}/api/ai/predict-rain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, lookbackMinutes }),
      });
      if (res.ok) {
        return (await res.json()) as import('../types/ai').AIPredictResponse;
      }
      return null;
    } catch {
      return null;
    }
  },

  async getDryingAdvice(
    baseUrl: string,
    deviceId: string
  ): Promise<import('../types/ai').AIDryingAdviceResponse | null> {
    if (!baseUrl || !deviceId) return null;
    try {
      const clean = baseUrl.replace(/\/+$/, '');
      const res = await fetch(
        `${clean}/api/ai/drying-advice?deviceId=${encodeURIComponent(deviceId)}`
      );
      if (res.ok) {
        return (await res.json()) as import('../types/ai').AIDryingAdviceResponse;
      }
      return null;
    } catch {
      return null;
    }
  },

  async getAIPredictionsHistory(
    baseUrl: string,
    deviceId: string
  ): Promise<{ status?: string; total?: number; accuracyRatePct?: number; logs?: any[] } | null> {
    if (!baseUrl || !deviceId) return null;
    try {
      const clean = baseUrl.replace(/\/+$/, '');
      const res = await fetch(
        `${clean}/api/ai/predictions/history?deviceId=${encodeURIComponent(deviceId)}&limit=50`
      );
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  },

  // ---------------------------------------------------------------------------
  // Motor DC & Canopy Status/Commands (REQ-BE-01 / BE-13)
  // ---------------------------------------------------------------------------
  async getMotorStatus(
    baseUrl: string,
    deviceId: string
  ): Promise<{ position: 'sheltered' | 'extended'; status: 'idle' | 'moving'; lastMovedTs: number } | null> {
    if (!baseUrl || !deviceId) return null;
    try {
      const clean = baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${clean}/api/devices/${encodeURIComponent(deviceId)}/motor`);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  },

  async commandMotor(
    baseUrl: string,
    deviceId: string,
    action: 'retract' | 'extend'
  ): Promise<boolean> {
    if (!baseUrl || !deviceId) return false;
    try {
      const clean = baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${clean}/api/devices/${encodeURIComponent(deviceId)}/motor/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  connectWebSocket(
    baseUrl: string,
    callbacks: {
      onTelemetry?: (data: TelemetryPayload) => void;
      onState?: (data: StatePayload) => void;
      onEvent?: (data: EventPayload) => void;
      onForecastAlert?: (data: import('../types/ai').RainForecastAlertPayload) => void;
      onStatusChange?: (connected: boolean) => void;
    }
  ): () => void {
    if (!baseUrl) return () => {};

    const clean = baseUrl.replace(/\/+$/, '');
    const wsProto = clean.startsWith('https') ? 'wss:' : 'ws:';
    const host = clean.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProto}//${host}/ws`;

    let ws: WebSocket | null = null;
    let reconnectTimeout: number | null = null;
    let isClosedManually = false;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          callbacks.onStatusChange?.(true);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'telemetry') {
              callbacks.onTelemetry?.(msg.payload);
            } else if (msg.type === 'state') {
              callbacks.onState?.(msg.payload);
            } else if (msg.type === 'event') {
              callbacks.onEvent?.(msg.payload);
            } else if (msg.type === 'rain_forecast_alert' || msg.alert === 'rain_forecast_alert') {
              callbacks.onForecastAlert?.(msg.payload || msg);
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          callbacks.onStatusChange?.(false);
          if (!isClosedManually) {
            reconnectTimeout = window.setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          callbacks.onStatusChange?.(false);
          ws?.close();
        };
      } catch {
        callbacks.onStatusChange?.(false);
      }
    };

    connect();

    return () => {
      isClosedManually = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      ws?.close();
    };
  },
};
