import React, { useState } from 'react';
import {
  CloudRain,
  Shield,
  Zap,
  Server,
  CloudSun,
  BellRing,
  Lock,
  ArrowRight,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  Cpu,
  Sparkles,
  Smartphone,
  ChevronRight,
  Activity,
  Layers,
} from 'lucide-react';
import { Button } from '../Common/Button';
import { Badge } from '../Common/Badge';

interface LandingPageProps {
  onGoToAuth: (mode: 'login' | 'register') => void;
  onQuickDemo: () => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToAuth,
  onQuickDemo,
  theme,
  onToggleTheme,
}) => {
  const [demoWet, setDemoWet] = useState(false);

  return (
    <div className="min-h-screen bg-latar text-teks-utama flex flex-col selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[350px] sm:h-[500px] bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* 1. Responsive Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-kartu/85 backdrop-blur-md border-garis">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
              <CloudRain className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-heading font-black text-sm sm:text-base md:text-lg tracking-tight text-teks-utama truncate">
                HujanPantau
              </span>
              <span className="hidden xs:inline-block text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/20 shrink-0">
                IoT 2.0
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onToggleTheme}
              className="min-h-9 min-w-9 p-1.5 sm:p-2 rounded-xl text-teks-sekunder hover:text-teks-utama hover:bg-kartu-muted border border-transparent hover:border-garis transition-all flex items-center justify-center"
              aria-label="Ganti tema"
              title="Ganti Tema"
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-cyan-400" />
              ) : theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Laptop className="w-4 h-4" />
              )}
            </button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onGoToAuth('login')}
              className="text-xs px-2.5 sm:px-3.5 py-1.5 font-bold"
            >
              Masuk
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onGoToAuth('register')}
              className="text-xs px-2.5 sm:px-4 py-1.5 shadow-md shadow-cyan-500/20 font-bold"
            >
              <span className="hidden xs:inline">Daftar Akun</span>
              <span className="xs:hidden">Daftar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-8 sm:pt-16 pb-12 sm:pb-16 px-3.5 sm:px-6 max-w-6xl mx-auto text-center space-y-5 sm:space-y-6">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-kartu border border-garis text-[11px] sm:text-xs text-teks-sekunder shadow-xs max-w-full overflow-hidden">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shrink-0" />
          <span className="font-semibold text-teks-utama truncate">Cloud VPS 24/7 Realtime</span>
          <span className="text-garis hidden xs:inline">|</span>
          <span className="text-[10px] font-mono hidden xs:inline">WebSocket & MySQL</span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight text-teks-utama max-w-4xl mx-auto leading-[1.15] px-1">
          Pantau Hujan Realtime.{' '}
          <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
            Amankan Jemuran Otomatis.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs xs:text-sm sm:text-base lg:text-lg text-teks-sekunder max-w-2xl mx-auto leading-relaxed px-2">
          Platform IoT pintar untuk mendeteksi percikan air hujan sub-detik, mengendalikan motor servo penarik jemuran 24/7, dan mengisolasi data tiap pengguna secara aman.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 pt-2 max-w-md mx-auto sm:max-w-none px-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => onGoToAuth('register')}
            className="w-full sm:w-auto gap-2 text-xs sm:text-sm shadow-xl shadow-cyan-500/25 px-6 py-3 font-bold"
          >
            <span>Mulai Sekarang (Buat Akun)</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={onQuickDemo}
            className="w-full sm:w-auto gap-2 text-xs sm:text-sm px-6 py-3 font-semibold"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Coba Mode Demo 1-Klik</span>
          </Button>
        </div>

        {/* 3. Interactive Live Simulator Preview Card */}
        <div className="pt-6 sm:pt-10 max-w-3xl mx-auto w-full">
          <div className="p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-kartu border border-garis shadow-2xl backdrop-blur-xl relative space-y-4 sm:space-y-5 text-left">
            {/* Simulator Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-garis/60 pb-3 sm:pb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-500 shrink-0">
                  <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-teks-utama truncate">
                    Simulasi Sensor Jemuran Utama
                  </h3>
                  <p className="text-[10px] sm:text-xs text-teks-sekunder font-mono truncate">
                    ESP32 FC-37 Unit (hs-8f3a1c9d2b70)
                  </p>
                </div>
              </div>

              <Badge variant={demoWet ? 'hujan' : 'kering'} dot className="shrink-0 text-xs">
                {demoWet ? 'Terdeteksi Hujan' : 'Cuaca Kering'}
              </Badge>
            </div>

            {/* Metrics Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-kartu-muted border border-garis/50 space-y-0.5 sm:space-y-1">
                <span className="text-[10px] sm:text-[11px] text-teks-sekunder font-medium block truncate">
                  Status Servo
                </span>
                <p className="text-xs sm:text-base font-bold text-teks-utama truncate">
                  {demoWet ? '90° (Tertutup)' : '0° (Jemur)'}
                </p>
              </div>

              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-kartu-muted border border-garis/50 space-y-0.5 sm:space-y-1">
                <span className="text-[10px] sm:text-[11px] text-teks-sekunder font-medium block truncate">
                  ADC Sensor
                </span>
                <p className="text-xs sm:text-base font-bold font-mono text-cyan-600 dark:text-cyan-400 truncate">
                  {demoWet ? '1420 ADC' : '3850 ADC'}
                </p>
              </div>

              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-kartu-muted border border-garis/50 space-y-0.5 sm:space-y-1">
                <span className="text-[10px] sm:text-[11px] text-teks-sekunder font-medium block truncate">
                  Kelembapan
                </span>
                <p className="text-xs sm:text-base font-bold font-mono text-teks-utama truncate">
                  {demoWet ? '88% Basah' : '12% Kering'}
                </p>
              </div>

              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-kartu-muted border border-garis/50 space-y-0.5 sm:space-y-1">
                <span className="text-[10px] sm:text-[11px] text-teks-sekunder font-medium block truncate">
                  WebSocket Cloud
                </span>
                <p className="text-xs sm:text-base font-bold text-emerald-500 flex items-center gap-1 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Sub-4ms</span>
                </p>
              </div>
            </div>

            {/* Interactive Toggle for the user */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl sm:rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
              <div className="text-xs space-y-0.5">
                <span className="font-semibold text-teks-utama block">Uji Respon Sensor:</span>
                <span className="text-[11px] text-teks-sekunder block">
                  Tekan tombol di samping untuk menyimulasikan percikan air hujan secara langsung
                </span>
              </div>
              <Button
                variant={demoWet ? 'danger' : 'primary'}
                size="sm"
                onClick={() => setDemoWet(!demoWet)}
                className="w-full sm:w-auto text-xs shrink-0 py-2 sm:py-1.5 font-bold"
              >
                {demoWet ? '☀️ Keringkan Sensor' : '🌧️ Simulasikan Hujan'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Section */}
      <section className="py-12 sm:py-16 px-3.5 sm:px-6 max-w-6xl mx-auto space-y-8 sm:space-y-10 border-t border-garis">
        <div className="text-center space-y-2">
          <h2 className="text-xl xs:text-2xl sm:text-3xl font-black font-heading tracking-tight text-teks-utama">
            Dirancang Andal untuk Kebutuhan Rumah Tangga
          </h2>
          <p className="text-xs sm:text-sm text-teks-sekunder max-w-lg mx-auto">
            Sistem IoT berdaya rendah dengan keamanan tingkat industri dan isolasi akun pengguna.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-kartu border border-garis space-y-3 shadow-xs hover:border-cyan-500/40 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-teks-utama font-heading">
              Respon Kilat Sub-Detik
            </h3>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Mikrokontroler ESP32 langsung menggerakkan motor servo seketika air terdeteksi, tanpa perlu menunggu internet demi mengamankan pakaian Anda.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-kartu border border-garis space-y-3 shadow-xs hover:border-blue-500/40 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-teks-utama font-heading">
              Backend Cloud Golang VPS
            </h3>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Didukung server pribadi di Tencent Cloud Lighthouse dengan WebSocket hub untuk broadcast data realtime lintas perangkat tanpa delay.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-kartu border border-garis space-y-3 shadow-xs hover:border-indigo-500/40 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-teks-utama font-heading">
              Isolasi Multi-User Aman
            </h3>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Setiap pengguna memiliki akun pribadi dengan penyimpanan perangkat terpisah. Data sensor Anda dijamin tidak akan pernah tertukar dengan pengguna lain.
            </p>
          </div>
        </div>

        {/* Secondary Perks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-kartu-muted border border-garis/50 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
              <CloudSun className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-teks-utama">Prakiraan Cuaca BMKG</h4>
              <p className="text-[11px] text-teks-sekunder truncate">Prediksi cuaca resmi tingkat kecamatan.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-kartu-muted border border-garis/50 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-teks-utama">Notifikasi Browser & Audio</h4>
              <p className="text-[11px] text-teks-sekunder truncate">Pemberitahuan instan saat gerimis pertama.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-kartu-muted border border-garis/50 flex items-center gap-3 sm:col-span-2 lg:col-span-1">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-teks-utama">Dukungan PWA Mobile</h4>
              <p className="text-[11px] text-teks-sekunder truncate">Bisa diinstal sebagai aplikasi di layar HP.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Bottom Call to Action */}
      <section className="py-12 sm:py-16 px-3.5 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-cyan-600/15 via-blue-600/10 to-indigo-600/15 border border-cyan-500/30 space-y-4 sm:space-y-5">
          <h2 className="text-xl sm:text-3xl font-black font-heading text-teks-utama">
            Siap Mengamankan Jemuran Anda?
          </h2>
          <p className="text-xs sm:text-sm text-teks-sekunder max-w-md mx-auto">
            Daftarkan akun gratis sekarang atau langsung coba demo dashboard interaktif kami.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onGoToAuth('register')}
              className="w-full sm:w-auto text-xs sm:text-sm px-6 py-3 font-bold"
            >
              Buat Akun Gratis
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onGoToAuth('login')}
              className="w-full sm:w-auto text-xs sm:text-sm px-6 py-3 font-semibold"
            >
              Masuk dengan Username
            </Button>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="py-6 border-t border-garis text-center text-xs text-teks-sekunder px-4 space-y-2">
        <p>© 2026 HujanPantau • Sistem IoT Sensor Jemuran Otomatis</p>
        <p className="text-[11px] opacity-75">
          Didukung oleh Tencent Cloud Lighthouse & Data BMKG Indonesia
        </p>
      </footer>
    </div>
  );
};
