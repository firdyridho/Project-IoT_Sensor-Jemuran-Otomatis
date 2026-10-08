import React, { useEffect, useState } from 'react';
import { Notifications, InAppToast } from '../../services/notifications';
import { CloudRain, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<InAppToast[]>([]);

  useEffect(() => {
    return Notifications.subscribeToasts((current) => {
      setToasts(current);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifikasi sistem"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => {
        const isRain = toast.type === 'rain';
        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
              isRain
                ? 'bg-cyan-950/90 border-cyan-400/50 text-cyan-50 shadow-cyan-900/40'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-400/50 text-amber-50 shadow-amber-900/40'
                : toast.type === 'danger'
                ? 'bg-red-950/90 border-red-400/50 text-red-50 shadow-red-900/40'
                : 'bg-kartu/95 border-garis text-teks-utama shadow-black/20'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isRain ? (
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 animate-pulse">
                  <CloudRain className="w-5 h-5" />
                </div>
              ) : toast.type === 'warning' ? (
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              ) : toast.type === 'success' ? (
                <div className="p-2 rounded-xl bg-green-500/20 text-green-300">
                  <CheckCircle className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                  <Info className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-sm font-semibold tracking-tight">{toast.title}</h4>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>

            <button
              onClick={() => Notifications.dismissToast(toast.id)}
              className="shrink-0 min-h-11 min-w-11 -mr-2 -mt-2 p-2 flex items-center justify-center opacity-60 hover:opacity-100 rounded-lg focus:outline-none transition-opacity"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
