import React from 'react';
import { ShieldCheck, Sun, Umbrella, Cog, ArrowLeft, ArrowRight, Home, CloudSun, Cloud } from 'lucide-react';
import { Card } from '../Common/Card';

export type MotorWeatherCondition = 'cerah' | 'mendung' | 'gerimis' | 'badai' | 'hujan';

interface ClotheslineMotorCardProps {
  isRaining: boolean;
  condition: MotorWeatherCondition;
}

export const ClotheslineMotorCard: React.FC<ClotheslineMotorCardProps> = ({
  isRaining,
  condition,
}) => {
  const isCerah = condition === 'cerah';
  const isMendung = condition === 'mendung';
  const isProtected = isRaining || condition === 'gerimis' || condition === 'hujan' || condition === 'badai';

  return (
    <Card
      className={`relative overflow-hidden border p-4 sm:p-6 backdrop-blur-xl shadow-xl transition-all duration-700 ${
        isCerah
          ? 'bg-white/40 border-white/60 text-slate-900 shadow-xl backdrop-blur-2xl'
          : 'border-blue-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-blue-950/40 text-white'
      }`}
    >
      {/* Ambient decorative glow */}
      <div
        className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
          isProtected
            ? 'bg-emerald-500/15'
            : isCerah
            ? 'bg-amber-400/25'
            : 'bg-slate-400/15'
        }`}
      />

      {/* Header Info */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
          isCerah ? 'border-black/10' : 'border-slate-800'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isCerah ? 'text-amber-700' : 'text-blue-400'
              }`}
            >
              Mekanisme Otomatisasi IoT
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full animate-ping ${
                isCerah ? 'bg-amber-500' : 'bg-blue-400'
              }`}
            />
          </div>
          <h3
            className={`text-lg sm:text-xl font-bold tracking-tight mt-0.5 font-heading ${
              isCerah ? 'text-slate-900' : 'text-white'
            }`}
          >
            Sistem Rel Jemuran & Motor DC
          </h3>
        </div>

        {/* Safety Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all duration-500 shadow-sm ${
            isProtected
              ? isCerah
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-800'
                : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 shadow-emerald-500/10'
              : isMendung
              ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
              : 'bg-amber-500/20 border-amber-500/40 text-amber-800'
          }`}
        >
          {isProtected ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>JEMURAN AMAN (TERLINDUNGI)</span>
            </>
          ) : isMendung ? (
            <>
              <Cloud className="w-4 h-4 text-amber-400" />
              <span>JEMURAN SIAGA (MENDUNG)</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-600" />
              <span>SEDANG MENJEMUR (TERIK)</span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Visual Rail & Motor Graphic */}
      <div
        className={`my-5 p-4 rounded-2xl border relative transition-colors duration-500 ${
          isCerah
            ? 'bg-white/60 border-white/80 shadow-inner'
            : 'bg-slate-950/60 border-slate-800/80'
        }`}
      >
        <div
          className={`flex items-center justify-between text-xs mb-3 px-1 ${
            isCerah ? 'text-slate-700' : 'text-slate-400'
          }`}
        >
          <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <Home className="w-3.5 h-3.5" /> Area Teduh / Atap
          </span>
          <span className="text-[11px] font-mono opacity-80">
            Panjang Rel: 2.5 Meter
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
            <CloudSun className="w-3.5 h-3.5" /> Area Terbuka
          </span>
        </div>

        {/* The Track Rail */}
        <div
          className={`relative h-6 rounded-full border overflow-hidden flex items-center px-1 transition-colors duration-500 ${
            isCerah
              ? 'bg-slate-200/80 border-slate-300/80'
              : 'bg-slate-800/80 border-slate-700/60'
          }`}
        >
          {/* Track Guides */}
          <div
            className={`absolute inset-x-2 h-1 rounded-full ${
              isCerah ? 'bg-slate-300' : 'bg-slate-700'
            }`}
          />

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
              {isProtected ? 'Posisi: Bawah Atap' : isMendung ? 'Posisi: Luar (Siaga)' : 'Posisi: Luar Ruangan'}
            </span>
          </div>
        </div>

        {/* Movement Direction Indicator */}
        <div
          className={`flex items-center justify-between mt-3 pt-2 text-xs border-t ${
            isCerah ? 'border-slate-200' : 'border-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${
                isCerah
                  ? 'bg-amber-500/20 text-amber-700'
                  : 'bg-blue-500/20 text-blue-400'
              } ${isProtected ? 'animate-spin' : ''}`}
            >
              <Cog className="w-4 h-4" />
            </div>
            <div>
              <div
                className={`text-xs font-semibold ${
                  isCerah ? 'text-slate-800' : 'text-slate-200'
                }`}
              >
                {isProtected
                  ? 'Motor DC: Menarik Masuk'
                  : isMendung
                  ? 'Motor DC: Siaga Siap Tarik'
                  : 'Motor DC: Siaga (Idle)'}
              </div>
              <div
                className={`text-[10px] ${
                  isCerah ? 'text-slate-600 font-medium' : 'text-slate-400'
                }`}
              >
                Driver L298N • PWM 85%
              </div>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${
                isProtected
                  ? isCerah
                    ? 'bg-emerald-500/20 text-emerald-800 border border-emerald-400/40'
                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                  : isMendung
                  ? isCerah
                    ? 'bg-amber-500/20 text-amber-800 border border-amber-400/40'
                    : 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                  : isCerah
                  ? 'bg-amber-500/20 text-amber-800 border border-amber-400/40'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
              }`}
            >
              {isProtected ? (
                <>
                  <ArrowLeft className="w-3 h-3 animate-pulse" />
                  Ditarik Masuk Atap
                </>
              ) : isMendung ? (
                <>
                  Siaga di Luar
                  <ArrowRight className="w-3 h-3" />
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
      <div
        className={`rounded-xl p-3 border text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 ${
          isCerah
            ? 'bg-white/70 border-white/80 text-slate-800 shadow-sm'
            : 'bg-blue-950/30 border-blue-900/30 text-slate-300'
        }`}
      >
        <div
          className={`p-1 rounded-md shrink-0 mt-0.5 ${
            isCerah
              ? 'bg-amber-500/20 text-amber-700'
              : 'bg-blue-500/20 text-blue-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          {isProtected ? (
            <p>
              <strong className={isCerah ? 'text-emerald-700 font-bold' : 'text-emerald-300 font-semibold'}>
                Jemuran Aman!
              </strong>{' '}
              Sensor IoT mendeteksi kondisi{' '}
              <span className={`font-semibold capitalize ${isCerah ? 'text-slate-900' : 'text-white'}`}>
                {condition}
              </span>
              . Motor DC otomatis menarik rel jemuran ke bawah atap kanopi sehingga pakaian tidak basah terkena air hujan.
            </p>
          ) : isMendung ? (
            <p>
              <strong className={isCerah ? 'text-amber-800 font-bold' : 'text-amber-300 font-semibold'}>
                Kondisi Mendung Tebal.
              </strong>{' '}
              Sensor IoT belum mendeteksi tetesan air hujan. Motor DC berada dalam mode siaga aktif untuk segera menarik rel jemuran jika gerimis mulai terdeteksi.
            </p>
          ) : (
            <p>
              <strong className={isCerah ? 'text-amber-800 font-bold' : 'text-amber-300 font-semibold'}>
                Kondisi Cerah Hangat.
              </strong>{' '}
              Sensor IoT tidak mendeteksi air hujan. Motor DC memposisikan jemuran di area terbuka agar cucian kering maksimal tersengat sinar matahari.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
