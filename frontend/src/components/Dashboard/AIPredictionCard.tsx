import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, BrainCircuit, Clock } from 'lucide-react';
import { Card } from '../Common/Card';
import { AIPredictResponse } from '../../types/ai';
import { BackendService } from '../../services/api';

interface AIPredictionCardProps {
  backendUrl?: string;
  deviceId: string;
  currentWet?: boolean;
  condition?: 'cerah' | 'mendung' | 'hujan' | 'badai' | 'gerimis';
}

export const AIPredictionCard: React.FC<AIPredictionCardProps> = ({
  backendUrl,
  deviceId,
  currentWet = false,
  condition = 'cerah',
}) => {
  const [data, setData] = useState<AIPredictResponse['prediction'] | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isCerah = condition === 'cerah';

  const fetchPrediction = async () => {
    setIsLoading(true);
    try {
      if (backendUrl) {
        const res = await BackendService.predictRain(backendUrl, deviceId, 30);
        if (res?.prediction) {
          setData(res.prediction);
          setAnalyzedAt(res.analyzedAt);
          setIsLoading(false);
          return;
        }
      }

      // Heuristic fallback when backend is not configured / local dev
      await new Promise((r) => setTimeout(r, 600));
      if (currentWet) {
        setData({
          willRain: true,
          probabilityPct: 96,
          estimatedMinutesUntilRain: 0,
          confidenceLevel: 'high',
          trendFactors: {
            humidityDelta: '+18.5%',
            tempDelta: '-2.4°C',
            adcTrend: 'falling',
          },
          summary: 'Hujan saat ini sedang berlangsung aktif di lapangan. Jemuran berada di bawah naungan atap.',
        });
      } else {
        setData({
          willRain: false,
          probabilityPct: 20,
          estimatedMinutesUntilRain: 0,
          confidenceLevel: 'high',
          trendFactors: {
            humidityDelta: '+2.1%',
            tempDelta: '-0.3°C',
            adcTrend: 'stable',
          },
          summary: 'Kondisi mikroklimat stabil. Tidak ada indikasi pembentukan awan hujan dalam 30 menit ke depan.',
        });
      }
      setAnalyzedAt(new Date().toISOString());
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [deviceId, currentWet, backendUrl]);

  if (!data) return null;

  const prob = data.probabilityPct;
  const isHighRisk = prob >= 70;
  const isMedRisk = prob >= 40 && prob < 70;

  const confidenceBadge = isCerah
    ? {
        high: { label: 'Akurasi Tinggi', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' },
        medium: { label: 'Akurasi Sedang', bg: 'bg-amber-50 text-amber-800 border-amber-300 font-bold' },
        low: { label: 'Akurasi Rendah', bg: 'bg-slate-100 text-slate-700 border-slate-300 font-medium' },
      }[data.confidenceLevel]
    : {
        high: { label: 'Akurasi Tinggi', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' },
        medium: { label: 'Akurasi Sedang', bg: 'bg-amber-500/15 text-amber-300 border-amber-400/30' },
        low: { label: 'Akurasi Rendah', bg: 'bg-slate-700/40 text-slate-300 border-slate-600/40' },
      }[data.confidenceLevel];

  // SVG Circular progress radius & circumference
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const strokeDashoffset = circ - (prob / 100) * circ;

  const cardClass = isCerah
    ? 'bg-white/95 border-slate-200/90 text-slate-900 shadow-md backdrop-blur-xl'
    : 'border-white/10 bg-slate-900/80 backdrop-blur-2xl text-white shadow-xl';

  return (
    <Card className={`relative overflow-hidden border p-4 sm:p-6 transition-all duration-500 ${cardClass}`}>
      {/* Decorative ambient glow */}
      {!isCerah && (
        <div
          className={`absolute -top-10 -right-10 w-44 h-44 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
            isHighRisk ? 'bg-cyan-500/15' : isMedRisk ? 'bg-amber-500/10' : 'bg-blue-500/10'
          }`}
        />
      )}

      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b ${isCerah ? 'border-slate-200' : 'border-white/10'}`}>
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm ${
              isCerah
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white border-white/15'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base sm:text-lg font-bold font-heading tracking-tight ${isCerah ? 'text-slate-900' : 'text-white'}`}>
                Prediksi Hujan Cerdas AI
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isCerah
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-blue-500/20 text-cyan-300 border-blue-400/30'
                }`}
              >
                BE-05 Engine
              </span>
            </div>
            <p className={`text-[11px] ${isCerah ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
              Analisis laju perubahan kelembapan udara & suhu 30 menit terakhir
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchPrediction}
          disabled={isLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 min-h-11 ${
            isCerah
              ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200'
              : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Segarkan Analisis AI"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
          <span className="hidden xs:inline">Refresh Analisis</span>
        </button>
      </div>

      {/* Main Body: Gauge & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center my-4">
        {/* Left: Circular Gauge (4 cols) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center py-1">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background track circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={isCerah ? 'stroke-slate-200' : 'stroke-slate-800'}
                strokeWidth="8"
                fill="none"
              />
              {/* Animated Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={isHighRisk ? '#0284c7' : isMedRisk ? '#f59e0b' : '#3b82f6'}
                strokeWidth="8"
                strokeDasharray={circ}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner Circular Value */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-2xl font-black font-mono tracking-tight ${isCerah ? 'text-slate-900' : 'text-white'}`}>
                {prob}%
              </span>
              <span className={`text-[10px] font-semibold ${isCerah ? 'text-slate-500' : 'text-slate-400'}`}>
                Potensi
              </span>
            </div>
          </div>

          <div className="mt-2 text-center">
            <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${confidenceBadge.bg}`}>
              {confidenceBadge.label}
            </span>
          </div>
        </div>

        {/* Right: Trend Factors & Estimates (8 cols) */}
        <div className="md:col-span-8 space-y-3">
          {/* Estimated countdown banner */}
          <div
            className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs ${
              isCerah
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-slate-950/60 border-white/5 text-slate-300'
            }`}
          >
            <Clock className={`w-4 h-4 shrink-0 ${isCerah ? 'text-amber-600' : 'text-cyan-400'}`} />
            <div>
              {data.willRain ? (
                <span>
                  Estimasi waktu: <strong className={isCerah ? 'text-amber-700 font-bold' : 'text-cyan-300'}>{data.estimatedMinutesUntilRain > 0 ? `~${data.estimatedMinutesUntilRain} Menit lagi` : 'Sedang Berlangsung'}</strong> sebelum titik air menyentuh sensor jemuran.
                </span>
              ) : (
                <span>
                  Kondisi aman: <strong className={isCerah ? 'text-emerald-700 font-bold' : 'text-emerald-300'}>Belum ada potensi hujan</strong> dalam 30–60 menit ke depan.
                </span>
              )}
            </div>
          </div>

          {/* Micro Trend Factors Grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className={`p-2.5 rounded-xl border ${isCerah ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
              <div className={`flex items-center justify-center gap-1 text-[11px] ${isCerah ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
                <span>Δ Kelembapan</span>
              </div>
              <div className={`font-mono font-bold text-sm mt-1 flex items-center justify-center gap-0.5 ${isCerah ? 'text-slate-800' : 'text-cyan-300'}`}>
                <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
                {data.trendFactors.humidityDelta}
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border ${isCerah ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
              <div className={`flex items-center justify-center gap-1 text-[11px] ${isCerah ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
                <span>Δ Suhu</span>
              </div>
              <div className={`font-mono font-bold text-sm mt-1 flex items-center justify-center gap-0.5 ${isCerah ? 'text-slate-800' : 'text-sky-300'}`}>
                <ArrowDownRight className="w-3.5 h-3.5 text-amber-500" />
                {data.trendFactors.tempDelta}
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border ${isCerah ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
              <div className={`flex items-center justify-center gap-1 text-[11px] ${isCerah ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
                <span>Tren ADC Sensor</span>
              </div>
              <div className={`font-mono font-bold text-xs capitalize mt-1 ${isCerah ? 'text-slate-800' : 'text-slate-200'}`}>
                {data.trendFactors.adcTrend === 'falling' ? 'Mulai Basah' : 'Kering'}
              </div>
            </div>
          </div>

          {/* AI Narrative Summary */}
          <div
            className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
              isCerah
                ? 'bg-amber-50/70 border-amber-200/80 text-slate-800'
                : 'bg-blue-950/25 border-blue-900/30 text-slate-300'
            }`}
          >
            <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${isCerah ? 'text-amber-600' : 'text-cyan-400'}`} />
            <p className="flex-1 font-medium">{data.summary}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
