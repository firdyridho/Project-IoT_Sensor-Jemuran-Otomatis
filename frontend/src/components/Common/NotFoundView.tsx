import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Compass, CloudRain, WifiOff, RefreshCw } from 'lucide-react';

interface NotFoundViewProps {
  theme?: 'light' | 'dark' | 'system';
  isLoggedIn?: boolean;
  onGoHome?: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  theme = 'dark',
  isLoggedIn = false,
  onGoHome,
}) => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      navigate(isLoggedIn ? '/dashboard' : '/');
    }
  };

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      handleHomeClick();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080d1a] text-slate-100 flex flex-col justify-between items-center relative overflow-hidden select-none px-4 py-8 sm:py-12">
      {/* Background Ambient Glows & Grid Pattern */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-gradient-to-tr from-indigo-600/20 via-blue-600/15 to-violet-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60"
        aria-hidden="true"
      />

      {/* Top Bar Brand Lockup */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between">
        <div
          onClick={handleHomeClick}
          className="flex items-center gap-2.5 cursor-pointer group transition-transform active:scale-95"
        >
          <img
            src="/favicon.svg?v=2"
            alt="Rintik Logo"
            className="w-9 h-9 rounded-xl shadow-lg shadow-indigo-900/40 group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="font-heading font-black text-base tracking-wide text-white group-hover:text-cyan-400 transition-colors">
              RINTIK
            </span>
            <span className="text-[10px] text-slate-400 font-medium">IoT Jemuran Otomatis</span>
          </div>
        </div>

        <button
          onClick={handleHomeClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all backdrop-blur-md"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isLoggedIn ? 'Buka Dashboard' : 'Beranda'}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-lg w-full text-center flex flex-col items-center my-auto py-8">
        {/* Animated 404 Hero Display */}
        <div className="relative mb-6">
          {/* Animated Halo behind the 404 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-2xl animate-pulse" />

          {/* 404 Numbers with Interactive Droplet Zero */}
          <div className="relative flex items-center justify-center gap-2 sm:gap-4">
            <span className="text-7xl sm:text-9xl font-black font-heading tracking-tighter bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-2xl">
              4
            </span>

            {/* Glowing Interactive Radar / Droplet Orb as the "0" */}
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center">
              {/* Radar Ripple Waves */}
              <div
                className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping"
                style={{ animationDuration: '2.4s' }}
              />
              <div
                className="absolute inset-2 rounded-full border border-violet-400/40 animate-pulse"
                style={{ animationDuration: '1.8s' }}
              />

              {/* Central Glowing Capsule */}
              <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-tr from-[#5B86E5] to-[#B854E6] p-0.5 shadow-xl shadow-indigo-900/50 flex items-center justify-center transform hover:rotate-6 transition-transform">
                <div className="w-full h-full rounded-[14px] bg-[#0c1222] flex flex-col items-center justify-center text-cyan-400 relative overflow-hidden">
                  <CloudRain className="w-7 h-7 sm:w-9 sm:h-9 animate-bounce text-cyan-300" style={{ animationDuration: '2s' }} />
                  {/* Subtle Droplet Ping */}
                  <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                </div>
              </div>
            </div>

            <span className="text-7xl sm:text-9xl font-black font-heading tracking-tighter bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-2xl">
              4
            </span>
          </div>
        </div>

        {/* Status Chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-4 backdrop-blur-md">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Sinyal Rute Tidak Terdeteksi</span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight leading-snug mb-3">
          Halaman di Luar Jangkauan
        </h2>

        {/* Descriptive Anti-Slop Text */}
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed mb-8">
          Halaman yang Anda tuju tidak tercatat pada sistem IoT Rintik. Tautan mungkin telah dipindahkan, terhapus, atau salah dalam pengetikan URL.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-xs sm:max-w-md">
          <button
            onClick={handleHomeClick}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 active:scale-98 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>{isLoggedIn ? 'Kembali ke Dashboard' : 'Kembali ke Beranda'}</span>
          </button>

          <button
            onClick={handleBackClick}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm active:scale-98 transition-all backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Halaman Sebelumnya</span>
          </button>
        </div>
      </main>

      {/* Clean Bottom Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-400 pt-6">
        <p>© 2026 Rintik • Presisi Deteksi Hujan & Proteksi Jemuran</p>
      </footer>
    </div>
  );
};
