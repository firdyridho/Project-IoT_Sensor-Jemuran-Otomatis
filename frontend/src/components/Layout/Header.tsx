import React from 'react';
import { Sun, Moon, Laptop, Bell, BellOff, BellRing, Wifi, WifiOff, CloudRain, LogOut } from 'lucide-react';
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
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-kartu/90 backdrop-blur-md border-garis transition-colors">
      <div className="mx-auto max-w-6xl px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Left: Mobile Brand & Device Selector */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="lg:hidden flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-xs">
              <CloudRain className="w-5 h-5" />
            </div>
          </div>

          {/* Device Selector */}
          <div className="relative">
            {devices.length > 1 ? (
              <select
                value={activeDevice.deviceId}
                onChange={(e) => onSelectDevice(e.target.value)}
                className="bg-kartu-muted border border-garis rounded-xl text-xs font-semibold px-3 py-2 pr-7 text-teks-utama focus:outline-none focus:ring-2 focus:ring-cyan-500 truncate max-w-[150px] sm:max-w-[200px]"
                aria-label="Pilih perangkat"
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.nama}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-heading font-semibold text-sm sm:text-base text-teks-utama truncate max-w-[130px] sm:max-w-none">
                  {activeDevice.nama}
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono text-teks-sekunder px-1.5 py-0.5 rounded bg-kartu-muted border border-garis">
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

        {/* Right: Notifications, Theme */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Browser Notification Button */}
          <button
            onClick={onRequestNotif}
            className={`min-h-11 min-w-11 p-2 rounded-xl border flex items-center justify-center transition-all ${
              notifPermission === 'granted'
                ? 'bg-kartu-muted text-cyan-600 dark:text-cyan-400 border-garis'
                : notifPermission === 'denied'
                ? 'bg-red-500/10 text-red-500 border-red-500/30'
                : 'bg-kartu-muted text-teks-sekunder hover:text-teks-utama border-garis'
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

          {/* Theme switcher */}
          <button
            onClick={onToggleTheme}
            className="min-h-11 min-w-11 p-2 rounded-xl bg-kartu-muted text-teks-utama border border-garis hover:bg-garis flex items-center justify-center transition-all"
            aria-label={`Ganti tema, tema saat ini: ${theme}`}
            title={`Tema: ${theme}`}
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-cyan-400" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Laptop className="w-4 h-4 text-teks-sekunder" />
            )}
          </button>

          {/* User profile & Logout */}
          {user && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-garis">
              <div
                className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-kartu-muted border border-garis text-xs text-teks-utama"
                title={`Masuk sebagai: @${user.username}`}
              >
                <div className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-center text-[10px]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold truncate max-w-[110px]">{user.name}</span>
              </div>
              <button
                onClick={onLogout}
                className="min-h-11 min-w-11 p-2 rounded-xl text-teks-sekunder hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 flex items-center justify-center transition-all"
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
