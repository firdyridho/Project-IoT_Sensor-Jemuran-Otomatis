import React from 'react';
import { Sun, CloudRain, CloudDrizzle, CloudLightning, ShieldCheck, Umbrella } from 'lucide-react';

interface WeatherSphereOrbProps {
  condition: 'cerah' | 'gerimis' | 'hujan' | 'badai';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const WeatherSphereOrb: React.FC<WeatherSphereOrbProps> = ({
  condition,
  size = 'md',
  showLabel = true,
}) => {
  const sizeMap = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24 md:w-28 md:h-28',
    lg: 'w-32 h-32 md:w-36 md:h-36',
  };

  // Color gradient configurations inspired by 3D glossy spheres
  const config = {
    cerah: {
      outerRing: 'from-amber-400/30 to-blue-500/20',
      sphereBg: 'radial-gradient(circle at 35% 30%, #fff7ed 0%, #fbbf24 35%, #ea580c 70%, #1e293b 100%)',
      glowColor: 'rgba(251, 191, 36, 0.45)',
      icon: Sun,
      iconColor: 'text-amber-100',
      label: 'Cerah Terik',
      subtitle: 'Optimal Menjemur',
    },
    gerimis: {
      outerRing: 'from-sky-400/30 to-indigo-500/20',
      sphereBg: 'radial-gradient(circle at 35% 30%, #f0f9ff 0%, #38bdf8 40%, #0369a1 75%, #0f172a 100%)',
      glowColor: 'rgba(56, 189, 248, 0.4)',
      icon: CloudDrizzle,
      iconColor: 'text-sky-100',
      label: 'Gerimis Halus',
      subtitle: 'Siaga Jemuran',
    },
    hujan: {
      outerRing: 'from-cyan-400/30 to-blue-600/20',
      sphereBg: 'radial-gradient(circle at 35% 30%, #e0f2fe 0%, #0284c7 35%, #075985 70%, #020617 100%)',
      glowColor: 'rgba(14, 165, 233, 0.5)',
      icon: CloudRain,
      iconColor: 'text-cyan-100',
      label: 'Hujan Deras',
      subtitle: 'Jemuran Ditarik',
    },
    badai: {
      outerRing: 'from-indigo-400/40 to-purple-600/30',
      sphereBg: 'radial-gradient(circle at 35% 30%, #ede9fe 0%, #6366f1 30%, #312e81 65%, #09090b 100%)',
      glowColor: 'rgba(99, 102, 241, 0.55)',
      icon: CloudLightning,
      iconColor: 'text-indigo-100',
      label: 'Badai Petir',
      subtitle: 'Kondisi Ekstrem',
    },
  }[condition];

  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center text-center">
      {/* 3D Skeuomorphic Spherical Bezel & Orb */}
      <div className="relative flex items-center justify-center p-2 rounded-full bg-slate-900/40 backdrop-blur-md border border-white/15 shadow-2xl">
        {/* Ambient atmospheric backglow */}
        <div
          className="absolute inset-0 rounded-full blur-xl pointer-events-none transition-all duration-700"
          style={{
            backgroundColor: config.glowColor,
            transform: 'scale(1.2)',
          }}
        />

        {/* Outer Ring Bezel with Gradient */}
        <div className={`relative ${sizeMap[size]} rounded-full p-1 bg-gradient-to-br ${config.outerRing} shadow-inner`}>
          {/* Main 3D Sphere Surface */}
          <div
            className="w-full h-full rounded-full relative overflow-hidden transition-all duration-700 flex items-center justify-center shadow-[inset_0_-8px_16px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)]"
            style={{
              background: config.sphereBg,
            }}
          >
            {/* Top-Left Specular Reflection (Glass highlight) */}
            <div
              className="absolute top-1 left-2 w-3/5 h-2/5 rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.25) 50%, transparent 100%)',
                filter: 'blur(0.5px)',
                transform: 'rotate(-25deg)',
              }}
            />

            {/* Bottom-Right Subsurface Reflection (Reflected light) */}
            <div
              className="absolute bottom-1 right-2 w-1/2 h-1/3 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at bottom right, rgba(255, 255, 255, 0.35) 0%, transparent 70%)',
                filter: 'blur(1px)',
              }}
            />

            {/* Centered Weather Icon inside the 3D Sphere */}
            <div className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              <Icon className={`w-8 h-8 md:w-10 md:h-10 ${config.iconColor} transition-transform duration-500 hover:scale-110`} />
            </div>

            {/* Micro Rain/Sparkle particles inside orb for storm and rain */}
            {condition === 'badai' && (
              <div className="absolute inset-0 bg-white/20 animate-ping rounded-full pointer-events-none duration-1000" />
            )}
          </div>
        </div>
      </div>

      {showLabel && (
        <div className="mt-2.5">
          <div className="text-sm font-bold text-white tracking-wide drop-shadow-sm font-heading">
            {config.label}
          </div>
          <div className="text-[11px] font-medium text-sky-200/80">
            {config.subtitle}
          </div>
        </div>
      )}
    </div>
  );
};
