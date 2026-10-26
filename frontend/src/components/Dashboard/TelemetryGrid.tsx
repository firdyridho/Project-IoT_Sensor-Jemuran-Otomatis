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
  Zap,
  Sun,
} from 'lucide-react';
import { Card } from '../Common/Card';

interface TelemetryGridProps {
  raw: number | null;
  pct: number | null;
  ldrRaw?: number | null;
  isMendung?: boolean | null;
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
  ldrRaw,
  isMendung,
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

  const hasDht = tempC != null || hum != null;
  const hasBattery = vbat != null || batteryPct != null;

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Analog ADC Raw (Sensor FC-37) */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-teks-sekunder">
            <span className="text-xs font-medium">ADC Sensor Hujan (FC-37)</span>
            <Activity className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-3xl font-extrabold text-teks-utama tracking-tight font-mono">
              {raw != null ? raw : '—'}
            </div>
            <p className="text-[11px] text-teks-sekunder mt-0.5">
              Rentang 0 (Basah) – 4095 (Kering)
            </p>
          </div>
        </Card>

        {/* 2. Persentase Basah (Normalisasi & Schmitt Trigger Histeresis) */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-teks-sekunder">
            <span className="text-xs font-medium">Tingkat Kebasahan</span>
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-3xl font-extrabold text-teks-utama tracking-tight font-mono">
              {pct != null ? `${pct}%` : '—'}
            </div>
            <p className="text-[11px] text-teks-sekunder mt-0.5">
              Normalisasi Histeresis Latch
            </p>
          </div>
        </Card>

        {/* 3. Sensor Cahaya LDR Hardware (REQ-FE-20) */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-teks-sekunder">
            <span className="text-xs font-medium">Sensor Cahaya (LDR)</span>
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-3xl font-extrabold text-teks-utama tracking-tight font-mono flex items-baseline justify-between">
              <span>{ldrRaw != null ? ldrRaw : '—'}</span>
              {isMendung != null && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isMendung
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isMendung ? 'Mendung' : 'Terang'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-teks-sekunder mt-0.5">
              ADC Optik 0 (Terik) – 4095 (Gelap)
            </p>
          </div>
        </Card>

        {/* 4. Sinyal WiFi (RSSI) */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-teks-sekunder">
            <span className="text-xs font-medium">Sinyal WiFi ESP32</span>
            <Wifi className="w-4 h-4 text-emerald-500" />
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

        {/* 4. Suplai Daya & Uptime ESP32 */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-teks-sekunder">
            <span className="text-xs font-medium">Suplai Daya & Uptime</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-3xl font-extrabold text-teks-utama tracking-tight">
              {formatUptime(uptimeS)}
            </div>
            <p className="text-[11px] text-teks-sekunder mt-0.5">
              Adaptor USB 5V Aktif
            </p>
          </div>
        </Card>

        {/* 5. Opsional jika terpasang: Suhu Udara (DHT22) */}
        {hasDht && tempC != null && (
          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-teks-sekunder">
              <span className="text-xs font-medium">Suhu Udara</span>
              <Thermometer className="w-4 h-4 text-orange-500" />
            </div>
            <div className="mt-2">
              <div className="text-2xl md:text-3xl font-extrabold text-teks-utama tracking-tight">
                {tempC}°C
              </div>
              <p className="text-[11px] text-teks-sekunder mt-0.5">
                Sensor Suhu
              </p>
            </div>
          </Card>
        )}

        {/* 6. Opsional jika terpasang: Kelembapan Lingkungan (DHT22) */}
        {hasDht && hum != null && (
          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-teks-sekunder">
              <span className="text-xs font-medium">Kelembapan Udara</span>
              <Droplets className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="mt-2">
              <div className="text-2xl md:text-3xl font-extrabold text-teks-utama tracking-tight">
                {hum}%
              </div>
              <p className="text-[11px] text-teks-sekunder mt-0.5">
                Kelembapan Relatif (RH)
              </p>
            </div>
          </Card>
        )}

        {/* 7. Opsional jika terpasang: Baterai Tambahan */}
        {hasBattery && (
          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-teks-sekunder">
              <span className="text-xs font-medium">Baterai Cadangan</span>
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
                {charging ? 'Sedang Mengisi' : 'Modul Eksternal'}
              </p>
            </div>
          </Card>
        )}

        {/* 8. Firmware & Sistem */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-teks-sekunder">
            <span className="text-xs font-medium">Firmware Hardware</span>
            <Cpu className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-3xl font-extrabold text-teks-utama tracking-tight font-mono">
              {fwVersion ? `v${fwVersion}` : 'v2.4'}
            </div>
            <p className="text-[11px] text-teks-sekunder mt-0.5">
              Hujan Sensor ESP32 Core
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};
