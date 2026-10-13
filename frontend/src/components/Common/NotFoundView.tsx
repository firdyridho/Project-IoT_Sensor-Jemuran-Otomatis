import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudOff, ArrowLeft, LayoutDashboard, Compass } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

interface NotFoundViewProps {
  theme?: 'light' | 'dark' | 'system';
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ theme = 'dark' }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full p-6 sm:p-8 text-center relative overflow-hidden bg-kartu/90 backdrop-blur-xl border-garis shadow-2xl rounded-3xl animate-in fade-in zoom-in-95 duration-200">
        {/* Subtle decorative glow */}
        <div
          className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-blue-600/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Animated 404 Icon Badge */}
          <div className="relative mb-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/15 to-transparent border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <CloudOff className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400 animate-pulse" aria-hidden="true" />
            </div>
            <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md">
              404
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-garis text-teks-sekunder mb-2">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            Halaman Tidak Ditemukan
          </span>

          <h1 className="text-2xl sm:text-3xl font-black font-heading text-teks-utama tracking-tight leading-tight mt-1 mb-2">
            Ups! Arah Hilang
          </h1>

          <p className="text-xs sm:text-sm text-teks-sekunder leading-relaxed max-w-sm mb-6">
            Tautan yang Anda tuju mungkin salah ketik, telah dipindahkan, atau alamat perangkat IoT tidak lagi tersedia di sistem.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 w-full">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/dashboard')}
              className="gap-2 min-h-11 shadow-lg shadow-cyan-500/20 font-bold"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Kembali ke Dashboard</span>
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/dashboard');
                }
              }}
              className="gap-2 min-h-11 font-medium bg-kartu/80 hover:bg-kartu"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Halaman Sebelumnya</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
