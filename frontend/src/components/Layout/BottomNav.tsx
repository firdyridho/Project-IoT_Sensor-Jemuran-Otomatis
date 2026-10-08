import React from 'react';
import { LayoutDashboard, LineChart, CloudSun, History, Cpu } from 'lucide-react';

export type NavTab = 'dashboard' | 'grafik' | 'cuaca' | 'riwayat' | 'perangkat';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  isRaining?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  isRaining = false,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'grafik' as NavTab, label: 'Grafik', icon: LineChart },
    { id: 'cuaca' as NavTab, label: 'Cuaca', icon: CloudSun },
    { id: 'riwayat' as NavTab, label: 'Riwayat', icon: History },
    { id: 'perangkat' as NavTab, label: 'Perangkat', icon: Cpu },
  ];

  return (
    <nav
      aria-label="Navigasi Utama"
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden border-t bg-kartu/95 backdrop-blur-md border-garis pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg transition-colors"
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
                isActive
                  ? isRaining && tab.id === 'dashboard'
                    ? 'text-cyan-500 font-semibold'
                    : 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-teks-sekunder hover:text-teks-utama'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Highlight bar indicator */}
              {isActive && (
                <span
                  className={`absolute top-0 w-8 h-1 rounded-full ${
                    isRaining && tab.id === 'dashboard'
                      ? 'bg-cyan-500'
                      : 'bg-blue-600 dark:bg-blue-400'
                  }`}
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
