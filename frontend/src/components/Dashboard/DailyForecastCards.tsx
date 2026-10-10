import React from 'react';
import { Sun, Cloud, CloudRain, CloudDrizzle, CloudLightning } from 'lucide-react';
import { BmkgResponse } from '../../types/bmkg';

interface DailyForecastCardsProps {
  condition: 'cerah' | 'mendung' | 'gerimis' | 'hujan' | 'badai';
  weatherData: BmkgResponse | null;
  effectiveWet?: boolean;
}

export const DailyForecastCards: React.FC<DailyForecastCardsProps> = ({
  condition,
  weatherData,
  effectiveWet = false,
}) => {
  const isCerah = condition === 'cerah';

  const pillCardBg = isCerah
    ? 'bg-white/95 border-slate-200/90 text-slate-900 shadow-xs backdrop-blur-xl'
    : 'bg-slate-900/90 border-white/15 text-white shadow-xl backdrop-blur-xl';

  const pillSubtext = isCerah ? 'text-slate-500 font-medium' : 'text-slate-200 font-medium';

  const forecastItems = [
    {
      day: 'HARI INI',
      icon:
        condition === 'cerah'
          ? Sun
          : condition === 'mendung'
          ? Cloud
          : CloudRain,
      iconColor:
        condition === 'cerah'
          ? 'text-amber-500'
          : condition === 'mendung'
          ? 'text-slate-300'
          : 'text-cyan-400',
      temp: '26° / 31°',
      rainChance: effectiveWet ? '95% Rain' : condition === 'mendung' ? '45% Rain' : '15% Rain',
      safeBadge: effectiveWet ? 'Siaga' : condition === 'mendung' ? 'Siaga' : 'Aman',
    },
    {
      day: 'BESOK',
      icon: Sun,
      iconColor: 'text-amber-400',
      temp: '27° / 32°',
      rainChance: '10% Rain',
      safeBadge: 'Aman',
    },
    {
      day: 'LUSA',
      icon: Cloud,
      iconColor: 'text-slate-300',
      temp: '25° / 29°',
      rainChance: '45% Rain',
      safeBadge: 'Waspada',
    },
    {
      day: 'NANTI',
      icon: CloudLightning,
      iconColor: 'text-indigo-400',
      temp: '24° / 28°',
      rainChance: '80% Rain',
      safeBadge: 'Tutup',
    },
  ];

  return (
    <div className="w-full">
      <div className={`flex items-center justify-between text-xs font-bold px-1 mb-2 ${isCerah ? 'text-slate-800' : 'text-white'}`}>
        <span>Perkiraan Cuaca & Situasi Jemuran</span>
        <span className="opacity-80">4 Periode</span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {forecastItems.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={idx}
              className={`flex flex-col items-center justify-between p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${pillCardBg}`}
            >
              <span className={`text-[10px] sm:text-[11px] font-bold tracking-wider uppercase ${isCerah ? 'text-slate-700' : 'text-slate-100'}`}>
                {item.day}
              </span>

              <div className="my-1.5 p-1 rounded-xl">
                <IconComp className={`w-5 h-5 sm:w-6 sm:h-6 ${item.iconColor}`} />
              </div>

              <div className={`text-[11px] sm:text-xs font-black font-mono ${isCerah ? 'text-slate-950' : 'text-white'}`}>
                {item.temp}
              </div>

              <div className={`text-[9px] sm:text-[10px] mt-0.5 ${pillSubtext}`}>
                {item.rainChance}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
