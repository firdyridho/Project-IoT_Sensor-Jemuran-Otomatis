import React from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Bell,
  BellOff,
  BellRing,
  CloudRain,
  LogOut,
  Menu,
} from 'lucide-react';
import { Perangkat } from '../../types/iot';
import { User } from '../../types/auth';
import { Badge } from '../Common/Badge';

interface HeaderProps {
  devices: Perangkat[];
  activeDevice: Perangkat;
  onSelectDevice: (deviceId: string) => void;
  brokerStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  isOnline: boolean;
  isRaining: boolean;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
  notifPermission: NotificationPermission;
  onRequestNotif: () => void;
  user?: User;
  onLogout?: () => void;
  onOpenMobileMenu?: () => void;
  isDashboard?: boolean;
  weatherCondition?: 'cerah' | 'mendung' | 'hujan' | 'badai' | 'gerimis';
}

export const Header: React.FC<HeaderProps> = ({
  devices,
  activeDevice,
  onSelectDevice,
  brokerStatus,
  isOnline,
  isRaining,
  theme,
  onToggleTheme,
  notifPermission,
  onRequestNotif,
  user,
  onLogout,
  onOpenMobileMenu,
  isDashboard = true,
  weatherCondition = 'cerah',
}) => {
  // Freezed (sticky) header colors matching theme and weather
  let headerBgClass = '';
  let buttonBgClass = '';
  let selectBgClass = '';
  let borderClass = '';

  if (isDashboard) {
    if (weatherCondition === 'cerah') {
      headerBgClass = 'bg-[#9a3412] text-white shadow-xl';
      borderClass = 'border-[#7c2d12]';
      buttonBgClass = 'bg-white/10 hover:bg-white/20 text-white border-white/20';
      selectBgClass = 'bg-white/15 text-white border-white/20';
    } else if (weatherCondition === 'mendung') {
      headerBgClass = 'bg-[#1e293b] text-white shadow-xl';
      borderClass = 'border-slate-700';
      buttonBgClass = 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600';
      selectBgClass = 'bg-slate-800 text-white border-slate-600';
    } else if (weatherCondition === 'badai') {
      headerBgClass = 'bg-[#0f071f] text-white shadow-xl';
      borderClass = 'border-purple-900/60';
      buttonBgClass = 'bg-white/10 hover:bg-white/20 text-purple-200 border-purple-500/30';
      selectBgClass = 'bg-purple-950/60 text-white border-purple-800/40';
    } else {
      // Hujan
      headerBgClass = 'bg-[#0b1329] text-white shadow-xl';
      borderClass = 'border-slate-800';
      buttonBgClass = 'bg-white/10 hover:bg-white/20 text-cyan-200 border-white/15';
      selectBgClass = 'bg-slate-900 text-white border-slate-700';
    }
  } else {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      headerBgClass = 'bg-slate-900 text-slate-100 shadow-md';
      borderClass = 'border-slate-800';
      buttonBgClass = 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700';
      selectBgClass = 'bg-slate-800 text-white border-slate-700';
    } else {
      headerBgClass = 'bg-white text-slate-900 shadow-md';
      borderClass = 'border-slate-200';
      buttonBgClass = 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300';
      selectBgClass = 'bg-slate-50 text-slate-900 border-slate-300';
    }
  }

  return (
    <header className={`sticky top-0 z-50 w-full border-b transition-colors duration-300 ${headerBgClass} ${borderClass}`}>
      <div className="mx-auto max-w-6xl px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2.5">
        {/* Left: Mobile Hamburger Trigger & Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile Hamburger Menu Button */}
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className={`lg:hidden min-h-11 min-w-11 p-2 rounded-xl border flex items-center justify-center transition-all shrink-0 active:scale-95 ${buttonBgClass}`}
              aria-label="Buka Menu Navigasi"
              title="Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Mobile Brand Icon */}
          <div className="hidden xs:flex lg:hidden items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 border border-white/15">
              <CloudRain className="w-5 h-5" />
            </div>
          </div>

          {/* Device Selector */}
          <div className="relative">
            {devices.length > 1 ? (
              <select
                value={activeDevice.deviceId}
                onChange={(e) => onSelectDevice(e.target.value)}
                className={`border rounded-xl text-xs font-semibold px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-400 truncate max-w-[140px] sm:max-w-[200px] ${selectBgClass}`}
                aria-label="Pilih perangkat"
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId} className="bg-slate-900 text-white">
                    {d.nama}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm sm:text-base truncate max-w-[130px] sm:max-w-none">
                  {activeDevice.nama}
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono opacity-80 px-1.5 py-0.5 rounded bg-black/15 border border-white/10">
                  {activeDevice.deviceId}
                </span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="hidden sm:flex items-center">
            {brokerStatus !== 'connected' ? (
              <Badge variant="bahaya" dot>
                {brokerStatus === 'connecting' ? 'Menyambung...' : 'Broker Terputus'}
              </Badge>
            ) : !isOnline ? (
              <Badge variant="offline" dot>
                Offline
              </Badge>
            ) : isRaining ? (
              <Badge variant="hujan" dot>
                Hujan
              </Badge>
            ) : (
              <Badge variant="kering" dot>
                Online
              </Badge>
            )}
          </div>
        </div>

        {/* Right: Notifications, Theme Switcher, User Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Browser Notification Button */}
          <button
            onClick={onRequestNotif}
            className={`min-h-11 min-w-11 p-2 rounded-xl border flex items-center justify-center transition-all ${
              notifPermission === 'granted'
                ? 'bg-blue-500/25 text-cyan-200 border-blue-400/50 shadow-xs'
                : notifPermission === 'denied'
                ? 'bg-red-500/20 text-red-200 border-red-500/40'
                : buttonBgClass
            }`}
            aria-label="Status Notifikasi Browser"
            title={
              notifPermission === 'granted'
                ? 'Notifikasi browser aktif'
                : notifPermission === 'denied'
                ? 'Notifikasi diblokir di browser'
                : 'Klik untuk mengaktifkan notifikasi hujan'
            }
          >
            {notifPermission === 'granted' ? (
              <BellRing className="w-4 h-4" />
            ) : notifPermission === 'denied' ? (
              <BellOff className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className={`min-h-11 min-w-11 p-2 rounded-xl border flex items-center justify-center transition-all ${buttonBgClass}`}
            aria-label={`Ganti tema, tema saat ini: ${theme}`}
            title={`Tema: ${theme}`}
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-cyan-300" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Laptop className="w-4 h-4 opacity-80" />
            )}
          </button>

          {/* User profile & Logout */}
          {user && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-white/15">
              <div
                className={`hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs ${buttonBgClass}`}
                title={`Masuk sebagai: @${user.username}`}
              >
                <div className="w-5 h-5 rounded-lg bg-blue-500/30 text-cyan-300 font-bold flex items-center justify-center text-[10px] border border-blue-400/30">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold truncate max-w-[110px]">{user.name}</span>
              </div>
              <button
                onClick={onLogout}
                className="min-h-11 min-w-11 p-2 rounded-xl text-slate-300 hover:text-red-300 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 flex items-center justify-center transition-all"
                title="Keluar dari akun"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
