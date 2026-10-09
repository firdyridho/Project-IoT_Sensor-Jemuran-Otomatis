import React from 'react';
import { Sun, Cloud, CloudDrizzle, CloudLightning, Cpu, Volume2, VolumeX, Sparkles } from 'lucide-react';

export type WeatherCondition = 'cerah' | 'mendung' | 'gerimis' | 'badai' | 'hujan';
export type SimulationMode = 'live' | WeatherCondition;

interface ConditionChipBarProps {
  currentMode: SimulationMode;
  onChangeMode: (mode: SimulationMode) => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
}

export const ConditionChipBar: React.FC<ConditionChipBarProps> = ({
  currentMode,
  onChangeMode,
  isAudioMuted,
  onToggleAudio,
}) => {
  const chips: {
    id: SimulationMode;
    label: string;
    sub: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badge?: string;
  }[] = [
    {
      id: 'cerah',
      label: 'Cerah',
      sub: 'Panas Terik',
      icon: Sun,
      accentColor: 'from-amber-500/30 to-orange-500/20 text-amber-300 border-amber-400/40',
    },
    {
      id: 'mendung',
      label: 'Mendung',
      sub: 'Awan Tebal',
      icon: Cloud,
      accentColor: 'from-slate-500/30 to-slate-600/20 text-slate-200 border-slate-400/40',
    },
    {
      id: 'gerimis',
      label: 'Gerimis',
      sub: 'Rintik Halus',
      icon: CloudDrizzle,
      accentColor: 'from-sky-500/30 to-blue-500/20 text-sky-300 border-sky-400/40',
    },
    {
      id: 'badai',
      label: 'Badai',
      sub: 'Kilat & Petir',
      icon: CloudLightning,
      accentColor: 'from-purple-500/30 to-indigo-600/20 text-purple-300 border-purple-400/40',
    },
    {
      id: 'live',
      label: 'Live IoT',
      sub: 'Sensor ESP32',
      icon: Cpu,
      accentColor: 'from-emerald-500/30 to-teal-600/20 text-emerald-300 border-emerald-400/40',
      badge: 'Auto',
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-blue-500/20 p-3 sm:p-4 shadow-xl shadow-blue-950/20">
      {/* Top Bar: Title & Audio Controller */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Demo Simulasi Cuaca
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Mode Uji
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Pilih chip kondisi untuk menguji visual tetesan air, halilintar, audio, & penarikan jemuran
            </p>
          </div>
        </div>

        {/* Audio Mute / Unmute Toggle Button */}
        <button
          onClick={onToggleAudio}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-300 min-h-11 ${
            !isAudioMuted
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20 animate-pulse'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title={isAudioMuted ? 'Nyalakan Audio Cuaca' : 'Matikan Audio Cuaca'}
          aria-label={isAudioMuted ? 'Nyalakan Efek Suara' : 'Matikan Efek Suara'}
        >
          {!isAudioMuted ? (
            <>
              <Volume2 className="w-4 h-4 text-cyan-300" />
              <span className="hidden xs:inline">Audio Aktif</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-slate-400" />
              <span className="hidden xs:inline">Audio Bisu</span>
            </>
          )}
        </button>
      </div>

      {/* Horizontal Scrollable Chip Bar (Mobile First) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none -mx-1 px-1">
        {chips.map((chip) => {
          const isActive = currentMode === chip.id;
          const Icon = chip.icon;

          return (
            <button
              key={chip.id}
              onClick={() => onChangeMode(chip.id)}
              className={`relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-left transition-all duration-300 shrink-0 min-h-11 border ${
                isActive
                  ? `bg-gradient-to-r ${chip.accentColor} shadow-lg ring-1 ring-white/30 font-bold scale-[1.02]`
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  isActive ? 'bg-white/15 text-white' : 'bg-slate-700/40 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold leading-none">{chip.label}</span>
                  {chip.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300">
                      {chip.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                  {chip.sub}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
