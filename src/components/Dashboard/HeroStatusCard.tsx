import React from 'react';
import { CloudRain, Sun, WifiOff, AlertTriangle, Droplets, ShieldCheck, Clock } from 'lucide-react';
import { Card } from '../Common/Card';

interface HeroStatusCardProps {
  status: 'kering' | 'hujan' | 'offline';
  pct: number;
  raw: number;
  thresholdPct: number;
  sinceTs: number;
  lastSeenTs: number;
  brokerDisconnected: boolean;
}

export const HeroStatusCard: React.FC<HeroStatusCardProps> = ({
  status,
  pct,
  raw,
  thresholdPct,
  sinceTs,
  lastSeenTs,
  brokerDisconnected,
}) => {
  const formatTime = (ts: number) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WIB`;
  };

  const getDuration = (ts: number) => {
    if (!ts) return '';
    const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60000));
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${hours} jam ${mins} mnt yang lalu`;
  };

  if (brokerDisconnected) {
    return (
      <Card className="relative overflow-hidden border-2 border-red-500/40 bg-gradient-to-b from-red-500/10 to-transparent p-5 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              Koneksi Broker Terputus
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-teks-utama">
              Tidak Terhubung ke Broker
            </h2>
            <p className="text-sm text-teks-sekunder max-w-lg leading-relaxed">
              Koneksi WebSocket ke broker MQTT terputus. Sistem mencoba menghubungkan ulang secara otomatis.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-red-500/10 text-red-500 shrink-0">
            <WifiOff className="w-8 h-8 md:w-10 md:h-10 animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  if (status === 'offline') {
    return (
      <Card className="relative overflow-hidden border-2 border-offline/40 bg-gradient-to-b from-offline/10 to-transparent p-5 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-offline-subtle border border-offline/30 text-offline text-xs font-semibold uppercase tracking-wider">
              <WifiOff className="w-3.5 h-3.5" />
              Perangkat Tidak Aktif
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-teks-utama">
              Perangkat Offline
            </h2>
            <p className="text-sm text-teks-sekunder max-w-lg leading-relaxed">
              Tidak menerima telemetry sejak {formatTime(lastSeenTs)} ({getDuration(lastSeenTs)}). Periksa daya atau sinyal WiFi pada ESP32 jemuran.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-offline-subtle text-offline shrink-0">
            <WifiOff className="w-8 h-8 md:w-10 md:h-10" />
          </div>
        </div>
      </Card>
    );
  }

  if (status === 'hujan') {
    return (
      <Card className="relative overflow-hidden border-2 border-cyan-500/60 bg-gradient-to-br from-cyan-500/20 via-cyan-900/10 to-transparent p-5 md:p-8 shadow-lg shadow-cyan-500/10">
        {/* Rain animation background effect */}
        <div className="absolute top-2 right-12 flex gap-3 opacity-60 pointer-events-none" aria-hidden="true">
          <div className="w-0.5 h-6 bg-cyan-400 rounded-full animate-rain-drop-1" />
          <div className="w-0.5 h-8 bg-cyan-300 rounded-full animate-rain-drop-2" />
          <div className="w-0.5 h-5 bg-cyan-400 rounded-full animate-rain-drop-3" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/25 border border-cyan-400/50 text-cyan-700 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider shadow-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Peringatan Aktif
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-cyan-600 dark:text-cyan-300 font-heading">
                HUJAN TERDETEKSI!
              </h2>
              <p className="text-base font-semibold text-teks-utama mt-1">
                Segera angkat jemuran Anda dari halaman
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-teks-sekunder">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                Mulai hujan: {formatTime(sinceTs)} ({getDuration(sinceTs)})
              </span>
              <span className="text-garis">•</span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                Ambang deteksi: {thresholdPct}%
              </span>
            </div>
          </div>

          {/* Big Wet Percentage Visualizer */}
          <div className="flex items-center gap-4 bg-kartu/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-cyan-500/30 shrink-0">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-500">
              <CloudRain className="w-9 h-9 animate-bounce" />
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-cyan-600 dark:text-cyan-300 font-mono">
                {pct}%
              </div>
              <div className="text-[11px] font-medium text-teks-sekunder">
                ADC Analog: {raw}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Status: KERING (Default Safe State)
  return (
    <Card className="relative overflow-hidden border-2 border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-blue-900/5 to-transparent p-5 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/40 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Kondisi Normal
          </div>

          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400 font-heading">
              Kering — Aman Menjemur
            </h2>
            <p className="text-sm md:text-base font-medium text-teks-sekunder mt-1">
              Sensor jemuran tidak mendeteksi tetesan air hujan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-teks-sekunder">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Kering sejak: {formatTime(sinceTs)}
            </span>
            <span className="text-garis">•</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              Ambang batas: {thresholdPct}%
            </span>
          </div>
        </div>

        {/* Status Percentage Badge */}
        <div className="flex items-center gap-4 bg-kartu/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-blue-500/20 shrink-0">
          <div className="p-3 rounded-2xl bg-blue-500/15 text-blue-500">
            <Sun className="w-9 h-9" />
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              {pct}%
            </div>
            <div className="text-[11px] font-medium text-teks-sekunder">
              ADC Analog: {raw}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
