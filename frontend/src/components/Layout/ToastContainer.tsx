import React, { useEffect, useState } from 'react';
import { Notifications, InAppToast } from '../../services/notifications';
import {
  CloudRain,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';

interface ToastContainerProps {
  isDashboard?: boolean;
  weatherCondition?: 'cerah' | 'mendung' | 'hujan' | 'badai' | 'gerimis';
  theme?: 'light' | 'dark' | 'system';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  isDashboard = true,
  weatherCondition = 'cerah',
  theme = 'dark',
}) => {
  const [toasts, setToasts] = useState<InAppToast[]>([]);

  useEffect(() => {
    return Notifications.subscribeToasts((current) => {
      setToasts(current);
    });
  }, []);

  if (toasts.length === 0) return null;

  // Resolve solid colors (tidak transparan agar informasi terbaca jelas)
  const getCardStyle = () => {
    if (isDashboard) {
      if (weatherCondition === 'cerah') {
        return {
          cardBg: 'bg-white text-slate-950 border-2 border-amber-300 shadow-2xl shadow-amber-900/15',
          btnClass:
            'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-md shadow-amber-500/20',
          subtextClass: 'text-slate-700 font-medium',
          closeBtn: 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
        };
      } else if (weatherCondition === 'mendung') {
        return {
          cardBg: 'bg-[#1e293b] text-white border-2 border-slate-600 shadow-2xl shadow-black/60',
          btnClass:
            'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20',
          subtextClass: 'text-slate-300 font-medium',
          closeBtn: 'text-slate-400 hover:text-white hover:bg-white/10',
        };
      } else if (weatherCondition === 'badai') {
        return {
          cardBg: 'bg-[#0f071f] text-white border-2 border-purple-700 shadow-2xl shadow-black/70',
          btnClass:
            'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black shadow-md shadow-purple-600/30',
          subtextClass: 'text-purple-200 font-medium',
          closeBtn: 'text-purple-300 hover:text-white hover:bg-white/10',
        };
      } else {
        // Hujan / Gerimis
        return {
          cardBg: 'bg-[#0b1329] text-white border-2 border-cyan-700 shadow-2xl shadow-black/70',
          btnClass:
            'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-md shadow-cyan-500/20',
          subtextClass: 'text-cyan-100 font-medium',
          closeBtn: 'text-cyan-300 hover:text-white hover:bg-white/10',
        };
      }
    }

    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      return {
        cardBg: 'bg-slate-900 text-slate-100 border-2 border-slate-700 shadow-2xl shadow-black/70',
        btnClass:
          'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black shadow-md shadow-blue-600/30',
        subtextClass: 'text-slate-300 font-medium',
        closeBtn: 'text-slate-400 hover:text-white hover:bg-white/10',
      };
    } else {
      return {
        cardBg: 'bg-white text-slate-900 border-2 border-slate-200 shadow-2xl shadow-slate-900/10',
        btnClass:
          'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black shadow-md shadow-blue-600/20',
        subtextClass: 'text-slate-600 font-medium',
        closeBtn: 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
      };
    }
  };

  const style = getCardStyle();

  // Ambil toast paling mutakhir untuk modal desktop
  const activeDesktopToast = toasts[0];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW (>= 768px): Centered SweetAlert2 Modal Style             */}
      {/* ========================================================================= */}
      {activeDesktopToast && (
        <div
          role="dialog"
          aria-modal="true"
          className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => Notifications.dismissToast(activeDesktopToast.id)}
        >
          <div
            className={`relative w-full max-w-md p-6 sm:p-8 rounded-3xl ${style.cardBg} transition-all duration-300 transform animate-in zoom-in-95 duration-200 select-none`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* SweetAlert2 Circular Icon at Top Center */}
            <div className="flex justify-center mb-4">
              {activeDesktopToast.type === 'success' ? (
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-4 border-emerald-500 flex items-center justify-center animate-in zoom-in-75 duration-300 ring-8 ring-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-pulse" />
                </div>
              ) : activeDesktopToast.type === 'danger' ? (
                <div className="w-20 h-20 rounded-full bg-rose-500/10 border-4 border-rose-500 flex items-center justify-center animate-in zoom-in-75 duration-300 ring-8 ring-rose-500/20">
                  <XCircle className="w-10 h-10 text-rose-500 animate-pulse" />
                </div>
              ) : activeDesktopToast.type === 'warning' ? (
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border-4 border-amber-500 flex items-center justify-center animate-in zoom-in-75 duration-300 ring-8 ring-amber-500/20">
                  <AlertTriangle className="w-10 h-10 text-amber-500 animate-pulse" />
                </div>
              ) : activeDesktopToast.type === 'rain' ? (
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 border-4 border-cyan-500 flex items-center justify-center animate-in zoom-in-75 duration-300 ring-8 ring-cyan-500/20">
                  <CloudRain className="w-10 h-10 text-cyan-400 animate-pulse" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-500/10 border-4 border-blue-500 flex items-center justify-center animate-in zoom-in-75 duration-300 ring-8 ring-blue-500/20">
                  <Info className="w-10 h-10 text-blue-500" />
                </div>
              )}
            </div>

            {/* Title & Message */}
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-black font-heading tracking-tight leading-snug">
                {activeDesktopToast.title}
              </h3>
              <p className={`text-sm mt-2.5 leading-relaxed max-w-sm mx-auto ${style.subtextClass}`}>
                {activeDesktopToast.message}
              </p>
            </div>

            {/* Close Button at Top-Left */}
            <button
              onClick={() => Notifications.dismissToast(activeDesktopToast.id)}
              className={`absolute top-4 left-4 p-2 rounded-xl transition-all cursor-pointer ${style.closeBtn}`}
              aria-label="Tutup notifikasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW (< 768px): Top Notification Banner Style                 */}
      {/* ========================================================================= */}
      <aside
        aria-label="Notifikasi sistem mobile"
        className="md:hidden fixed top-3 inset-x-3 z-50 flex flex-col gap-2.5 pointer-events-none"
      >
        {toasts.map((toast) => {
          const isRain = toast.type === 'rain';
          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl ${style.cardBg} transition-all duration-300 animate-in slide-in-from-top-4`}
            >
              {/* Left Icon Badge */}
              <div className="shrink-0 mt-0.5">
                {isRain ? (
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <CloudRain className="w-5 h-5" />
                  </div>
                ) : toast.type === 'warning' ? (
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                ) : toast.type === 'success' ? (
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : toast.type === 'danger' ? (
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-500">
                    <XCircle className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <Info className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-sm font-black tracking-tight leading-snug">
                  {toast.title}
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${style.subtextClass}`}>
                  {toast.message}
                </p>
              </div>

              {/* Dismiss Button */}
              <button
                onClick={() => Notifications.dismissToast(toast.id)}
                className={`shrink-0 p-2 rounded-xl transition-all ${style.closeBtn}`}
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </aside>
    </>
  );
};
