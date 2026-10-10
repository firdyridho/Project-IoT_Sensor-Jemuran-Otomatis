import React from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Cpu, Volume2, VolumeX, Sparkles } from 'lucide-react';

export type WeatherCondition = 'cerah' | 'mendung' | 'hujan' | 'badai' | 'gerimis';
export type SimulationMode = 'live' | WeatherCondition;

interface ConditionChipBarProps {
  currentMode: SimulationMode;
  onChangeMode: (mode: SimulationMode) => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  weatherCondition?: WeatherCondition;
}

export const ConditionChipBar: React.FC<ConditionChipBarProps> = ({
  currentMode,
  onChangeMode,
  isAudioMuted,
  onToggleAudio,
  weatherCondition = 'cerah',
}) => {
  const isCerah = weatherCondition === 'cerah';

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
      accentColor: isCerah
        ? 'from-amber-500 to-amber-600 text-white border-amber-400 shadow-xs'
        : 'from-amber-600 to-orange-700 text-white border-amber-300 shadow-md',
    },
    {
      id: 'mendung',
      label: 'Mendung',
      sub: 'Awan Tebal',
      icon: Cloud,
      accentColor: 'from-slate-700 to-slate-800 text-white border-slate-300 shadow-md',
    },
    {
      id: 'hujan',
      label: 'Hujan',
      sub: 'Tetes Air Lebat',
      icon: CloudRain,
      accentColor: 'from-cyan-600 to-blue-700 text-white border-cyan-300 shadow-md',
    },
    {
      id: 'badai',
      label: 'Badai',
      sub: 'Kilat & Petir',
      icon: CloudLightning,
      accentColor: 'from-purple-800 to-indigo-900 text-white border-purple-300 shadow-md',
    },
    {
      id: 'live',
      label: 'Live IoT',
      sub: 'Sensor ESP32',
      icon: Cpu,
      accentColor: 'from-emerald-700 to-teal-800 text-white border-emerald-300 shadow-md',
      badge: 'Auto',
    },
  ];

  const cardContainerClass = isCerah
    ? 'bg-white/95 border-slate-200/90 text-slate-900 shadow-md backdrop-blur-xl'
    : 'bg-slate-900/90 border-white/20 text-white shadow-xl backdrop-blur-xl';

  const audioBtnClass = isCerah
    ? !isAudioMuted
      ? 'bg-amber-500 text-white border-amber-400 shadow-xs animate-pulse'
      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
    : !isAudioMuted
    ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-cyan-500/30 animate-pulse'
    : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700 hover:text-white';

  const inactiveChipClass = isCerah
    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    : 'bg-slate-800/90 border-slate-600 text-slate-100 hover:bg-slate-700 hover:text-white';

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-3 sm:p-4 transition-all duration-500 ${cardContainerClass}`}>
      {/* Top Bar: Title & Audio Controller */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-lg border ${
              isCerah
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-blue-500/25 text-cyan-300 border-blue-400/30'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs sm:text-sm font-bold tracking-wide ${isCerah ? 'text-slate-900' : 'text-white'}`}>
                Demo Simulasi Cuaca
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-xs ${
                  isCerah
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-amber-400 text-slate-950 border-amber-300'
                }`}
              >
                Mode Uji
              </span>
            </div>
            <p className={`text-[11px] hidden sm:block font-medium ${isCerah ? 'text-slate-500' : 'text-slate-300'}`}>
              Pilih kondisi untuk simulasi visual tetesan air, halilintar, audio & pergerakan motor jemuran
            </p>
          </div>
        </div>

        {/* Audio Mute / Unmute Toggle Button */}
        <button
          onClick={onToggleAudio}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-300 min-h-11 shadow-sm ${audioBtnClass}`}
          title={isAudioMuted ? 'Nyalakan Audio Cuaca' : 'Matikan Audio Cuaca'}
          aria-label={isAudioMuted ? 'Nyalakan Efek Suara' : 'Matikan Efek Suara'}
        >
          {!isAudioMuted ? (
            <>
              <Volume2 className="w-4 h-4" />
              <span className="hidden xs:inline">Audio Aktif</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4" />
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
                  ? `bg-gradient-to-r ${chip.accentColor} ring-2 ring-white/50 font-bold scale-[1.02]`
                  : inactiveChipClass
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  isActive
                    ? 'bg-black/20 text-white'
                    : isCerah
                    ? 'bg-slate-200/80 text-slate-700'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold leading-none">{chip.label}</span>
                  {chip.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950">
                      {chip.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] leading-tight block mt-0.5 font-medium ${
                    isActive ? 'text-white/90' : isCerah ? 'text-slate-500' : 'text-slate-300'
                  }`}
                >
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
