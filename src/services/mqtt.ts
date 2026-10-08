// MQTT Realtime Client according to API.md Bagian A & iot-rain-domain/SKILL.md
import mqtt, { MqttClient } from 'mqtt';
import { StatePayload, TelemetryPayload, EventPayload } from '../types/iot';

export type MqttConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface MqttCallbacks {
  onStatusChange: (status: MqttConnectionStatus, errorMsg?: string) => void;
  onStateMessage: (payload: StatePayload) => void;
  onTelemetryMessage: (payload: TelemetryPayload) => void;
  onEventMessage: (payload: EventPayload) => void;
}

export class MqttService {
  private client: MqttClient | null = null;
  private currentDeviceId: string = '';
  private currentBrokerUrl: string = '';
  private callbacks: MqttCallbacks | null = null;

  public connect(brokerUrl: string, deviceId: string, callbacks: MqttCallbacks): void {
    this.disconnect();

    this.currentDeviceId = deviceId;
    this.currentBrokerUrl = brokerUrl;
    this.callbacks = callbacks;

    const clientId = 'web-' + Math.random().toString(16).substring(2, 10);

    callbacks.onStatusChange('connecting');

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 5000,
        keepalive: 30,
      });

      this.client.on('connect', () => {
        if (!this.client) return;
        this.callbacks?.onStatusChange('connected');

        // Subscribe strictly to read-only topics for this device
        const topics = [
          `hujansensor/${deviceId}/state`,
          `hujansensor/${deviceId}/telemetry`,
          `hujansensor/${deviceId}/event`,
        ];

        this.client.subscribe(topics, { qos: 0 }, (err) => {
          if (err) {
            console.error('Failed to subscribe topics:', err);
          }
        });
      });

      this.client.on('message', (topic, message) => {
        try {
          const rawStr = message.toString();
          const json = JSON.parse(rawStr);

          // Validate version v === 1 as per API.md
          if (json.v !== 1) {
            console.warn(`Ignoring payload with unknown version: ${json.v}`);
            return;
          }

          if (topic.endsWith('/state')) {
            this.callbacks?.onStateMessage(json as StatePayload);
          } else if (topic.endsWith('/telemetry')) {
            this.callbacks?.onTelemetryMessage(json as TelemetryPayload);
          } else if (topic.endsWith('/event')) {
            this.callbacks?.onEventMessage(json as EventPayload);
          }
        } catch (e) {
          console.warn('Failed to parse incoming MQTT payload:', e);
        }
      });

      this.client.on('reconnect', () => {
        this.callbacks?.onStatusChange('connecting', 'Mencoba menyambung kembali...');
      });

      this.client.on('close', () => {
        this.callbacks?.onStatusChange('disconnected', 'Koneksi broker terputus');
      });

      this.client.on('error', (err) => {
        this.callbacks?.onStatusChange('error', err.message || 'Koneksi MQTT error');
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menginisialisasi MQTT';
      this.callbacks?.onStatusChange('error', msg);
    }
  }

  public disconnect(): void {
    if (this.client) {
      try {
        this.client.end(true);
      } catch (e) {
        console.warn('Error closing MQTT client:', e);
      }
      this.client = null;
    }
  }

  public getBrokerUrl(): string {
    return this.currentBrokerUrl;
  }

  public getDeviceId(): string {
    return this.currentDeviceId;
  }
}

export const mqttClient = new MqttService();
