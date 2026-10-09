import React from 'react';
import { ShieldCheck, Sun, Umbrella, Cog, ArrowLeft, ArrowRight, Home, CloudSun, Cloud } from 'lucide-react';
import { Card } from '../Common/Card';

export type MotorWeatherCondition = 'cerah' | 'mendung' | 'hujan' | 'badai' | 'gerimis';

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
  const isProtected = isRaining || condition === 'hujan' || condition === 'gerimis' || condition === 'badai';

  return (
    <Card
      className={`relative overflow-hidden border p-4 sm:p-6 backdrop-blur-xl shadow-2xl transition-all duration-700 ${
        isCerah
          ? 'bg-white/60 border-white/80 text-slate-950'
          : 'border-white/15 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-blue-950/70 text-white'
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
          isCerah ? 'border-slate-300' : 'border-slate-800'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-black uppercase tracking-wider ${
                isCerah ? 'text-slate-950' : 'text-blue-400'
              }`}
            >
              Mekanisme Otomatisasi IoT
            </span>
            <span
              className={`w-2 h-2 rounded-full animate-ping ${
                isCerah ? 'bg-amber-500' : 'bg-blue-400'
              }`}
            />
          </div>
          <h3
            className={`text-lg sm:text-xl font-black tracking-tight mt-0.5 font-heading ${
              isCerah ? 'text-slate-950' : 'text-white'
            }`}
          >
            Sistem Rel Jemuran & Motor DC
          </h3>
        </div>

        {/* Safety Badge with High Contrast */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-black transition-all duration-500 shadow-md ${
            isProtected
              ? 'bg-emerald-400 text-slate-950 border-emerald-300'
              : isMendung
              ? 'bg-amber-400 text-slate-950 border-amber-300'
              : 'bg-slate-950 text-amber-300 border-slate-800'
          }`}
        >
          {isProtected ? (
            <>
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>JEMURAN AMAN (TERLINDUNGI)</span>
            </>
          ) : isMendung ? (
            <>
              <Cloud className="w-4 h-4 text-slate-950" />
              <span>JEMURAN SIAGA (MENDUNG)</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-300" />
              <span>SEDANG MENJEMUR (TERIK)</span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Visual Rail & Motor Graphic */}
      <div
        className={`my-5 p-4 rounded-2xl border relative transition-colors duration-500 ${
          isCerah
            ? 'bg-white/80 border-slate-200 shadow-inner'
            : 'bg-slate-950/70 border-slate-800'
        }`}
      >
        <div
          className={`flex items-center justify-between text-xs mb-3 px-1 ${
            isCerah ? 'text-slate-900 font-bold' : 'text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5 font-black text-emerald-600 dark:text-emerald-400">
            <Home className="w-3.5 h-3.5" /> Area Teduh / Atap
          </span>
          <span className="text-[11px] font-mono font-bold opacity-80">
            Panjang Rel: 2.5 Meter
          </span>
          <span className="flex items-center gap-1.5 font-black text-amber-600 dark:text-amber-400">
            <CloudSun className="w-3.5 h-3.5" /> Area Terbuka
          </span>
        </div>

        {/* The Track Rail */}
        <div
          className={`relative h-6 rounded-full border overflow-hidden flex items-center px-1 transition-colors duration-500 ${
            isCerah
              ? 'bg-slate-200 border-slate-300'
              : 'bg-slate-800/80 border-slate-700/60'
          }`}
        >
          {/* Track Guides */}
          <div
            className={`absolute inset-x-2 h-1 rounded-full ${
              isCerah ? 'bg-slate-400' : 'bg-slate-700'
            }`}
          />

          {/* Motorized Cart / Hanger Slider */}
          <div
            className={`relative flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black shadow-lg transition-all duration-1000 transform ${
              isProtected
                ? 'translate-x-0 bg-emerald-500 text-white ring-2 ring-emerald-300'
                : 'translate-x-[calc(100%-8px)] sm:translate-x-[calc(260px)] md:translate-x-[calc(380px)] bg-amber-500 text-white ring-2 ring-amber-300'
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
                  ? 'bg-slate-950 text-white'
                  : 'bg-blue-500/20 text-blue-400'
              } ${isProtected ? 'animate-spin' : ''}`}
            >
              <Cog className="w-4 h-4" />
            </div>
            <div>
              <div
                className={`text-xs font-black ${
                  isCerah ? 'text-slate-950' : 'text-slate-100'
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
                  isCerah ? 'text-slate-700 font-bold' : 'text-slate-300'
                }`}
              >
                Driver L298N • PWM 85%
              </div>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-md shadow-xs ${
                isProtected
                  ? 'bg-emerald-500 text-slate-950 border border-emerald-400'
                  : isMendung
                  ? 'bg-amber-400 text-slate-950 border border-amber-300'
                  : isCerah
                  ? 'bg-slate-950 text-amber-300 border border-slate-800'
                  : 'bg-amber-950 text-amber-200 border border-amber-800'
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
            ? 'bg-white/80 border-slate-300 text-slate-900 shadow-sm'
            : 'bg-slate-950/70 border-white/10 text-slate-100'
        }`}
      >
        <div
          className={`p-1 rounded-md shrink-0 mt-0.5 ${
            isCerah
              ? 'bg-slate-950 text-white'
              : 'bg-blue-500/20 text-blue-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          {isProtected ? (
            <p>
              <strong className={isCerah ? 'text-emerald-800 font-black' : 'text-emerald-300 font-bold'}>
                Jemuran Aman!
              </strong>{' '}
              Sensor IoT mendeteksi kondisi{' '}
              <span className={`font-black capitalize ${isCerah ? 'text-slate-950' : 'text-white'}`}>
                {condition}
              </span>
              . Motor DC otomatis menarik rel jemuran ke bawah atap kanopi sehingga pakaian tidak basah terkena air hujan.
            </p>
          ) : isMendung ? (
            <p>
              <strong className={isCerah ? 'text-amber-900 font-black' : 'text-amber-300 font-bold'}>
                Kondisi Mendung Tebal.
              </strong>{' '}
              Sensor IoT belum mendeteksi tetesan air hujan. Motor DC berada dalam mode siaga aktif untuk segera menarik rel jemuran jika hujan mulai terdeteksi.
            </p>
          ) : (
            <p>
              <strong className={isCerah ? 'text-amber-900 font-black' : 'text-amber-300 font-bold'}>
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
