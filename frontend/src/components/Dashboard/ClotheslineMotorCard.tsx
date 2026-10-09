import React from 'react';
import { ShieldCheck, Sun, Umbrella, Cog, ArrowLeft, ArrowRight, Home, CloudSun } from 'lucide-react';
import { Card } from '../Common/Card';

interface ClotheslineMotorCardProps {
  isRaining: boolean;
  condition: 'cerah' | 'gerimis' | 'hujan' | 'badai';
}

export const ClotheslineMotorCard: React.FC<ClotheslineMotorCardProps> = ({
  isRaining,
  condition,
}) => {
  const isProtected = isRaining;

  return (
    <Card className="relative overflow-hidden border border-blue-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-blue-950/40 p-4 sm:p-6 backdrop-blur-xl shadow-xl">
      {/* Ambient decorative glow */}
      <div
        className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
          isProtected ? 'bg-emerald-500/15' : 'bg-amber-500/15'
        }`}
      />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Mekanisme Otomatisasi IoT
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5 font-heading">
            Sistem Rel Jemuran & Motor DC
          </h3>
        </div>

        {/* Safety Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all duration-500 ${
            isProtected
              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 shadow-lg shadow-emerald-500/10'
              : 'bg-amber-500/20 border-amber-400/40 text-amber-300 shadow-lg shadow-amber-500/10'
          }`}
        >
          {isProtected ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>JEMURAN AMAN (TERLINDUNGI)</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>SEDANG MENJEMUR (TERIK)</span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Visual Rail & Motor Graphic */}
      <div className="my-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 relative">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
          <span className="flex items-center gap-1.5 font-medium text-emerald-400">
            <Home className="w-3.5 h-3.5" /> Area Teduh / Atap
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Panjang Rel: 2.5 Meter
          </span>
          <span className="flex items-center gap-1.5 font-medium text-amber-400">
            <CloudSun className="w-3.5 h-3.5" /> Area Terbuka Panas
          </span>
        </div>

        {/* The Track Rail */}
        <div className="relative h-6 bg-slate-800/80 rounded-full border border-slate-700/60 overflow-hidden flex items-center px-1">
          {/* Track Guides */}
          <div className="absolute inset-x-2 h-1 bg-slate-700 rounded-full" />

          {/* Motorized Cart / Hanger Slider */}
          <div
            className={`relative flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold shadow-lg transition-all duration-1000 transform ${
              isProtected
                ? 'translate-x-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white ring-2 ring-emerald-400/50'
                : 'translate-x-[calc(100%-8px)] sm:translate-x-[calc(260px)] md:translate-x-[calc(380px)] bg-gradient-to-r from-amber-500 to-orange-500 text-white ring-2 ring-amber-400/50'
            }`}
          >
            <Umbrella className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">
              {isProtected ? 'Posisi: Bawah Atap' : 'Posisi: Luar Ruangan'}
            </span>
          </div>
        </div>

        {/* Movement Direction Indicator */}
        <div className="flex items-center justify-between mt-3 pt-2 text-xs border-t border-slate-900">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg bg-blue-500/20 text-blue-400 ${
                isProtected ? 'animate-spin' : ''
              }`}
            >
              <Cog className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">
                {isProtected ? 'Motor DC: Menarik Masuk' : 'Motor DC: Siaga (Idle)'}
              </div>
              <div className="text-[10px] text-slate-400">
                Driver L298N • PWM 85%
              </div>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${
                isProtected
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
              }`}
            >
              {isProtected ? (
                <>
                  <ArrowLeft className="w-3 h-3 animate-pulse" />
                  Ditarik Masuk Atap
                </>
              ) : (
                <>
                  Terbentang di Luar
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Descriptive Status Text */}
      <div className="rounded-xl p-3 bg-blue-950/30 border border-blue-900/30 text-xs sm:text-sm text-slate-300 leading-relaxed flex items-start gap-2.5">
        <div className="p-1 rounded-md bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          {isProtected ? (
            <p>
              <strong className="text-emerald-300 font-semibold">Jemuran Aman!</strong> Sensor IoT mendeteksi kondisi{' '}
              <span className="font-semibold text-white capitalize">{condition}</span>. Motor DC otomatis menarik rel jemuran ke bawah atap kanopi sehingga pakaian tidak basah terkena air hujan.
            </p>
          ) : (
            <p>
              <strong className="text-amber-300 font-semibold">Kondisi Cerah.</strong> Sensor IoT tidak mendeteksi air hujan. Motor DC memposisikan jemuran di area terbuka agar cucian kering maksimal tersengat sinar matahari.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
