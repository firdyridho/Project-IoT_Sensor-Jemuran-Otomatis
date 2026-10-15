import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const isCompletedRef = useRef(false);

  // Check dark mode preference / class
  const isDark =
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      : true;

  useEffect(() => {
    if (isCompletedRef.current) return;

    const start = Date.now();
    const duration = 1600;

    const timer = setInterval(() => {
      if (isCompletedRef.current) {
        clearInterval(timer);
        return;
      }

      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));

      // Monotonically increasing progress: never go backwards!
      setProgress((prev) => Math.max(prev, pct));

      if (pct >= 100) {
        isCompletedRef.current = true;
        clearInterval(timer);
        setProgress(100);

        // Smooth exit transition: fade out + scale up
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            onCompleteRef.current();
          }, 600);
        }, 150);
      }
    }, 25);

    return () => clearInterval(timer);
  }, []);

  const handleSkip = () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    setProgress(100);
    setIsExiting(true);
    setTimeout(() => {
      onCompleteRef.current();
    }, 250);
  };

  return (
    <div
      role="dialog"
      aria-label="Memuat Rintik"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none transition-all duration-700 ease-out ${
        isDark ? 'bg-[#070b14] text-white' : 'bg-[#f8fafc] text-slate-900'
      } ${
        isExiting
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* Soft Ambient Glow Halo */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 rounded-full blur-3xl pointer-events-none transition-opacity duration-1000 ${
          isDark
            ? 'bg-gradient-to-tr from-cyan-500/15 via-indigo-600/15 to-blue-500/10'
            : 'bg-gradient-to-tr from-cyan-400/20 via-sky-300/25 to-indigo-300/20'
        }`}
        aria-hidden="true"
      />

      {/* Skip Button (Top Right) */}
      <div className="absolute top-5 right-5 sm:top-8 sm:right-8 z-20">
        <button
          type="button"
          onClick={handleSkip}
          className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            isDark
              ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10'
              : 'bg-slate-200/60 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300/60'
          }`}
          aria-label="Lewati splash screen"
        >
          <span>Lewati</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Center Logo & Typographic Brand */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className="relative mb-6">
          <div
            className={`absolute -inset-2.5 rounded-3xl blur-lg transition-opacity duration-700 ${
              isDark
                ? 'bg-gradient-to-tr from-cyan-500/30 via-indigo-500/30 to-blue-500/30 opacity-70'
                : 'bg-gradient-to-tr from-cyan-400/30 via-sky-400/30 to-blue-400/30 opacity-60'
            }`}
            aria-hidden="true"
          />

          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center p-2.5 transition-transform duration-1000 ease-in-out hover:scale-105 animate-[pulse_3s_ease-in-out_infinite]">
            <img
              src="/favicon.svg?v=2"
              alt="Rintik Logo"
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </div>
        </div>

        {/* Brand Typographic Title */}
        <div className="space-y-1.5">
          <h1
            className={`text-2xl sm:text-3xl font-black tracking-[0.2em] uppercase font-heading ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            R I N T I K
          </h1>
          <p
            className={`text-xs sm:text-sm font-medium tracking-wide ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            IoT Jemuran Otomatis & Presisi Cuaca
          </p>
        </div>

        {/* Minimalist 2px Loading Bar */}
        <div className="mt-8 w-48 sm:w-60 space-y-2">
          <div
            className={`h-[2px] w-full rounded-full overflow-hidden ${
              isDark ? 'bg-white/10' : 'bg-slate-200'
            }`}
          >
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-75 ease-out shadow-xs shadow-cyan-400/50"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div
            className={`flex justify-between items-center text-[10px] font-mono tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <span>Memulai sistem</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>

      <div
        className={`absolute bottom-6 text-[11px] tracking-wider font-medium opacity-80 ${
          isDark ? 'text-slate-500' : 'text-slate-500'
        }`}
      >
        Proteksi Presisi Sensor Realtime
      </div>
    </div>
  );
};
