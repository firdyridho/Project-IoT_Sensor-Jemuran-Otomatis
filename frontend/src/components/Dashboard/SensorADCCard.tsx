import React from 'react';
import { Droplets, ShieldCheck, AlertTriangle, Activity } from 'lucide-react';
import { Card } from '../Common/Card';
import { WeatherSphereOrb } from './WeatherSphereOrb';
import { useCountUp } from '../../hooks/useCountUp';

interface SensorADCCardProps {
  condition: 'cerah' | 'mendung' | 'gerimis' | 'hujan' | 'badai';
  pct: number;
  raw: number;
  thresholdPct: number;
  isWet: boolean;
}

export const SensorADCCard: React.FC<SensorADCCardProps> = ({
  condition,
  pct,
  raw,
  thresholdPct,
  isWet,
}) => {
  const isCerah = condition === 'cerah';
  const [displayPct, pctRef] = useCountUp(pct);

  const cardClass = isCerah
    ? 'bg-white/95 border-slate-200/90 text-slate-900 shadow-md backdrop-blur-xl'
    : 'bg-slate-900/90 border-white/15 text-white shadow-2xl backdrop-blur-2xl';

  const statusBadge = isWet
    ? {
        label: 'SENSOR BASAH (HUJAN)',
        bg: isCerah ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold' : 'bg-rose-600 text-white border-rose-500 shadow-md',
        icon: AlertTriangle,
      }
    : {
        label: 'SENSOR KERING (AMAN)',
        bg: isCerah ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' : 'bg-emerald-600 text-white border-emerald-500 shadow-md',
        icon: ShieldCheck,
      };

  const StatusIcon = statusBadge.icon;

  return (
    <Card className={`relative overflow-hidden rounded-3xl border p-4 sm:p-6 transition-all duration-700 ${cardClass}`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b pb-3 mb-4 ${isCerah ? 'border-slate-200' : 'border-white/10'}`}>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className={`p-1.5 rounded-xl border shrink-0 ${isCerah ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-500/20 text-blue-300 border-blue-400/30'}`}>
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`text-sm sm:text-base font-bold tracking-wide leading-tight ${isCerah ? 'text-slate-900' : 'text-white'}`}>
              Sensor Kebasahan Fisik (ADC)
            </h3>
            <p className={`text-xs mt-0.5 leading-normal ${isCerah ? 'text-slate-500 font-medium' : 'text-slate-300 font-semibold'}`}>
              Deteksi tetesan air hujan mikrokontroler ESP32
            </p>
          </div>
        </div>

        <div className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black tracking-wider uppercase shrink-0 ${statusBadge.bg}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{statusBadge.label}</span>
        </div>
      </div>

      {/* Main Content: 3D Orb + 95% Sensor ADC display */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-5">
        {/* Left: 3D Sphere Orb Widget */}
        <div className="shrink-0 flex items-center justify-center">
          <WeatherSphereOrb condition={condition} size="md" showLabel={false} />
        </div>

        {/* Center: Big Percentage & Subtitle */}
        <div className="text-center sm:text-left space-y-1">
          <div ref={pctRef} className="flex items-baseline justify-center sm:justify-start gap-1">
            <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight leading-none">
              {displayPct}%
            </span>
            <span className="text-xs uppercase tracking-wider font-bold opacity-60">
              Tingkat Kebasahan
            </span>
          </div>

          <p className="text-xs sm:text-sm opacity-80 leading-relaxed max-w-sm">
            {isWet
              ? 'Tetesan air aktif mengenai lempeng sensor fisik. Motor penarik jemuran telah diinstruksikan mengamankan cucian.'
              : 'Lempeng sensor sepenuhnya kering. Aman menjemur pakaian di bawah paparan sinar matahari.'}
          </p>
        </div>

        {/* Right: Technical Stats Pill Grid */}
        <div className="shrink-0 flex flex-row sm:flex-col gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-center sm:text-right">
            <div className="text-[10px] uppercase tracking-wider opacity-60 font-semibold">
              Nilai Raw ADC
            </div>
            <div className="text-sm font-bold font-mono">
              {raw}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-center sm:text-right">
            <div className="text-[10px] uppercase tracking-wider opacity-60 font-semibold">
              Ambang Batas
            </div>
            <div className="text-sm font-bold font-mono">
              {thresholdPct}%
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
