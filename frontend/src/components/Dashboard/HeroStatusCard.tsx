import React from 'react';
import {
  CloudRain,
  Sun,
  WifiOff,
  AlertTriangle,
  Droplets,
  ShieldCheck,
  Clock,
  Umbrella,
  CloudLightning,
  CloudDrizzle,
} from 'lucide-react';
import { Card } from '../Common/Card';
import { WeatherSphereOrb } from './WeatherSphereOrb';
import { WeatherIllustration } from './WeatherIllustration';

export type WeatherConditionType = 'cerah' | 'gerimis' | 'hujan' | 'badai';

interface HeroStatusCardProps {
  status: 'kering' | 'hujan' | 'offline';
  pct: number;
  raw: number;
  thresholdPct: number;
  sinceTs: number;
  lastSeenTs: number;
  brokerDisconnected: boolean;
  weatherCondition?: WeatherConditionType;
}

export const HeroStatusCard: React.FC<HeroStatusCardProps> = ({
  status,
  pct,
  raw,
  thresholdPct,
  sinceTs,
  lastSeenTs,
  brokerDisconnected,
  weatherCondition,
}) => {
  // Infer fine-grained weather condition if not directly passed
  const condition: WeatherConditionType =
    weatherCondition ||
    (status === 'hujan' ? (pct > 80 ? 'badai' : 'hujan') : 'cerah');

  const formatTime = (ts: number) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WIB`;
  };

  const getDuration = (ts: number) => {
    if (!ts) return '';
    const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60000));
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${hours}j ${mins}m lalu`;
  };

  if (brokerDisconnected) {
    return (
      <Card className="relative overflow-hidden border-2 border-red-500/40 bg-gradient-to-b from-red-500/15 via-slate-900/80 to-slate-950 p-5 sm:p-7 backdrop-blur-xl shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              Koneksi Broker Terputus
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Tidak Terhubung ke Server IoT
            </h2>
            <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
              Koneksi WebSocket ke broker MQTT terputus. Sistem mencoba menghubungkan ulang secara otomatis.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-red-500/20 text-red-400 shrink-0">
            <WifiOff className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  if (status === 'offline') {
    return (
      <Card className="relative overflow-hidden border-2 border-slate-700/60 bg-gradient-to-b from-slate-800/40 via-slate-900/80 to-slate-950 p-5 sm:p-7 backdrop-blur-xl shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold uppercase tracking-wider">
              <WifiOff className="w-3.5 h-3.5" />
              Perangkat Tidak Aktif
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Perangkat ESP32 Offline
            </h2>
            <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
              Tidak menerima telemetri sejak {formatTime(lastSeenTs)} ({getDuration(lastSeenTs)}). Periksa daya atau sinyal WiFi pada mikrokontroler jemuran.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800 text-slate-400 shrink-0">
            <WifiOff className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        </div>
      </Card>
    );
  }

  // Harmonious slate-glass theme configurations (Non-electric, elegant)
  const theme = {
    cerah: {
      border: 'border-white/10 hover:border-amber-400/30',
      gradient: 'from-slate-900/90 via-slate-900/70 to-slate-950/80',
      accentText: 'text-amber-400',
      title: 'Cuaca Cerah — Aman Menjemur',
      subtitle: 'Tidak ada tetesan air terdeteksi. Sinar matahari optimal untuk pengeringan pakaian.',
      safetyBadge: 'Jemuran di Luar (Menjemur)',
      badgeBg: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
      motorNotice: 'Motor DC: Siaga di area terbuka',
    },
    gerimis: {
      border: 'border-white/10 hover:border-sky-400/30',
      gradient: 'from-slate-900/90 via-slate-900/70 to-slate-950/80',
      accentText: 'text-sky-300',
      title: 'Gerimis Terdeteksi — Jemuran Aman!',
      subtitle: 'Tetesan gerimis mengenai sensor. Motor DC otomatis menarik jemuran ke bawah atap.',
      safetyBadge: 'Jemuran Aman (Di Bawah Atap)',
      badgeBg: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
      motorNotice: 'Motor DC: Menarik masuk ke kanopi atap',
    },
    hujan: {
      border: 'border-white/10 hover:border-cyan-400/30',
      gradient: 'from-slate-900/90 via-slate-900/70 to-slate-950/80',
      accentText: 'text-cyan-300',
      title: 'Hujan Terdeteksi — Jemuran Aman!',
      subtitle: 'Sensor mendeteksi air hujan lebat. Motor DC telah mengamankan jemuran di area terlindung.',
      safetyBadge: 'Jemuran Aman (Terlindungi)',
      badgeBg: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
      motorNotice: 'Motor DC: Terkunci di bawah atap',
    },
    badai: {
      border: 'border-white/10 hover:border-purple-400/30',
      gradient: 'from-slate-900/90 via-slate-900/70 to-slate-950/80',
      accentText: 'text-purple-300',
      title: 'Badai Petir — Jemuran Aman!',
      subtitle: 'Hujan badai disertai kilat. Motor DC memastikan jemuran ditarik rapat ke dalam naungan.',
      safetyBadge: 'Jemuran Aman (Siaga Badai)',
      badgeBg: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
      motorNotice: 'Motor DC: Posisi aman terkunci',
    },
  }[condition];

  return (
    <Card
      className={`relative overflow-hidden border-2 ${theme.border} bg-gradient-to-br ${theme.gradient} p-4 sm:p-7 backdrop-blur-2xl shadow-2xl transition-all duration-700`}
    >
      {/* Upper Section: Badges & Live Status */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3">
        <div className="flex items-center gap-2">
          {/* Jemuran Safety Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${theme.badgeBg}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{theme.safetyBadge}</span>
          </div>

          {/* Motor DC State Pill */}
          <div className="hidden xs:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px] font-medium">
            <Umbrella className="w-3 h-3 text-cyan-400" />
            <span>{theme.motorNotice}</span>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
          <span>Telemetri IoT Aktif</span>
        </div>
      </div>

      {/* Main Content Area: Responsive Flex Layout with 3D Orb & Illustration */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 my-2">
        {/* Left Information Column */}
        <div className="space-y-3 text-center lg:text-left flex-1">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white font-heading leading-tight drop-shadow-sm">
              {theme.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-1.5 max-w-xl leading-relaxed">
              {theme.subtitle}
            </p>
          </div>

          {/* Telemetry Metrics Bar */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Waktu: {formatTime(sinceTs)} ({getDuration(sinceTs)})
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              Ambang Batas: {thresholdPct}%
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="font-mono text-cyan-300">ADC: {raw}</span>
            </span>
          </div>
        </div>

        {/* Center: Dynamic SVG Weather Illustration (Awan, Matahari, Gerimis, Badai) */}
        <div className="shrink-0 relative py-2">
          <WeatherIllustration condition={condition} className="w-44 h-28 sm:w-52 sm:h-32" />
        </div>

        {/* Right: 3D Glossy Spherical Orb Widget (Inspired by User's Reference Image) */}
        <div className="shrink-0 flex flex-col items-center justify-center bg-slate-950/50 p-4 rounded-3xl border border-white/10 backdrop-blur-xl shadow-inner">
          <WeatherSphereOrb condition={condition} size="md" showLabel={false} />
          <div className="mt-2 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {pct}%
            </div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Tingkat Kebasahan
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
