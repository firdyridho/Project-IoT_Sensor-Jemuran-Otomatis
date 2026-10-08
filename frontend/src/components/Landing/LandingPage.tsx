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
} from 'lucide-react';
import { Button } from '../Common/Button';
import { Badge } from '../Common/Badge';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onQuickDemo: () => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onQuickDemo,
  theme,
  onToggleTheme,
}) => {
  const [demoWet, setDemoWet] = useState(false);

  return (
    <div className="min-h-screen bg-latar text-teks-utama flex flex-col selection:bg-cyan-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[600px] -right-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* 1. Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-kartu/80 backdrop-blur-md border-garis">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-base sm:text-lg tracking-tight text-teks-utama">
                  HujanPantau
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/20">
                  IoT 2.0
                </span>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-teks-sekunder hover:text-teks-utama hover:bg-kartu-muted border border-transparent hover:border-garis transition-all"
              aria-label="Ganti tema"
              title="Ganti Tema"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : theme === 'light' ? <Sun className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
            </button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenAuth('login')}
              className="text-xs"
            >
              Masuk
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenAuth('register')}
              className="text-xs shadow-md shadow-cyan-500/20"
            >
              Daftar Gratis
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-12 sm:pt-20 pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center space-y-6">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-kartu border border-garis text-xs text-teks-sekunder shadow-xs animate-in fade-in duration-300">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="font-semibold text-teks-utama">Cloud Backend 24/7 Aktif</span>
          <span className="text-garis">|</span>
          <span className="text-[11px] font-mono">Tencent VPS + MySQL</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight text-teks-utama max-w-4xl mx-auto leading-tight">
          Pantau Hujan Realtime.{' '}
          <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
            Amankan Jemuran Otomatis.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg text-teks-sekunder max-w-2xl mx-auto leading-relaxed">
          Platform IoT pintar untuk mendeteksi intensitas air hujan dalam hitungan milidetik, mengendalikan motor servo penarik jemuran 24/7, dan menyinkronkan data sensor ke database pribadi Anda.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => onOpenAuth('register')}
            className="w-full sm:w-auto gap-2 text-sm shadow-xl shadow-cyan-500/25 px-6"
          >
            <span>Mulai Sekarang (Gratis)</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={onQuickDemo}
            className="w-full sm:w-auto gap-2 text-sm px-6"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Coba Demo 1-Klik</span>
          </Button>
        </div>

        {/* Interactive Interactive Preview Card */}
        <div className="pt-8 sm:pt-12 max-w-3xl mx-auto">
          <div className="p-5 sm:p-7 rounded-3xl bg-kartu/90 border border-garis shadow-2xl backdrop-blur-xl relative space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-garis/60 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                  <Cpu className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-teks-utama">Simulasi Sensor Jemuran Utama</h3>
                  <p className="text-xs text-teks-sekunder font-mono">ESP32 FC-37 Unit (hs-8f3a1c9d2b70)</p>
                </div>
              </div>

              <Badge variant={demoWet ? 'hujan' : 'kering'} dot>
                {demoWet ? 'Terdeteksi Hujan' : 'Cuaca Kering'}
              </Badge>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-kartu-muted border border-garis/50 space-y-1">
                <span className="text-[11px] text-teks-sekunder font-medium">Status Servo</span>
                <p className="text-base font-bold text-teks-utama">
                  {demoWet ? '90° (Tertutup)' : '0° (Jemur)'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-kartu-muted border border-garis/50 space-y-1">
                <span className="text-[11px] text-teks-sekunder font-medium">Nilai ADC Sensor</span>
                <p className="text-base font-bold font-mono text-cyan-600 dark:text-cyan-400">
                  {demoWet ? '1420 ADC' : '3850 ADC'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-kartu-muted border border-garis/50 space-y-1">
                <span className="text-[11px] text-teks-sekunder font-medium">Kelembapan</span>
                <p className="text-base font-bold font-mono text-teks-utama">
                  {demoWet ? '88% Basah' : '12% Normal'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-kartu-muted border border-garis/50 space-y-1">
                <span className="text-[11px] text-teks-sekunder font-medium">Sinkronisasi Cloud</span>
                <p className="text-base font-bold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sub-4ms</span>
                </p>
              </div>
            </div>

            {/* Interactive Toggle for the user */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
              <div className="text-xs">
                <span className="font-semibold text-teks-utama block">Uji Respon Sensor:</span>
                <span className="text-teks-sekunder">Tekan untuk menyimulasikan percikan air hujan</span>
              </div>
              <Button
                variant={demoWet ? 'danger' : 'primary'}
                size="sm"
                onClick={() => setDemoWet(!demoWet)}
                className="text-xs"
              >
                {demoWet ? 'Keringkan Sensor' : 'Simulasi Air Hujan'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Features Section */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-10 border-t border-garis">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-teks-utama">
            Dirancang Andal untuk Menjaga Rumah Tangga
          </h2>
          <p className="text-xs sm:text-sm text-teks-sekunder max-w-lg mx-auto">
            Sistem IoT berdaya rendah dengan keamanan tingkat industri dan isolasi akun pengguna.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-kartu border border-garis space-y-3 shadow-sm hover:border-cyan-500/50 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-teks-utama font-heading">
              Respon Kilat Sub-Detik
            </h3>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Mikrokontroler ESP32 langsung menggerakkan motor servo seketika air terdeteksi, tanpa perlu menunggu internet demi mengamankan pakaian Anda.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-kartu border border-garis space-y-3 shadow-sm hover:border-blue-500/50 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-teks-utama font-heading">
              Dual Cloud MySQL & Redis
            </h3>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Semua log pembacaan sensor dan status tersimpan aman 24/7 di VPS Tencent Cloud Anda, tersinkronisasi otomatis ke HP dan laptop.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-kartu border border-garis space-y-3 shadow-sm hover:border-indigo-500/50 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-teks-utama font-heading">
              Isolasi Data Antar Pengguna
            </h3>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Setiap pengguna memiliki akun dan daftar perangkat masing-masing. Data perangkat Anda privat dan tidak akan bercampur dengan pengguna lain.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-kartu border border-garis space-y-3 shadow-sm hover:border-amber-500/50 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <CloudSun className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-teks-utama font-heading">
              Prakiraan Cuaca Resmi BMKG
            </h3>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Terintegrasi langsung dengan Open API BMKG Indonesia per kecamatan untuk memberikan proyeksi cuaca akurat di lokasi jemuran Anda.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-kartu border border-garis space-y-3 shadow-sm hover:border-rose-500/50 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-teks-utama font-heading">
              Alarm Audio & Notifikasi Web
            </h3>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Membunyikan alarm suara darurat dan notifikasi Web Push ke browser sehingga Anda langsung tahu saat hujan mulai turun.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-kartu border border-garis space-y-3 shadow-sm hover:border-emerald-500/50 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-teks-utama font-heading">
              PWA & Fitur "Ingat Saya"
            </h3>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Dapat diinstal di layar utama ponsel Anda seperti aplikasi native, dan fitur ingat saya menjaga sesi login tetap aktif tanpa perlu repot login berulang.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Bottom CTA Section */}
      <section className="py-14 px-4 sm:px-6 max-w-4xl mx-auto w-full">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 text-white shadow-2xl text-center space-y-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-2xs -z-10" />
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
            Mulai Amankan Jemuran Anda Hari Ini
          </h2>
          <p className="text-xs sm:text-sm text-cyan-100 max-w-md mx-auto leading-relaxed">
            Daftar akun sekarang, sambungkan sensor ESP32 Anda, dan nikmati pemantauan cuaca realtime tanpa rasa khawatir.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-cyan-900 font-bold text-xs shadow-lg hover:bg-cyan-50 transition-all flex items-center justify-center gap-2"
            >
              <span>Daftar Akun Baru</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all"
            >
              Sudah Punya Akun? Masuk
            </button>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-garis mt-auto py-8 px-4 text-center text-xs text-teks-sekunder">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 HujanPantau. Sistem IoT Sensor Hujan & Jemuran Otomatis.</p>
          <p className="font-mono text-[11px]">
            Powered by Golang • React 19 • MySQL 5.7 • Redis
          </p>
        </div>
      </footer>
    </div>
  );
};
