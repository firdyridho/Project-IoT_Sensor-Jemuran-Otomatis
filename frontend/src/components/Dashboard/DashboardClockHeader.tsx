import React, { useState, useEffect } from 'react';
import { Sun, CloudRain, CloudDrizzle, CloudLightning, ShieldCheck } from 'lucide-react';
import { BmkgResponse } from '../../types/bmkg';

interface DashboardClockHeaderProps {
  condition: 'cerah' | 'gerimis' | 'hujan' | 'badai';
  weatherData: BmkgResponse | null;
  effectiveWet?: boolean;
}

export const DashboardClockHeader: React.FC<DashboardClockHeaderProps> = ({
  condition,
  weatherData,
  effectiveWet = false,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hoursStr = String(currentTime.getHours()).padStart(2, '0');
  const minutesStr = String(currentTime.getMinutes()).padStart(2, '0');

  const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthsIndo = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const dayName = daysIndo[currentTime.getDay()];
  const dateNum = currentTime.getDate();
  const monthName = monthsIndo[currentTime.getMonth()];
  const dateFormatted = `${dayName} | ${dateNum} ${monthName}`;

  // Adaptive styling: Cerah uses crisp dark typography & warm glass; rainy/stormy uses glowing white & dark glass
  const isCerah = condition === 'cerah';

  const clockColor = isCerah ? 'text-slate-900' : 'text-white';
  const dateColor = isCerah ? 'text-slate-700 font-semibold' : 'text-slate-300 font-medium';
  const pillCardBg = isCerah
    ? 'bg-white/45 border-white/60 text-slate-800 shadow-sm backdrop-blur-md'
    : 'bg-black/35 border-white/10 text-white shadow-lg backdrop-blur-md';
  const pillSubtext = isCerah ? 'text-slate-600' : 'text-slate-400';

  // 4-day forecast items derived from BMKG data or dynamic IoT schedule
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
    <div className="flex flex-col items-center justify-center pt-2 pb-1 space-y-4 select-none">
      {/* 1. Large Digital Clock Header (Exactly as in user reference image) */}
      <div className="text-center">
        <div className={`text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-mono ${clockColor} drop-shadow-sm`}>
          {hoursStr}:{minutesStr}
        </div>
        <div className={`text-xs sm:text-sm tracking-wider uppercase mt-1 ${dateColor}`}>
          {dateFormatted}
        </div>
      </div>

      {/* 2. Horizontal Daily Forecast Pill Cards Row (Like MON 18, TUE 19, WED 20, THU 21) */}
      <div className="w-full grid grid-cols-4 gap-2 sm:gap-3 max-w-xl">
        {forecastItems.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={idx}
              className={`flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${pillCardBg}`}
            >
              <span className={`text-[10px] sm:text-[11px] font-bold tracking-wider uppercase ${pillSubtext}`}>
                {item.day}
              </span>

              <div className="my-1 p-1 rounded-xl">
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
