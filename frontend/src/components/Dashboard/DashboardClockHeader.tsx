import React, { useState, useEffect } from 'react';

interface DashboardClockHeaderProps {
  condition: 'cerah' | 'mendung' | 'gerimis' | 'hujan' | 'badai';
}

export const DashboardClockHeader: React.FC<DashboardClockHeaderProps> = ({ condition }) => {
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

  const isCerah = condition === 'cerah';
  const clockColor = isCerah ? 'text-slate-950 font-black drop-shadow-sm' : 'text-white font-black drop-shadow-md';
  const dateColor = isCerah ? 'text-slate-950 font-black tracking-widest' : 'text-slate-100 font-bold tracking-widest';

  return (
    <div className="flex flex-col items-center justify-center pt-2 pb-1 text-center select-none">
      {/* Large Digital Clock Header */}
      <div className={`text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-mono ${clockColor} drop-shadow-sm`}>
        {hoursStr}:{minutesStr}
      </div>
      <div className={`text-xs sm:text-sm tracking-wider uppercase mt-1 ${dateColor}`}>
        {dateFormatted}
      </div>
    </div>
  );
};
