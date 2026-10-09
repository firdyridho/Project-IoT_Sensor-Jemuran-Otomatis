import React from 'react';
import { Sun, CloudRain, CloudDrizzle, CloudLightning } from 'lucide-react';
import { BmkgResponse } from '../../types/bmkg';

interface DailyForecastCardsProps {
  condition: 'cerah' | 'gerimis' | 'hujan' | 'badai';
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
    ? 'bg-white/40 border-white/60 text-slate-800 shadow-md backdrop-blur-xl'
    : 'bg-slate-900/60 border-white/10 text-white shadow-xl backdrop-blur-xl';

  const pillSubtext = isCerah ? 'text-slate-600' : 'text-slate-400';

  const forecastItems = [
    {
      day: 'HARI INI',
      icon: condition === 'cerah' ? Sun : condition === 'gerimis' ? CloudDrizzle : CloudRain,
      iconColor: condition === 'cerah' ? 'text-amber-500' : 'text-cyan-400',
      temp: '26° / 31°',
      rainChance: effectiveWet ? '95% Rain' : '15% Rain',
      safeBadge: effectiveWet ? 'Siaga' : 'Aman',
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
      icon: CloudDrizzle,
      iconColor: 'text-sky-400',
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
      <div className="flex items-center justify-between text-xs font-semibold opacity-70 px-1 mb-2">
        <span>Perkiraan Cuaca & Situasi Jemuran</span>
        <span>4 Periode</span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {forecastItems.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={idx}
              className={`flex flex-col items-center justify-between p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${pillCardBg}`}
            >
              <span className={`text-[10px] sm:text-[11px] font-bold tracking-wider uppercase ${pillSubtext}`}>
                {item.day}
              </span>

              <div className="my-1.5 p-1 rounded-xl">
                <IconComp className={`w-5 h-5 sm:w-6 sm:h-6 ${item.iconColor}`} />
              </div>

              <div className="text-[11px] sm:text-xs font-bold font-mono">
                {item.temp}
              </div>

              <div className={`text-[9px] sm:text-[10px] font-medium mt-0.5 ${pillSubtext}`}>
                {item.rainChance}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
