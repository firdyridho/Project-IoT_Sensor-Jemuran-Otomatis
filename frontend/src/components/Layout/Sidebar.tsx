import React from 'react';
import {
  LayoutDashboard,
  LineChart,
  CloudSun,
  History,
  Cpu,
  Radio,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { NavTab } from './BottomNav';
import { Badge } from '../Common/Badge';

interface SidebarProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  deviceName: string;
  isOnline: boolean;
  isRaining: boolean;
  brokerStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  weatherCondition?: 'cerah' | 'mendung' | 'hujan' | 'badai' | 'gerimis';
  theme?: 'light' | 'dark' | 'system';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onChangeTab,
  deviceName,
  isOnline,
  isRaining,
  brokerStatus,
  isCollapsed,
  onToggleCollapse,
  weatherCondition = 'cerah',
  theme = 'dark',
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'grafik' as NavTab, label: 'Grafik Realtime', icon: LineChart },
    { id: 'cuaca' as NavTab, label: 'Prakiraan BMKG', icon: CloudSun },
    { id: 'riwayat' as NavTab, label: 'Riwayat Event', icon: History },
    { id: 'perangkat' as NavTab, label: 'Kelola Perangkat', icon: Cpu },
  ];

  const isDashboard = activeTab === 'dashboard';

  // Desktop sidebar colors MATCHING the mobile footer (BottomNav) 100%
  let sidebarBgClass = '';
  let activeTabClass = '';
  let inactiveTabClass = '';
  let activeIconClass = '';
  let inactiveIconClass = '';
  let deviceCardClass = '';
  let borderClass = '';
  let textMutedClass = '';
  let toggleBtnClass = '';

  if (isDashboard) {
    if (weatherCondition === 'cerah') {
      sidebarBgClass = 'bg-white/90 backdrop-blur-2xl text-slate-900 shadow-xl';
      borderClass = 'border-slate-200/80';
      activeTabClass = 'bg-amber-500/15 text-amber-800 font-bold border-amber-300/60 shadow-xs';
      inactiveTabClass = 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-950';
      activeIconClass = 'text-amber-600 scale-110';
      inactiveIconClass = 'text-slate-500';
      deviceCardClass = 'bg-slate-50/90 border-slate-200/90 text-slate-900';
      textMutedClass = 'text-slate-500';
      toggleBtnClass = 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200/80';
    } else if (weatherCondition === 'mendung') {
      sidebarBgClass = 'bg-[#1e293b] text-white shadow-2xl';
      borderClass = 'border-slate-700';
      activeTabClass = 'bg-amber-400/20 text-amber-200 font-bold border-amber-400/30 shadow-xs';
      inactiveTabClass = 'text-slate-300 hover:bg-white/5 hover:text-white';
      activeIconClass = 'text-amber-300 scale-110';
      inactiveIconClass = 'text-slate-400';
      deviceCardClass = 'bg-white/5 border-white/10 text-white';
      textMutedClass = 'text-slate-400';
      toggleBtnClass = 'text-slate-300 hover:text-white hover:bg-white/10 border-white/10';
    } else if (weatherCondition === 'badai') {
      sidebarBgClass = 'bg-[#0f071f] text-white shadow-2xl';
      borderClass = 'border-purple-900/60';
      activeTabClass = 'bg-purple-500/25 text-purple-200 font-bold border-purple-400/40 shadow-xs';
      inactiveTabClass = 'text-purple-300/70 hover:bg-white/5 hover:text-white';
      activeIconClass = 'text-purple-300 scale-110';
      inactiveIconClass = 'text-purple-400/60';
      deviceCardClass = 'bg-white/5 border-white/10 text-white';
      textMutedClass = 'text-purple-300/60';
      toggleBtnClass = 'text-purple-300 hover:text-white hover:bg-white/10 border-purple-800/40';
    } else {
      // Hujan
      sidebarBgClass = 'bg-[#0b1329] text-white shadow-2xl';
      borderClass = 'border-slate-800';
      activeTabClass = 'bg-blue-500/20 text-cyan-200 font-bold border-blue-400/40 shadow-xs';
      inactiveTabClass = 'text-slate-300 hover:bg-white/5 hover:text-white';
      activeIconClass = 'text-cyan-400 scale-110';
      inactiveIconClass = 'text-slate-400';
      deviceCardClass = 'bg-white/5 border-white/10 text-white';
      textMutedClass = 'text-slate-400';
      toggleBtnClass = 'text-slate-300 hover:text-white hover:bg-white/10 border-white/10';
    }
  } else {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      sidebarBgClass = 'bg-slate-900 text-slate-100 shadow-xl';
      borderClass = 'border-slate-800';
      activeTabClass = 'bg-blue-500/20 text-blue-300 font-bold border-blue-500/30 shadow-xs';
      inactiveTabClass = 'text-slate-400 hover:bg-white/5 hover:text-slate-200';
      activeIconClass = 'text-blue-400 scale-110';
      inactiveIconClass = 'text-slate-500';
      deviceCardClass = 'bg-white/5 border-white/10 text-white';
      textMutedClass = 'text-slate-400';
      toggleBtnClass = 'text-slate-400 hover:text-white hover:bg-white/10 border-white/10';
    } else {
      sidebarBgClass = 'bg-white text-slate-900 shadow-xl';
      borderClass = 'border-slate-200';
      activeTabClass = 'bg-blue-50 text-blue-700 font-bold border-blue-200 shadow-xs';
      inactiveTabClass = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
      activeIconClass = 'text-blue-600 scale-110';
      inactiveIconClass = 'text-slate-400';
      deviceCardClass = 'bg-slate-50 border-slate-200 text-slate-900';
      textMutedClass = 'text-slate-500';
      toggleBtnClass = 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200';
    }
  }

  return (
    <aside
      aria-label="Navigasi Desktop (Tab Vertikal)"
      className={`hidden lg:flex fixed inset-y-0 left-0 flex-col border-r z-40 transition-[width,background-color] duration-300 ease-in-out select-none ${sidebarBgClass} ${borderClass} ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* 1. Header: Logo & Collapse Pane Toggle Button (Chrome Vertical Tabs Style) */}
      <div
        className={`h-16 border-b flex items-center transition-all ${borderClass} ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onToggleCollapse}
              className={`p-2 rounded-xl border flex items-center justify-center transition-all ${toggleBtnClass}`}
              title="Perluas Sidebar (Tab Vertikal)"
              aria-label="Perluas Sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/favicon.svg"
                alt="HujanPantau Logo"
                className="w-9 h-9 rounded-xl shadow-md shrink-0"
              />
              <div className="truncate">
                <h1 className="font-heading font-bold text-base tracking-tight leading-tight truncate">
                  HujanPantau
                </h1>
                <p className={`text-[10px] font-medium truncate ${textMutedClass}`}>
                  IoT Jemuran Otomatis
                </p>
              </div>
            </div>

            {/* Collapse Pane Button (Chrome/Edge Style) */}
            <button
              onClick={onToggleCollapse}
              className={`p-1.5 rounded-xl border flex items-center justify-center transition-all shrink-0 ${toggleBtnClass}`}
              title="Ciutkan Sidebar (Mode Ikon Saja)"
              aria-label="Ciutkan Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* 2. Active Device Quick Glance */}
      <div className={`transition-all ${isCollapsed ? 'px-2 py-3' : 'p-3'}`}>
        {isCollapsed ? (
          <div
            className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 ${deviceCardClass}`}
            title={`Perangkat Aktif: ${deviceName} (${
              brokerStatus !== 'connected'
                ? 'Terputus'
                : !isOnline
                ? 'Offline'
                : isRaining
                ? 'Hujan'
                : 'Online'
            })`}
          >
            <Radio
              className={`w-4 h-4 ${
                !isOnline ? 'text-slate-400' : isRaining ? 'text-cyan-400 animate-pulse' : 'text-emerald-500 animate-pulse'
              }`}
            />
            <span
              className={`w-2 h-2 rounded-full ${
                brokerStatus !== 'connected'
                  ? 'bg-rose-500'
                  : !isOnline
                  ? 'bg-slate-400'
                  : isRaining
                  ? 'bg-cyan-400 animate-ping'
                  : 'bg-emerald-500'
              }`}
            />
          </div>
        ) : (
          <div className={`p-3 rounded-2xl border shadow-xs relative overflow-hidden ${deviceCardClass}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${textMutedClass}`}>
                <Radio className="w-3 h-3 text-cyan-500 animate-pulse" />
                Perangkat Aktif
              </span>
              <Badge
                variant={
                  brokerStatus !== 'connected'
                    ? 'bahaya'
                    : !isOnline
                    ? 'offline'
                    : isRaining
                    ? 'hujan'
                    : 'kering'
                }
                dot
              >
                {brokerStatus !== 'connected'
                  ? 'Terputus'
                  : !isOnline
                  ? 'Offline'
                  : isRaining
                  ? 'Hujan'
                  : 'Online'}
              </Badge>
            </div>
            <p className="text-xs font-bold truncate font-heading tracking-wide">
              {deviceName}
            </p>
          </div>
        )}
      </div>

      {/* 3. Navigation List (Vertical Tabs) */}
      <nav className={`flex-1 space-y-1.5 overflow-y-auto ${isCollapsed ? 'px-2 py-1' : 'px-3 py-2'}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (isCollapsed) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`w-full flex items-center justify-center p-3 rounded-xl min-h-11 transition-all border relative ${
                  isActive
                    ? activeTabClass
                    : `border-transparent ${inactiveTabClass}`
                }`}
                title={tab.label}
                aria-label={tab.label}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    isActive ? activeIconClass : inactiveIconClass
                  }`}
                  aria-hidden="true"
                />
                {tab.id === 'dashboard' && isRaining && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all text-left min-h-11 border ${
                isActive
                  ? activeTabClass
                  : `border-transparent ${inactiveTabClass}`
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform ${
                  isActive ? activeIconClass : inactiveIconClass
                }`}
                aria-hidden="true"
              />
              <span className="truncate">{tab.label}</span>
              {tab.id === 'dashboard' && isRaining && (
                <span className="ml-auto w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 4. Footer Attribution */}
      <div className={`transition-all border-t ${borderClass} ${isCollapsed ? 'p-2 text-center' : 'p-3'}`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center justify-center py-1" title="Data prakiraan BMKG">
            <span className={`text-[9px] font-bold ${textMutedClass}`}>BMKG</span>
          </div>
        ) : (
          <div className={`p-2.5 rounded-xl border text-[10px] space-y-0.5 ${deviceCardClass}`}>
            <p className="font-bold">Atribusi Resmi BMKG:</p>
            <p className={`leading-relaxed ${textMutedClass}`}>
              Data cuaca terbuka dari <strong>BMKG Indonesia</strong>.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
