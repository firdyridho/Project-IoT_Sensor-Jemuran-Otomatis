import React from 'react';
import { LayoutDashboard, LineChart, CloudSun, History, Cpu, CloudRain } from 'lucide-react';
import { NavTab } from './BottomNav';
import { Badge } from '../Common/Badge';

interface SidebarProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  deviceName: string;
  isOnline: boolean;
  isRaining: boolean;
  brokerStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onChangeTab,
  deviceName,
  isOnline,
  isRaining,
  brokerStatus,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'grafik' as NavTab, label: 'Grafik Realtime', icon: LineChart },
    { id: 'cuaca' as NavTab, label: 'Prakiraan BMKG', icon: CloudSun },
    { id: 'riwayat' as NavTab, label: 'Riwayat Event', icon: History },
    { id: 'perangkat' as NavTab, label: 'Kelola Perangkat', icon: Cpu },
  ];

  return (
    <aside
      aria-label="Navigasi Desktop"
      className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r bg-kartu border-garis z-40 select-none"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-garis flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
          <CloudRain className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-lg tracking-tight leading-tight">
            HujanPantau
          </h1>
          <p className="text-xs text-teks-sekunder">IoT Jemuran Cerdas</p>
        </div>
      </div>

      {/* Active Device Quick Glance */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-kartu-muted border border-garis/60">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-teks-sekunder uppercase tracking-wider">
            Perangkat
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
              ? 'Broker Putus'
              : !isOnline
              ? 'Offline'
              : isRaining
              ? 'Hujan'
              : 'Online'}
          </Badge>
        </div>
        <p className="text-sm font-semibold truncate text-teks-utama">{deviceName}</p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                isActive
                  ? isRaining && tab.id === 'dashboard'
                    ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-semibold shadow-xs'
                    : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                  : 'text-teks-sekunder hover:bg-kartu-muted hover:text-teks-utama'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
              {tab.id === 'dashboard' && isRaining && (
                <span className="ml-auto w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Mandatory BMKG Legal Attribution in Footer */}
      <div className="p-4 border-t border-garis text-[11px] text-teks-sekunder space-y-1">
        <p className="font-medium text-teks-utama">Atribusi Resmi:</p>
        <p className="leading-relaxed opacity-80">
          Sumber data cuaca: <strong>Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)</strong>
        </p>
        <p className="text-[10px] text-teks-sekunder/70 pt-1">v1.0.0 • Tanpa Backend</p>
      </div>
    </aside>
  );
};
