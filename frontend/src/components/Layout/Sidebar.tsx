import React from 'react';
import {
  LayoutDashboard,
  LineChart,
  CloudSun,
  History,
  Cpu,
  CloudRain,
  X,
  Radio,
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
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onChangeTab,
  deviceName,
  isOnline,
  isRaining,
  brokerStatus,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'grafik' as NavTab, label: 'Grafik Realtime', icon: LineChart },
    { id: 'cuaca' as NavTab, label: 'Prakiraan BMKG', icon: CloudSun },
    { id: 'riwayat' as NavTab, label: 'Riwayat Event', icon: History },
    { id: 'perangkat' as NavTab, label: 'Kelola Perangkat', icon: Cpu },
  ];

  const handleSelectTab = (tabId: NavTab) => {
    onChangeTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 border border-white/20">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg text-white tracking-tight leading-tight">
              HujanPantau
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">IoT Jemuran Otomatis</p>
          </div>
        </div>

        {/* Close Button for Mobile Drawer */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden min-h-11 min-w-11 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Active Device Quick Glance (Glassmorphism Card) */}
      <div className="p-4 mx-3.5 my-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
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
        <p className="text-sm font-bold text-white truncate font-heading tracking-wide">
          {deviceName}
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all text-left min-h-11 ${
                isActive
                  ? 'bg-blue-500/20 text-white font-bold border border-blue-400/40 shadow-lg shadow-blue-500/15'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform ${
                  isActive ? 'text-cyan-400 scale-110' : 'text-slate-400'
                }`}
                aria-hidden="true"
              />
              <span>{tab.label}</span>
              {tab.id === 'dashboard' && isRaining && (
                <span className="ml-auto w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Mandatory BMKG Legal Attribution in Footer */}
      <div className="p-4 mx-3 mb-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-slate-400 space-y-1">
        <p className="font-semibold text-slate-200">Atribusi Resmi BMKG:</p>
        <p className="leading-relaxed opacity-85 text-[10px]">
          Data prakiraan cuaca bersumber dari <strong>Badan Meteorologi, Klimatologi, dan Geofisika</strong>.
        </p>
        <p className="text-[10px] text-slate-400 pt-0.5">v1.2.0 • Realtime IoT</p>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Permanent Left Sidebar (Harmonious Glassmorphism) */}
      <aside
        aria-label="Navigasi Desktop"
        className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-slate-950/75 backdrop-blur-2xl border-r border-white/10 z-40"
      >
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer & Backdrop (Hamburger Menu Slide-Out) */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Slide-Over Panel */}
          <aside
            aria-label="Navigasi Menu Mobile"
            className="relative w-72 max-w-[85vw] h-full bg-slate-950/90 backdrop-blur-2xl border-r border-white/15 z-10 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300"
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
