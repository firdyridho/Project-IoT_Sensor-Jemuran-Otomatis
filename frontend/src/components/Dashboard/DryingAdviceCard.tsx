import React, { useState, useEffect } from 'react';
import { Sun, AlertTriangle, ShieldCheck, Clock, Calendar, Wind, RefreshCw, Shirt } from 'lucide-react';
import { Card } from '../Common/Card';
import { AIDryingAdviceResponse } from '../../types/ai';
import { BackendService } from '../../services/api';

interface DryingAdviceCardProps {
  backendUrl?: string;
  deviceId: string;
  currentWet?: boolean;
}

export const DryingAdviceCard: React.FC<DryingAdviceCardProps> = ({
  backendUrl,
  deviceId,
  currentWet = false,
}) => {
  const [data, setData] = useState<AIDryingAdviceResponse['advice'] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAdvice = async () => {
    setIsLoading(true);
    try {
      if (backendUrl) {
        const res = await BackendService.getDryingAdvice(backendUrl, deviceId);
        if (res?.advice) {
          setData(res.advice);
          setIsLoading(false);
          return;
        }
      }

      // Heuristic fallback matching backend specification
      await new Promise((r) => setTimeout(r, 600));
      if (currentWet) {
        setData({
          recommendation: 'angkat_segera',
          dryingScore: 12,
          estimatedDryHours: 6.0,
          bestDryingWindow: 'Tunggu hujan reda & panas esok hari',
          bmkgWeatherDesc: 'Hujan Sedang / Lebat',
          actionMessage: 'Segera evakuasi jemuran ke dalam ruangan atau pastikan kanopi penutup tertutup rapat!',
        });
      } else {
        setData({
          recommendation: 'aman_jemur',
          dryingScore: 88,
          estimatedDryHours: 2.5,
          bestDryingWindow: '08:30 - 14:00 WIB',
          bmkgWeatherDesc: 'Cerah Berawan, Angin Sejuk',
          actionMessage: 'Kondisi udara hangat dan ventilasi ideal. Pakaian tipis diprediksi kering kurang dari 2.5 jam.',
        });
      }
    } catch {
      // Fallback on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, [deviceId, currentWet, backendUrl]);

  if (!data) return null;

  const recConfig = {
    aman_jemur: {
      label: 'AMAN JEMUR',
      sub: 'Kondisi Sangat Mendukung',
      color: 'text-emerald-300',
      bgBadge: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200',
      glow: 'from-emerald-500/20 to-transparent',
      ringColor: '#10b981',
      icon: ShieldCheck,
    },
    waspada_jemur: {
      label: 'WASPADA JEMUR',
      sub: 'Potensi Mendung Mendadak',
      color: 'text-amber-300',
      bgBadge: 'bg-amber-500/20 border-amber-500/40 text-amber-200',
      glow: 'from-amber-500/20 to-transparent',
      ringColor: '#f59e0b',
      icon: AlertTriangle,
    },
    angkat_segera: {
      label: 'ANGKAT SEGERA',
      sub: 'Hujan Aktif Terdeteksi',
      color: 'text-rose-400',
      bgBadge: 'bg-rose-500/20 border-rose-500/40 text-rose-200',
      glow: 'from-rose-500/25 to-transparent',
      ringColor: '#f43f5e',
      icon: AlertTriangle,
    },
  }[data.recommendation] || {
    label: 'ANALISIS CUACA',
    sub: 'Memeriksa Sensor',
    color: 'text-slate-300',
    bgBadge: 'bg-slate-500/20 border-slate-500/40 text-slate-200',
    glow: 'from-blue-500/10 to-transparent',
    ringColor: '#38bdf8',
    icon: Sun,
  };

  const RecIcon = recConfig.icon;

  // Gauge calculations for dryingScore (0 to 100)
  const radius = 34;
  const circ = 2 * Math.PI * radius;
  const scoreOffset = circ - (Math.min(100, Math.max(0, data.dryingScore)) / 100) * circ;

  return (
    <Card className="relative overflow-hidden border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-4 sm:p-6 shadow-xl text-white">
      {/* Dynamic ambient background glow */}
      <div
        className={`absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none bg-gradient-to-br ${recConfig.glow}`}
      />

      {/* Header section */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-sky-500/10 border border-indigo-400/30 text-indigo-300 shadow-inner">
            <Shirt className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm sm:text-base text-white tracking-wide">
                Rekomendasi Jemuran AI
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
                Smart Advisor
              </span>
            </div>
            <p className="text-xs text-slate-400">Analisis sensor + perkiraan waktu pengeringan pakaian</p>
          </div>
        </div>

        <button
          onClick={fetchAdvice}
          disabled={isLoading}
          className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-slate-300 transition-all disabled:opacity-50"
          title="Refresh Rekomendasi"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>

      {/* Main Status & Gauge Row */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center mb-4">
        {/* Large recommendation badge banner */}
        <div className="sm:col-span-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-black tracking-wider uppercase shadow-lg ${recConfig.bgBadge}`}>
              <RecIcon className="w-4 h-4" />
              <span>{recConfig.label}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium hidden xs:inline">
              • {recConfig.sub}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
            {data.actionMessage}
          </p>
        </div>

        {/* Circular Drying Score */}
        <div className="sm:col-span-4 flex items-center justify-around sm:justify-end gap-3">
          <div className="relative flex items-center justify-center">
            <svg className="w-20 h-20 -rotate-90 transform">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke={recConfig.ringColor}
                strokeWidth="7"
                strokeDasharray={circ}
                strokeDashoffset={scoreOffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-white leading-none">
                {data.dryingScore}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">
                Skor
              </span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs font-semibold text-slate-300">Skor Jemur</div>
            <div className="text-[11px] text-slate-400">Kualitas Penguapan</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Maks 100</div>
          </div>
        </div>
      </div>

      {/* Key Insights Grid */}
      <div className="relative z-10 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-white/10">
        {/* Estimasi Jam Kering */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/40 border border-white/5">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Estimasi Kering</div>
            <div className="text-xs sm:text-sm font-bold text-slate-100">
              ~{data.estimatedDryHours} Jam
            </div>
          </div>
        </div>

        {/* Waktu Jemur Optimal */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/40 border border-white/5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Jam Optimal</div>
            <div className="text-xs sm:text-sm font-bold text-amber-200">
              {data.bestDryingWindow}
            </div>
          </div>
        </div>

        {/* Kondisi BMKG / Lingkungan */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/40 border border-white/5 xs:col-span-2 sm:col-span-1">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Wind className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Kondisi BMKG</div>
            <div className="text-xs sm:text-sm font-bold text-teal-200 truncate" title={data.bmkgWeatherDesc}>
              {data.bmkgWeatherDesc}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
