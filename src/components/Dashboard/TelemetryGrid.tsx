import React from 'react';
import {
  Thermometer,
  Droplets,
  Battery,
  BatteryCharging,
  Wifi,
  Activity,
  Cpu,
  Clock,
} from 'lucide-react';
import { Card } from '../Common/Card';

interface TelemetryGridProps {
  raw: number | null;
  pct: number | null;
  tempC: number | null;
  hum: number | null;
  vbat: number | null;
  batteryPct: number | null;
  charging?: boolean;
  rssi: number | null;
  uptimeS: number | null;
  fwVersion: string | null;
  isStale?: boolean;
}

export const TelemetryGrid: React.FC<TelemetryGridProps> = ({
  raw,
  pct,
  tempC,
  hum,
  vbat,
  batteryPct,
  charging = false,
  rssi,
  uptimeS,
  fwVersion,
  isStale = false,
}) => {
  // Format uptime into human-readable string
  const formatUptime = (seconds: number | null) => {
    if (seconds == null) return '—';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}h ${h}j ${m}m`;
    if (h > 0) return `${h}j ${m}m`;
    return `${m}m ${seconds % 60}s`;
  };

  // Convert RSSI dBm to qualitative description
  const getRssiQuality = (dbm: number | null) => {
    if (dbm == null) return '—';
    if (dbm >= -60) return 'Sangat Baik';
    if (dbm >= -70) return 'Baik';
    if (dbm >= -80) return 'Sedang';
    return 'Lemah';
  };

  return (
    <section aria-label="Telemetri Perangkat" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-teks-sekunder uppercase">
          Telemetri Sensor & Perangkat
        </h3>
        {isStale && (
          <span className="text-[11px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Data Basi (&gt;90s)
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 1. Suhu Lingkungan */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-teks-sekunder">
            <span className="text-xs font-medium">Suhu Udara</span>
            <Thermometer className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-3xl font-extrabold text-teks-utama tracking-tight">
              {tempC != null ? `${tempC}°C` : '—'}
            </div>
            <p className="text-[11px] text-teks-sekunder mt-0.5">
              {tempC != null ? 'Sensor DHT22' : 'DHT22 tidak terpasang'}
            </p>
          </div>
        </Card>

        {/* 2. Kelembapan Lingkungan */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-teks-sekunder">
            <span className="text-xs font-medium">Kelembapan</span>
            <Droplets className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-3xl font-extrabold text-teks-utama tracking-tight">
              {hum != null ? `${hum}%` : '—'}
            </div>
            <p className="text-[11px] text-teks-sekunder mt-0.5">
              {hum != null ? 'Kelembapan relatif' : 'DHT22 tidak terpasang'}
            </p>
          </div>
        </Card>

        {/* 3. Baterai & Daya */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-teks-sekunder">
            <span className="text-xs font-medium">Daya Baterai</span>
            {charging ? (
              <BatteryCharging className="w-4 h-4 text-green-500" />
            ) : (
              <Battery className="w-4 h-4 text-blue-500" />
            )}
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-3xl font-extrabold text-teks-utama tracking-tight flex items-baseline gap-1.5">
              <span>{batteryPct != null ? `${batteryPct}%` : '—'}</span>
              {vbat != null && (
                <span className="text-xs font-medium text-teks-sekunder">
                  ({vbat.toFixed(2)}V)
                </span>
              )}
            </div>
            <p className="text-[11px] text-teks-sekunder mt-0.5">
              {charging ? 'Sedang Mengisi' : vbat != null ? 'Baterai Li-ion' : 'Sumber USB Langsung'}
            </p>
          </div>
        </Card>

        {/* 4. Sinyal WiFi */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-teks-sekunder">
            <span className="text-xs font-medium">Sinyal WiFi</span>
            <Wifi className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-3xl font-extrabold text-teks-utama tracking-tight">
              {rssi != null ? `${rssi} dBm` : '—'}
            </div>
            <p className="text-[11px] text-teks-sekunder mt-0.5">
              {getRssiQuality(rssi)}
            </p>
          </div>
        </Card>

        {/* 5. Analog ADC Raw */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-teks-sekunder">
            <span className="text-xs font-medium">Analog Raw (ADC)</span>
            <Activity className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-3xl font-extrabold text-teks-utama tracking-tight font-mono">
              {raw != null ? raw : '—'}
            </div>
            <p className="text-[11px] text-teks-sekunder mt-0.5">
              Rentang ADC 0 – 4095
            </p>
          </div>
        </Card>

        {/* 6. Persentase Basah */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-teks-sekunder">
            <span className="text-xs font-medium">Tingkat Basah</span>
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-3xl font-extrabold text-teks-utama tracking-tight font-mono">
              {pct != null ? `${pct}%` : '—'}
            </div>
            <p className="text-[11px] text-teks-sekunder mt-0.5">
              Hasil normalisasi & EMA
            </p>
          </div>
        </Card>

        {/* 7. Uptime Perangkat */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-teks-sekunder">
            <span className="text-xs font-medium">Uptime ESP32</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-3xl font-extrabold text-teks-utama tracking-tight">
              {formatUptime(uptimeS)}
            </div>
            <p className="text-[11px] text-teks-sekunder mt-0.5">
              Sejak boot terakhir
            </p>
          </div>
        </Card>

        {/* 8. Firmware & Sistem */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-teks-sekunder">
            <span className="text-xs font-medium">Firmware</span>
            <Cpu className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-3xl font-extrabold text-teks-utama tracking-tight font-mono">
              {fwVersion ? `v${fwVersion}` : '—'}
            </div>
            <p className="text-[11px] text-teks-sekunder mt-0.5">
              Protokol Payload v1
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};
