import React, { useEffect } from 'react';
import {
  BellOff,
  CloudRain,
  ShieldAlert,
  Sliders,
  ExternalLink,
  Volume2,
  Info,
  CloudLightning,
  CloudDrizzle,
} from 'lucide-react';
import { AudioAlarmService } from '../../utils/audioAlarm';

interface PersistentRainAlarmModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  deviceName?: string;
  rainPercentage?: number;
  rawAdc?: number;
  alarmToneLabel?: string;
  onOpenDashboard?: () => void;
}

export const PersistentRainAlarmModal: React.FC<PersistentRainAlarmModalProps> = ({
  isOpen,
  onDismiss,
  deviceName = 'Sensor Jemuran Rintik',
  rainPercentage = 100,
  rawAdc,
  alarmToneLabel = 'Emergency Siren',
  onOpenDashboard,
}) => {
  // Trigger vibration if supported on mobile devices
  useEffect(() => {
    if (isOpen && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 500]);
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    AudioAlarmService.dismissAlarm();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(100);
      } catch {}
    }
    onDismiss();
  };

  // Intensitas hujan transparan (REQ-FE-17)
  const rainLevel =
    rainPercentage > 80
      ? {
          title: 'Badai / Hujan Sangat Lebat',
          color: 'text-purple-400 bg-purple-500/20 border-purple-500/40',
          icon: CloudLightning,
          desc: 'Tetesan air sangat deras terdeteksi. Kanopi rel terkunci maksimal.',
        }
      : rainPercentage > 50
      ? {
          title: 'Hujan Sedang / Deras',
          color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40',
          icon: CloudRain,
          desc: 'Air hujan mengalir di lempeng sensor. Jemuran terlindungi di dalam.',
        }
      : {
          title: 'Gerimis (Drizzle)',
          color: 'text-blue-400 bg-blue-500/20 border-blue-500/40',
          icon: CloudDrizzle,
          desc: 'Butiran air awal terdeteksi. Kanopi menutup siaga.',
        };

  const LevelIcon = rainLevel.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alarm-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-300"
    >
      {/* Flashing ambient warning light */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="w-[300px] h-[300px] bg-cyan-500/20 rounded-full blur-[100px] animate-ping opacity-60" />
      </div>

      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-red-500/80 rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-red-950/80 overflow-hidden transform animate-in zoom-in-95 duration-200 space-y-4">
        {/* Top Warning Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-400 to-red-500 animate-shimmer" />

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/30 animate-bounce">
              <LevelIcon className="w-10 h-10 text-cyan-300" />
            </div>
            <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-6 w-6 bg-red-600 items-center justify-center text-[10px] font-black">
                !
              </span>
            </span>
          </div>

          <div className="space-y-1.5">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${rainLevel.color}`}>
              <LevelIcon className="w-3.5 h-3.5" />
              <span>{rainLevel.title}</span>
            </div>
            <h2
              id="alarm-modal-title"
              className="text-2xl sm:text-3xl font-black tracking-tight text-white"
            >
              Hujan Terdeteksi!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-sm">
              Sensor pada <span className="text-cyan-400 font-semibold">{deviceName}</span>{' '}
              mendeteksi tetesan air hujan. Kanopi jemuran otomatis ditarik ke dalam.
            </p>
          </div>

          {/* Telemetry info chips */}
          <div className="grid grid-cols-2 gap-3 w-full py-1">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-left">
              <span className="text-[11px] text-slate-400 font-medium block">
                Kelembapan Sensor
              </span>
              <span className="text-lg font-black font-mono text-cyan-300">
                {rainPercentage}%{' '}
                <span className="text-xs text-red-400 font-normal">Basah</span>
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-left">
              <span className="text-[11px] text-slate-400 font-medium block">
                Nada Dering
              </span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-amber-300 truncate">
                <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">{alarmToneLabel}</span>
              </div>
            </div>
          </div>

          {/* Informational UX clarification note (REQ-FE-17) */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-left flex items-start gap-2.5 text-slate-300 text-xs">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed">
              <strong>Pemberitahuan:</strong> Menekan tombol di bawah hanya mengheningkan suara sirine. Kanopi jemuran tetap aman di dalam hingga sensor kembali kering.
            </span>
          </div>

          {/* Giant Primary Action: Dismiss Alarm */}
          <div className="w-full pt-1 space-y-3">
            <button
              onClick={handleDismiss}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-base sm:text-lg tracking-wide shadow-xl shadow-red-600/40 border border-red-400/50 flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
            >
              <BellOff className="w-6 h-6 animate-pulse" />
              <span>MATIKAN ALARM</span>
            </button>

            <div className="flex items-center justify-between gap-3 text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                Alarm berdering terus sampai dimatikan
              </span>
              {onOpenDashboard && (
                <button
                  onClick={() => {
                    handleDismiss();
                    onOpenDashboard();
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                >
                  <span>Lihat Status Motor</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
