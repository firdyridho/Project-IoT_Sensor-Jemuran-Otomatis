import React from 'react';
import { Sun, Moon, Laptop, Bell, BellOff, BellRing, Wifi, WifiOff, CloudRain } from 'lucide-react';
import { Perangkat } from '../../types/iot';
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
  isSimulating: boolean;
  onToggleSimulator: () => void;
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
  isSimulating,
  onToggleSimulator,
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

        {/* Right: Simulator Toggle, Notifications, Theme */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Simulator pill */}
          <button
            onClick={onToggleSimulator}
            className={`min-h-11 min-w-11 px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
              isSimulating
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-400'
                : 'bg-kartu-muted border-garis text-teks-sekunder hover:text-teks-utama'
            }`}
            title="Mode Simulator ESP32 (Uji coba tanpa alat fisik)"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSimulating ? 'bg-cyan-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="hidden md:inline">Simulator</span>
          </button>

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
        </div>
      </div>
    </header>
  );
};
