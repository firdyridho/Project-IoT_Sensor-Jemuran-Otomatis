import React from 'react';
import {
  CloudRain,
  CloudLightning,
  Volume2,
  VolumeX,
  Settings,
  Sun,
  Moon,
  Laptop,
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
  theme?: 'light' | 'dark' | 'system';
  onToggleTheme?: () => void;
  notifPermission?: NotificationPermission;
  onRequestNotif?: () => void;
  user?: User;
  onLogout?: () => void;
  onOpenMobileMenu?: () => void;
  isDashboard?: boolean;
  weatherCondition?: 'cerah' | 'mendung' | 'hujan' | 'badai' | 'gerimis';
  isAudioMuted?: boolean;
  onToggleAudio?: () => void;
  onOpenSettings?: () => void;
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
  isAudioMuted = true,
  onToggleAudio,
  onOpenSettings,
}) => {
  // Freezed (sticky) header colors matching theme and weather
  let headerBgClass = '';
  let buttonBgClass = '';
  let selectBgClass = '';
  let borderClass = '';

  // Hitung apakah mode gelap aktif berdasarkan pengaturan pengguna atau preferensi sistem perangkat
  const isDark =
    theme === 'dark' ||
    ((!theme || theme === 'system') &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDashboard) {
    if (isDark) {
      // Dark Mode pada Dashboard
      if (weatherCondition === 'badai') {
        headerBgClass = 'bg-[#0f071f]/90 backdrop-blur-xl text-white shadow-xl';
        borderClass = 'border-purple-900/60';
        buttonBgClass = 'bg-white/10 hover:bg-white/20 text-purple-200 border-purple-500/30';
        selectBgClass = 'bg-purple-950/70 text-white border-purple-800/40';
      } else if (weatherCondition === 'hujan' || weatherCondition === 'gerimis') {
        headerBgClass = 'bg-[#0b1329]/90 backdrop-blur-xl text-white shadow-xl';
        borderClass = 'border-slate-800/80';
        buttonBgClass = 'bg-white/10 hover:bg-white/20 text-cyan-200 border-white/15';
        selectBgClass = 'bg-slate-900 text-white border-slate-700';
      } else {
        // Cerah / Mendung di Dark Mode: Selalu gelap elegan
        headerBgClass = 'bg-slate-900/90 backdrop-blur-xl text-slate-100 shadow-md';
        borderClass = 'border-slate-800';
        buttonBgClass = 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 shadow-xs';
        selectBgClass = 'bg-slate-900 text-slate-100 border-slate-700 shadow-xs font-bold';
      }
    } else {
      // Light Mode pada Dashboard: Selalu cerah, terang, bersih, daylight dengan kontras teks tinggi
      headerBgClass = 'bg-white/95 backdrop-blur-xl text-slate-900 shadow-sm';
      borderClass = 'border-slate-200/90';
      buttonBgClass = 'bg-slate-100 hover:bg-slate-200/90 text-slate-800 border-slate-200 shadow-xs';
      selectBgClass = 'bg-white text-slate-900 border-slate-300 shadow-xs font-bold';
    }
  } else {
    if (isDark) {
      headerBgClass = 'bg-slate-900/90 backdrop-blur-xl text-slate-100 shadow-md';
      borderClass = 'border-slate-800';
      buttonBgClass = 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700';
      selectBgClass = 'bg-slate-800 text-white border-slate-700';
    } else {
      headerBgClass = 'bg-white/95 backdrop-blur-xl text-slate-900 shadow-sm';
      borderClass = 'border-slate-200';
      buttonBgClass = 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300';
      selectBgClass = 'bg-slate-50 text-slate-900 border-slate-300';
    }
  }

  return (
    <header className={`sticky top-0 z-50 w-full border-b transition-colors duration-300 ${headerBgClass} ${borderClass}`}>
      <div className="mx-auto max-w-6xl px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Mobile Hamburger Trigger & Brand */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Logo Favicon */}
          <div className="flex items-center gap-2 shrink-0">
            <img
              src="/favicon.svg?v=2"
              alt="Rintik Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl shadow-xs"
            />
          </div>

          {/* Device Selector */}
          <div className="relative min-w-0">
            {devices.length > 1 ? (
              <select
                value={activeDevice.deviceId}
                onChange={(e) => onSelectDevice(e.target.value)}
                className={`border rounded-xl text-xs font-semibold px-2.5 sm:px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-400 truncate max-w-[140px] sm:max-w-[200px] ${selectBgClass}`}
                aria-label="Pilih perangkat"
              >
                {devices.map((d) => (
                  <option
                    key={d.deviceId}
                    value={d.deviceId}
                    className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                  >
                    {d.nama}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <span className={`font-heading font-bold text-sm sm:text-base truncate max-w-[140px] sm:max-w-none ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  {activeDevice.nama}
                </span>
                <span className={`hidden sm:inline-block text-[11px] font-mono px-1.5 py-0.5 rounded border ${
                  isDark ? 'text-slate-300 bg-black/20 border-white/10' : 'text-slate-600 bg-slate-100 border-slate-200'
                }`}>
                  {activeDevice.deviceId}
                </span>
              </div>
            )}
          </div>

          {/* Status Badge (Desktop only, mobile moves to 2nd row bar) */}
          <div className="hidden sm:flex items-center">
            {brokerStatus !== 'connected' ? (
              <Badge variant="bahaya" dot className="bg-red-500/15 text-red-500 border-red-500/40 font-bold">
                <span className="hidden xs:inline">Broker </span>Terputus
              </Badge>
            ) : !isOnline ? (
              <Badge
                variant="offline"
                dot
                className="bg-red-500/15 text-red-500 border-red-500/40 font-bold animate-pulse shadow-xs"
              >
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

        {/* Right: Sound Effects, Notifications, Theme Switcher, User Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Weather Sound Effects Mode Button */}
          {onToggleAudio && (
            <button
              onClick={onToggleAudio}
              className={`min-h-11 min-w-11 px-2.5 sm:px-3 py-1.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                weatherCondition === 'badai'
                  ? !isAudioMuted
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-purple-400 shadow-md shadow-purple-500/30 animate-pulse'
                    : 'bg-purple-950/40 text-purple-300 border-purple-800/50 hover:bg-purple-900/40'
                  : weatherCondition === 'hujan' || weatherCondition === 'gerimis'
                  ? !isAudioMuted
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-md shadow-cyan-500/30 animate-pulse'
                    : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50 hover:bg-cyan-900/40'
                  : weatherCondition === 'mendung'
                  ? !isAudioMuted
                    ? 'bg-slate-700 text-cyan-300 border-slate-500 shadow-xs'
                    : buttonBgClass
                  : !isAudioMuted
                  ? 'bg-amber-500 text-white border-amber-400 shadow-xs'
                  : buttonBgClass
              }`}
              aria-label={isAudioMuted ? 'Nyalakan efek suara cuaca' : 'Matikan efek suara cuaca'}
              title={
                weatherCondition === 'badai'
                  ? isAudioMuted
                    ? 'Nyalakan Suara Badai & Gemuruh Petir'
                    : 'Suara Badai & Petir Aktif (Klik untuk Mematikan)'
                  : weatherCondition === 'hujan' || weatherCondition === 'gerimis'
                  ? isAudioMuted
                    ? 'Nyalakan Efek Suara Hujan Realtime'
                    : 'Suara Hujan Aktif (Klik untuk Mematikan)'
                  : isAudioMuted
                  ? 'Nyalakan Efek Suara Cuaca Realtime'
                  : 'Efek Suara Cuaca Siaga'
              }
            >
              {!isAudioMuted ? (
                <>
                  {weatherCondition === 'badai' ? (
                    <CloudLightning className="w-4 h-4 text-amber-300 animate-bounce" />
                  ) : weatherCondition === 'hujan' || weatherCondition === 'gerimis' ? (
                    <CloudRain className="w-4 h-4 text-cyan-200 animate-pulse" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="hidden sm:inline text-[11px]">
                    {weatherCondition === 'badai'
                      ? 'Audio Badai'
                      : weatherCondition === 'hujan' || weatherCondition === 'gerimis'
                      ? 'Audio Hujan'
                      : 'Audio Aktif'}
                  </span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 opacity-75" />
                  <span className="hidden sm:inline text-[11px] opacity-75">
                    {weatherCondition === 'badai'
                      ? 'Bisu Badai'
                      : weatherCondition === 'hujan' || weatherCondition === 'gerimis'
                      ? 'Bisu Hujan'
                      : 'Audio Bisu'}
                  </span>
                </>
              )}
            </button>
          )}
          {/* Theme Quick Switcher Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`min-h-10 min-w-10 sm:min-h-11 sm:min-w-11 px-2.5 sm:px-3 py-1.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${buttonBgClass} cursor-pointer group`}
              aria-label="Ganti tema tampilan"
              title={`Mode Tema: ${theme === 'dark' ? 'Gelap' : theme === 'light' ? 'Terang' : 'Sistem (Otomatis)'}`}
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              ) : theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              ) : (
                <Laptop className="w-4 h-4 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              )}
              <span className="hidden lg:inline text-[11px] capitalize">
                {theme === 'dark' ? 'Gelap' : theme === 'light' ? 'Terang' : 'Sistem'}
              </span>
            </button>
          )}

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className={`min-h-10 min-w-10 sm:min-h-11 sm:min-w-11 px-2.5 sm:px-3 py-1.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${buttonBgClass} cursor-pointer group`}
              aria-label="Buka Pengaturan Akun & Sistem"
              title="Buka Pengaturan (Akun, Tema, Notifikasi, Telegram & Alarm)"
            >
              <Settings className="w-4 h-4 text-cyan-500 group-hover:rotate-45 transition-transform" />
              <span className="hidden md:inline text-[11px]">Pengaturan</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile-Only Row 2: Broker Connection Chip & Quick Action/Device Status (REQ-FE-07) */}
      <div className={`flex sm:hidden items-center justify-between px-3.5 py-1.5 border-t text-xs ${
        isDark ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-700'
      }`}>
        {/* Status Koneksi Broker (chip mini: ikon titik berdenyut hijau/merah + "Online/Offline") */}
        <div className="flex items-center gap-1.5">
          {brokerStatus !== 'connected' ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-500 border border-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Broker Terputus</span>
            </span>
          ) : !isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-500 border border-red-500/30 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>Offline</span>
            </span>
          ) : isRaining ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Hujan Terdeteksi</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Perangkat Online</span>
            </span>
          )}
        </div>

        {/* Right Info: Device ID badge */}
        {activeDevice.deviceId && (
          <span className={`text-[10px] font-mono truncate max-w-[120px] px-1.5 py-0.5 rounded border ${
            isDark ? 'text-slate-300 bg-black/20 border-white/10' : 'text-slate-600 bg-slate-100 border-slate-200'
          }`}>
            {activeDevice.deviceId}
          </span>
        )}
      </div>
    </header>
  );
};
