import React from 'react';
import { LayoutDashboard, LineChart, CloudSun, History, Cpu } from 'lucide-react';

export type NavTab = 'dashboard' | 'grafik' | 'cuaca' | 'riwayat' | 'perangkat';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  isRaining?: boolean;
  theme?: 'light' | 'dark' | 'system';
  weatherCondition?: 'cerah' | 'mendung' | 'hujan' | 'badai' | 'gerimis';
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  isRaining = false,
  theme = 'dark',
  weatherCondition = 'cerah',
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'grafik' as NavTab, label: 'Grafik', icon: LineChart },
    { id: 'cuaca' as NavTab, label: 'Cuaca', icon: CloudSun },
    { id: 'riwayat' as NavTab, label: 'Riwayat', icon: History },
    { id: 'perangkat' as NavTab, label: 'Perangkat', icon: Cpu },
  ];

  const isDashboard = activeTab === 'dashboard';

  let navBgClass = '';
  let activeTextClass = '';
  let inactiveTextClass = '';
  let indicatorColor = '';

  if (isDashboard) {
    // Khusus di Dashboard: Footernya sesuaikan dengan kondisi cuaca secara solid (tanpa glassmorphism)
    if (weatherCondition === 'cerah') {
      navBgClass = 'bg-[#c26115] border-[#a04b08] text-white shadow-2xl';
      activeTextClass = 'text-white font-black';
      inactiveTextClass = 'text-amber-200/80 hover:text-white';
      indicatorColor = 'bg-white';
    } else if (weatherCondition === 'mendung') {
      navBgClass = 'bg-[#1e293b] border-slate-700 text-white shadow-2xl';
      activeTextClass = 'text-amber-300 font-black';
      inactiveTextClass = 'text-slate-400 hover:text-slate-200';
      indicatorColor = 'bg-amber-400';
    } else if (weatherCondition === 'badai') {
      navBgClass = 'bg-[#0f071f] border-purple-900/60 text-white shadow-2xl';
      activeTextClass = 'text-purple-300 font-black';
      inactiveTextClass = 'text-purple-300/60 hover:text-white';
      indicatorColor = 'bg-purple-400';
    } else {
      // Hujan
      navBgClass = 'bg-[#0b1329] border-slate-800 text-white shadow-2xl';
      activeTextClass = 'text-cyan-300 font-black';
      inactiveTextClass = 'text-slate-400 hover:text-white';
      indicatorColor = 'bg-cyan-400';
    }
  } else {
    // Di luar Dashboard: Sesuai settingan mode light atau dark solid (bukan glassmorphism)
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      navBgClass = 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl';
      activeTextClass = 'text-blue-400 font-bold';
      inactiveTextClass = 'text-slate-400 hover:text-slate-200';
      indicatorColor = 'bg-blue-500';
    } else {
      navBgClass = 'bg-white border-slate-200 text-slate-900 shadow-xl';
      activeTextClass = 'text-blue-600 font-bold';
      inactiveTextClass = 'text-slate-500 hover:text-slate-800';
      indicatorColor = 'bg-blue-600';
    }
  }

  return (
    <nav
      aria-label="Navigasi Utama"
      className={`fixed inset-x-0 bottom-0 z-40 lg:hidden border-t pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl transition-colors duration-300 ${navBgClass}`}
    >
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center min-h-11 min-w-11 px-1 py-1 transition-all focus:outline-none relative ${
                isActive ? activeTextClass : inactiveTextClass
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Highlight bar indicator */}
              {isActive && (
                <span
                  className={`absolute top-0 w-8 h-1 rounded-full ${indicatorColor}`}
                />
              )}

              <div className="relative mt-1">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                  aria-hidden="true"
                />
                {tab.id === 'dashboard' && isRaining && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
                )}
              </div>

              <span className="text-[11px] tracking-tight mt-1 truncate max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
