import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress bar animation from 0 to 100% over 1800ms
    const start = Date.now();
    const duration = 1800;

    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(timer);
        // Start smooth exit transition
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            onComplete();
          }, 450);
        }, 200);
      }
    }, 25);

    return () => clearInterval(timer);
  }, [onComplete]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 250);
  };

  return (
    <div
      role="dialog"
      aria-label="Memuat Rintik"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070b14] text-white select-none transition-all duration-500 ease-out ${
        isExiting ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient Radial Glowing Orbs */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] sm:w-[560px] h-[420px] sm:h-[560px] rounded-full bg-gradient-to-tr from-violet-600/25 via-blue-600/20 to-cyan-400/15 blur-3xl pointer-events-none animate-pulse"
        style={{ animationDuration: '3s' }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0,transparent_70%)] pointer-events-none"
        aria-hidden="true"
      />

      {/* Skip Button (Top Right) */}
      <div className="absolute top-5 right-5 sm:top-8 sm:right-8 z-20">
        <button
          onClick={handleSkip}
          className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all backdrop-blur-md"
        >
          <span>Lewati</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Centerpiece: Logo Reveal Animation */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Glowing Logo Squircle */}
        <div className="relative mb-6">
          {/* Subtle Outer Glow Halo */}
          <div className="absolute -inset-3 rounded-[32px] bg-gradient-to-tr from-blue-500/30 via-indigo-500/30 to-purple-500/30 blur-xl opacity-75 animate-pulse" />

          {/* Master Squircle Icon with ATM Ranition-styled gradient */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] sm:rounded-[32px] p-0.5 bg-gradient-to-tr from-[#5B86E5] via-[#866BEA] to-[#B854E6] shadow-2xl shadow-indigo-900/60 flex items-center justify-center transform transition-transform hover:scale-105">
            <div className="w-full h-full rounded-[26px] sm:rounded-[30px] border border-white/30 flex items-center justify-center overflow-hidden relative">
              {/* Shimmer Light Sweep */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"
                aria-hidden="true"
              />

              {/* Rintik R Mark SVG */}
              <svg
                viewBox="0 0 512 512"
                className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="translate(80, 80) scale(1.38)">
                  <path
                    d="M 46 54
                       C 46 44, 54 38, 64 38
                       L 152 38
                       C 192 38, 218 64, 218 104
                       L 218 114
                       C 218 122, 212 128, 204 128
                       L 168 128
                       C 158 128, 150 136, 150 146
                       C 150 156, 158 164, 168 164
                       L 204 164
                       C 212 164, 218 170, 218 178
                       L 218 200
                       C 218 210, 210 218, 200 218
                       L 164 218
                       C 152 218, 140 186, 130 160
                       C 122 140, 114 130, 104 130
                       C 96 130, 92 136, 92 146
                       L 92 204
                       C 92 212, 84 218, 76 218
                       L 60 218
                       C 50 218, 46 210, 46 204
                       Z"
                    fill="#FFFFFF"
                  />
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* Brand Typographic Title */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-[0.2em] text-white uppercase drop-shadow-sm">
            R I N T I K
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400 tracking-wide">
            IoT Sensor Jemuran Otomatis
          </p>
        </div>

        {/* Dynamic Progress Loader Line */}
        <div className="mt-8 w-44 sm:w-56 space-y-2">
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden p-0.25">
            <div
              className="h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 rounded-full transition-all duration-75 ease-out shadow-sm shadow-indigo-400/50"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>Memulai sistem...</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>

      {/* Micro-footer note */}
      <div className="absolute bottom-6 text-[11px] text-slate-500 tracking-wider font-medium">
        Presisi Sensor Air & Proteksi Cuaca
      </div>
    </div>
  );
};
