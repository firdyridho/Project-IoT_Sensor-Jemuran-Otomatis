import React, { useState } from 'react';
import {
  MoreHorizontal,
  ShieldCheck,
  Umbrella,
  WifiOff,
  AlertTriangle,
  Clock,
  Droplets,
  Thermometer,
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
  tempC?: number | null;
  hum?: number | null;
  locationName?: string;
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
  tempC = null,
  hum = null,
  locationName = 'Jemuran Utama — Jakarta',
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Infer fine-grained weather condition if not directly passed
  const condition: WeatherConditionType =
    weatherCondition ||
    (status === 'hujan' ? (pct > 80 ? 'badai' : 'hujan') : 'cerah');

  const isCerah = condition === 'cerah';

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

  // Theme configurations for card background, borders, and typography
  // Left phone style for Cerah (Warm Frosted Glass), Right phone style for Rainy/Stormy (Dark Frosted Glass)
  const theme = {
    cerah: {
      cardClass: 'bg-white/40 border-white/60 text-slate-900 shadow-xl backdrop-blur-2xl',
      locText: 'text-slate-800 font-semibold',
      tempText: 'text-slate-900 font-extrabold',
      condText: 'text-slate-800 font-bold',
      subText: 'text-slate-700',
      badgeBg: 'bg-amber-500/25 border-amber-500/40 text-amber-900 font-bold',
      motorBg: 'bg-white/60 border-white/70 text-slate-800',
      safetyBadge: 'Jemuran Terbuka (Sinar Matahari)',
      motorNotice: 'Motor DC: Siaga di luar',
      condLabel: 'Cerah Berawan',
      chanceOfRain: '10%',
      humidityDisplay: hum ? `${hum}%` : '55%',
      tempDisplay: tempC ? Math.round(tempC) : 28,
    },
    gerimis: {
      cardClass: 'bg-slate-900/60 border-white/15 text-white shadow-2xl backdrop-blur-2xl',
      locText: 'text-slate-200 font-semibold',
      tempText: 'text-white font-extrabold',
      condText: 'text-sky-200 font-bold',
      subText: 'text-slate-300',
      badgeBg: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 font-bold',
      motorBg: 'bg-slate-800/80 border-slate-700 text-slate-300',
      safetyBadge: 'Jemuran Aman (Di Bawah Atap)',
      motorNotice: 'Motor DC: Menarik ke kanopi atap',
      condLabel: 'Gerimis Ringan',
      chanceOfRain: '65%',
      humidityDisplay: hum ? `${hum}%` : '78%',
      tempDisplay: tempC ? Math.round(tempC) : 25,
    },
    hujan: {
      cardClass: 'bg-slate-950/70 border-white/15 text-white shadow-2xl backdrop-blur-2xl',
      locText: 'text-slate-200 font-semibold',
      tempText: 'text-white font-extrabold',
      condText: 'text-cyan-200 font-bold',
      subText: 'text-slate-300',
      badgeBg: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 font-bold',
      motorBg: 'bg-slate-800/80 border-slate-700 text-slate-300',
      safetyBadge: 'Jemuran Aman (Terlindungi)',
      motorNotice: 'Motor DC: Terkunci di bawah atap',
      condLabel: 'Hujan Deras',
      chanceOfRain: '95%',
      humidityDisplay: hum ? `${hum}%` : '88%',
      tempDisplay: tempC ? Math.round(tempC) : 23,
    },
    badai: {
      cardClass: 'bg-slate-950/75 border-purple-500/30 text-white shadow-2xl backdrop-blur-2xl',
      locText: 'text-purple-200 font-semibold',
      tempText: 'text-white font-extrabold',
      condText: 'text-purple-200 font-bold',
      subText: 'text-slate-300',
      badgeBg: 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200 font-bold',
      motorBg: 'bg-indigo-950/80 border-indigo-800/60 text-indigo-200',
      safetyBadge: 'Jemuran Aman (Siaga Badai)',
      motorNotice: 'Motor DC: Terkunci rapat di naungan',
      condLabel: 'Badai Petir Halilintar',
      chanceOfRain: '98%',
      humidityDisplay: hum ? `${hum}%` : '92%',
      tempDisplay: tempC ? Math.round(tempC) : 22,
    },
  }[condition];

  return (
    <Card
      className={`relative overflow-hidden rounded-3xl border-2 p-5 sm:p-7 transition-all duration-700 ${theme.cardClass}`}
    >
      {/* 1. Location Bar & Options (Directly matching "Barcelona, Spain •••" in user reference image) */}
      <div className="flex items-center justify-between gap-3 border-b border-black/5 dark:border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className={`text-sm sm:text-base tracking-wide ${theme.locText}`}>
            {locationName}
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <div className="flex items-center gap-2">
          {/* Safety Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs uppercase tracking-wider shadow-sm ${theme.badgeBg}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{theme.safetyBadge}</span>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Detail Telemetri"
          >
            <MoreHorizontal className="w-5 h-5 opacity-75" />
          </button>
        </div>
      </div>

      {/* 2. Main Weather Display & 3D Illustration Row (Matching reference layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        {/* Left Side: Big Temperature, Condition & Environmental Subtext */}
        <div className="sm:col-span-6 space-y-1.5">
          <div className="flex items-baseline gap-1">
            <span className={`text-6xl sm:text-7xl font-black font-heading tracking-tight leading-none ${theme.tempText}`}>
              {theme.tempDisplay}°
            </span>
            <span className="text-xl font-medium opacity-60">C</span>
          </div>

          <div className={`text-lg sm:text-xl tracking-tight ${theme.condText}`}>
            {theme.condLabel}
          </div>

          <div className={`text-xs sm:text-sm space-y-0.5 leading-relaxed ${theme.subText}`}>
            <div>Peluang Hujan: <span className="font-semibold">{theme.chanceOfRain}</span></div>
            <div>Tingkat Kelembapan: <span className="font-semibold">{theme.humidityDisplay}</span></div>
          </div>

          {/* Motor DC State Pill */}
          <div className="pt-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium shadow-inner ${theme.motorBg}`}>
              <Umbrella className="w-3.5 h-3.5 text-cyan-400" />
              <span>{theme.motorNotice}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Big 3D Weather Illustration + 3D Orb Sensor Kebasahan */}
        <div className="sm:col-span-6 flex items-center justify-center sm:justify-end gap-3 sm:gap-4">
          {/* 3D Weather Illustration (3D Puffy Cloud with 3D Sun Sphere or 3D glossy rain drops) */}
          <div className="shrink-0 flex items-center justify-center">
            <WeatherIllustration condition={condition} className="w-36 h-28 sm:w-44 sm:h-32" />
          </div>

          {/* 3D Glossy Sphere Orb Widget for Physical Rain Sensor (ADC & Pct) */}
          <div className="shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl bg-black/10 dark:bg-black/30 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-inner">
            <WeatherSphereOrb condition={condition} size="sm" showLabel={false} />
            <div className="mt-1.5 text-center">
              <div className="text-lg sm:text-xl font-black font-mono tracking-tight leading-none">
                {pct}%
              </div>
              <div className="text-[9px] uppercase tracking-wider opacity-60 mt-0.5 font-medium">
                Sensor ADC
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Expandable / Collapsible Telemetry Row */}
      {showDetails && (
        <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1.5 opacity-80">
            <Clock className="w-3.5 h-3.5" />
            <span>Aktif: {formatTime(sinceTs)}</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-80">
            <Droplets className="w-3.5 h-3.5" />
            <span>Ambang: {thresholdPct}%</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-80 font-mono">
            <span>ADC Raw: {raw}</span>
          </div>
        </div>
      )}
    </Card>
  );
};
