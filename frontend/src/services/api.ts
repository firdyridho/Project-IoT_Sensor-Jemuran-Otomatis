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

  async getDevices(baseUrl: string): Promise<Perangkat[]> {
    if (!baseUrl) return [];
    try {
      const clean = baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${clean}/api/devices`);
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((item: any) => ({
        deviceId: item.deviceId,
        nama: item.name,
        brokerUrl: item.brokerUrl || 'wss://test.mosquitto.org:8081/mqtt',
        lokasiAdm4: item.lokasiAdm4 || '31.71.03.1001',
        fwVersi: '1.0.0',
        lastSeenTs: item.lastSeenAt ? new Date(item.lastSeenAt).getTime() : Date.now(),
        online: item.status === 'online',
        ambangPct: item.ambangPct || 60,
      }));
    } catch {
      return [];
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

  connectWebSocket(
    baseUrl: string,
    callbacks: {
      onTelemetry?: (data: TelemetryPayload) => void;
      onState?: (data: StatePayload) => void;
      onEvent?: (data: EventPayload) => void;
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
