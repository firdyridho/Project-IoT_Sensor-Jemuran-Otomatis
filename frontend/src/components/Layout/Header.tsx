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
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-slate-950/75 backdrop-blur-2xl border-white/10 text-white transition-colors">
      <div className="mx-auto max-w-6xl px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2.5">
        {/* Left: Mobile Hamburger Trigger & Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile Hamburger Menu Button */}
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden min-h-11 min-w-11 p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all shrink-0 active:scale-95"
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
                className="bg-white/5 border border-white/10 rounded-xl text-xs font-semibold px-3 py-2 pr-7 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 truncate max-w-[140px] sm:max-w-[200px]"
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
                <span className="font-heading font-bold text-sm sm:text-base text-white truncate max-w-[130px] sm:max-w-none">
                  {activeDevice.nama}
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
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
                ? 'bg-blue-500/20 text-cyan-300 border-blue-400/40 shadow-xs'
                : notifPermission === 'denied'
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : 'bg-white/5 text-slate-300 hover:text-white border-white/10 hover:bg-white/10'
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

          {/* Theme Switcher (Hanya ditampilkan bila bukan di mode paksa dashboard, atau tetap ada untuk tab lain) */}
          <button
            onClick={onToggleTheme}
            className="min-h-11 min-w-11 p-2 rounded-xl bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all"
            aria-label={`Ganti tema, tema saat ini: ${theme}`}
            title={`Tema: ${theme}`}
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-cyan-300" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Laptop className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* User profile & Logout */}
          {user && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-white/10">
              <div
                className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                title={`Masuk sebagai: @${user.username}`}
              >
                <div className="w-5 h-5 rounded-lg bg-blue-500/30 text-cyan-300 font-bold flex items-center justify-center text-[10px] border border-blue-400/30">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold truncate max-w-[110px]">{user.name}</span>
              </div>
              <button
                onClick={onLogout}
                className="min-h-11 min-w-11 p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 flex items-center justify-center transition-all"
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
