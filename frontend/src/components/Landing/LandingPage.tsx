import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Zap,
  Server,
  CloudSun,
  BellRing,
  ArrowRight,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  Cpu,
  Sparkles,
  Smartphone,
  CloudRain,
  Droplets,
  Activity,
  Wifi,
  ChevronDown,
  Layers,
  Gauge,
  RotateCcw,
  Sliders,
  Check,
  Radio,
} from 'lucide-react';
import { Button } from '../Common/Button';
import { Badge } from '../Common/Badge';

interface LandingPageProps {
  onGoToAuth: (mode: 'login' | 'register') => void;
  onQuickDemo?: () => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
}

// Ease out expo for snappy high-tech counter movement
function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToAuth,
  onQuickDemo,
  theme,
  onToggleTheme,
}) => {
  // Interactive Simulation State
  const [previewWet, setPreviewWet] = useState(false);
  const [hasScrolledIntoMetrics, setHasScrolledIntoMetrics] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Interactive AI Sandbox Slider
  const [aiSandboxHum, setAiSandboxHum] = useState(55);

  // References for Scroll Intersection Observer
  const metricsSectionRef = useRef<HTMLDivElement>(null);

  // Animated Counter Values
  const [displayServo, setDisplayServo] = useState(0);
  const [displayAdc, setDisplayAdc] = useState(0);
  const [displayHum, setDisplayHum] = useState(0);
  const [displayLatency, setDisplayLatency] = useState(0);

  // Target values depending on wet/dry simulation
  const targetServo = previewWet ? 90 : 0;
  const targetAdc = previewWet ? 1420 : 3850;
  const targetHum = previewWet ? 88 : 12;
  const targetLatency = 3.8;

  // 1. Scroll-trigger Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasScrolledIntoMetrics(true);
          }
        });
      },
      { threshold: 0.25 }
    );

    if (metricsSectionRef.current) {
      observer.observe(metricsSectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 2. High-performance Count-up Animation Effect on scroll or simulation toggle
  useEffect(() => {
    if (!hasScrolledIntoMetrics) return;

    let startTimestamp: number | null = null;
    const duration = 1600; // ms

    const startServo = displayServo;
    const startAdc = displayAdc === 0 ? (previewWet ? 3850 : 0) : displayAdc;
    const startHum = displayHum === 0 ? (previewWet ? 12 : 0) : displayHum;
    const startLatency = displayLatency === 0 ? 0 : displayLatency;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      setDisplayServo(Math.round(startServo + (targetServo - startServo) * easedProgress));
      setDisplayAdc(Math.round(startAdc + (targetAdc - startAdc) * easedProgress));
      setDisplayHum(Math.round(startHum + (targetHum - startHum) * easedProgress));
      setDisplayLatency(
        parseFloat((startLatency + (targetLatency - startLatency) * easedProgress).toFixed(1))
      );

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [hasScrolledIntoMetrics, previewWet]);

  // AI Sandbox Computed Metrics
  const aiProb = Math.min(
    96,
    Math.max(8, Math.round(aiSandboxHum * 0.95 + (previewWet ? 25 : 0)))
  );
  const aiScore = Math.max(5, 100 - aiProb);
  const aiStatus =
    aiProb > 70
      ? { label: 'ANGKAT SEGERA', color: 'text-rose-500', desc: 'Awan mendung tebal mendekat' }
      : aiProb > 40
      ? { label: 'WASPADA JEMUR', color: 'text-amber-500', desc: 'Fluktuasi kelembapan terdeteksi' }
      : { label: 'AMAN JEMUR', color: 'text-emerald-500', desc: 'Kondisi mikroklimat cerah & stabil' };

  return (
    <div className="min-h-screen bg-latar text-teks-utama flex flex-col selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambient Glow Gradients */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[480px] sm:h-[620px] bg-gradient-to-b from-indigo-500/15 via-blue-500/8 to-transparent blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute top-[800px] right-[-10%] w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* 1. Clean Responsive Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-kartu/85 backdrop-blur-md border-garis">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 min-w-0 group">
            <img
              src="/favicon.svg?v=2"
              alt="Rintik Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-md shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-black text-base sm:text-lg tracking-tight text-teks-utama leading-tight truncate">
                Rintik
              </span>
              <span className="text-[10px] text-teks-sekunder font-medium hidden xs:block truncate">
                IoT Jemuran Otomatis & Presisi Cuaca
              </span>
            </div>
          </Link>

          {/* Right Navigation & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleTheme}
              className="min-h-9 min-w-9 p-2 rounded-xl text-teks-sekunder hover:text-teks-utama hover:bg-kartu-muted border border-transparent hover:border-garis transition-all flex items-center justify-center cursor-pointer"
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
              className="text-xs px-3 sm:px-4 py-1.5 font-bold"
            >
              Masuk
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onGoToAuth('register')}
              className="text-xs px-3 sm:px-4 py-1.5 shadow-md shadow-indigo-600/20 font-bold"
            >
              <span className="hidden xs:inline">Daftar Akun</span>
              <span className="xs:hidden">Daftar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-10 sm:pt-16 pb-10 sm:pb-14 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-5 sm:space-y-6">
        {/* Live Firmware & Network Beacon Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 shadow-xs animate-in fade-in slide-in-from-top-2 duration-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>ESP32 Firmware v2.4 • Ingesti Sensor Realtime Sub-Detik</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight text-teks-utama max-w-4xl mx-auto leading-[1.12]">
          Pantau Hujan Realtime.{' '}
          <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            Amankan Jemuran Otomatis.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs xs:text-sm sm:text-base lg:text-lg text-teks-sekunder max-w-2xl mx-auto leading-relaxed">
          Sistem IoT presisi tinggi yang menggerakkan motor servo kanopi seketika tetesan air pertama terdeteksi di plat sensor. Lindungi pakaian keluarga tanpa rasa cemas, kapan pun dan di mana pun.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2 max-w-md mx-auto sm:max-w-none">
          <Button
            variant="primary"
            size="lg"
            onClick={() => onGoToAuth('register')}
            className="w-full sm:w-auto gap-2 text-xs sm:text-sm shadow-xl shadow-indigo-600/25 px-6 py-3 font-bold"
          >
            <span>Mulai Sekarang (Buat Akun)</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          {onQuickDemo && (
            <Button
              variant="secondary"
              size="lg"
              onClick={onQuickDemo}
              className="w-full sm:w-auto gap-2 text-xs sm:text-sm px-6 py-3 font-semibold hover:border-amber-500/40"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Coba Mode Demo 1-Klik</span>
            </Button>
          )}

          <Button
            variant="secondary"
            size="lg"
            onClick={() => onGoToAuth('login')}
            className="w-full sm:w-auto gap-2 text-xs sm:text-sm px-6 py-3 font-semibold"
          >
            <span>Masuk ke Akun</span>
          </Button>
        </div>
      </section>

      {/* 3. Interactive Live Hardware Console & Telemetry Section */}
      <section
        ref={metricsSectionRef}
        className="py-6 sm:py-10 px-4 sm:px-6 max-w-4xl mx-auto w-full"
      >
        <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-kartu border border-garis shadow-2xl backdrop-blur-xl relative space-y-5 text-left transition-all">
          {/* Hardware Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-garis/60 pb-3 sm:pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 shrink-0">
                <Cpu className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-teks-utama flex items-center gap-2 truncate">
                  <span>Konsol Telemetri Hardware ESP32</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    LIVE
                  </span>
                </h3>
                <p className="text-[11px] sm:text-xs text-teks-sekunder font-mono truncate">
                  Mikrokontroler ESP32-WROOM • Motor Servo MG996R • Sensor FC-37
                </p>
              </div>
            </div>

            <Badge variant={previewWet ? 'hujan' : 'kering'} dot className="shrink-0 text-xs px-3 py-1 font-bold">
              {previewWet ? 'Status: Terdeteksi Hujan 🌧️' : 'Status: Cuaca Kering ☀️'}
            </Badge>
          </div>

          {/* Interactive Visual Stage: Clothesline & Canopy Simulation */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-kartu-muted to-kartu border border-garis relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Visual SVG Stage */}
              <div className="relative w-full sm:w-3/5 h-36 sm:h-44 rounded-xl bg-latar/80 border border-garis/80 flex items-center justify-center overflow-hidden p-3 shadow-inner">
                {/* Weather Sky Element */}
                {previewWet ? (
                  <div className="absolute top-2 left-4 flex items-center gap-1.5 text-xs font-semibold text-cyan-500 animate-pulse">
                    <CloudRain className="w-5 h-5 text-cyan-400" />
                    <span>Hujan Deras Terdeteksi!</span>
                  </div>
                ) : (
                  <div className="absolute top-2 left-4 flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                    <Sun className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '24s' }} />
                    <span>Terik Matahari • Aman Jemur</span>
                  </div>
                )}

                {/* Animated Rain Particles (When Wet) */}
                {previewWet && (
                  <div className="absolute inset-0 pointer-events-none flex justify-around opacity-60">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((drop) => (
                      <span
                        key={drop}
                        className="w-0.5 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full animate-bounce"
                        style={{
                          height: `${12 + (drop % 3) * 8}px`,
                          animationDuration: `${0.6 + (drop % 4) * 0.15}s`,
                          animationDelay: `${drop * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Motorized Canopy Graphic */}
                <div
                  className="absolute top-8 left-12 right-12 h-3.5 rounded-lg transition-all duration-700 ease-out shadow-lg flex items-center justify-between px-2"
                  style={{
                    backgroundColor: previewWet ? '#3b82f6' : '#94a3b8',
                    transform: previewWet
                      ? 'scaleX(1) translateY(0)'
                      : 'scaleX(0.35) translateY(-4px)',
                    transformOrigin: 'left center',
                  }}
                >
                  <span className="text-[9px] font-mono font-bold text-white uppercase tracking-wider truncate">
                    {previewWet ? 'Kanopi Menutup (90°)' : 'Kanopi Terbuka (0°)'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-white/80 animate-ping" />
                </div>

                {/* Clothesline & Hanging Garments */}
                <div className="relative z-10 w-4/5 pt-10 flex items-center justify-around border-t-2 border-dashed border-teks-sekunder/40">
                  {/* Garment 1: T-Shirt */}
                  <div
                    className={`flex flex-col items-center transition-all duration-500 ${
                      previewWet ? 'translate-y-1' : '-rotate-2'
                    }`}
                  >
                    <div className="w-2.5 h-1.5 border-t-2 border-teks-sekunder rounded-t-full" />
                    <div className="w-8 h-10 rounded-b-md bg-indigo-500/80 shadow-xs flex items-center justify-center text-[10px] text-white font-black">
                      👕
                    </div>
                  </div>

                  {/* Garment 2: Shorts / Towel */}
                  <div
                    className={`flex flex-col items-center transition-all duration-500 ${
                      previewWet ? 'translate-y-1' : 'rotate-2'
                    }`}
                  >
                    <div className="w-2.5 h-1.5 border-t-2 border-teks-sekunder rounded-t-full" />
                    <div className="w-7 h-9 rounded-b-md bg-cyan-500/80 shadow-xs flex items-center justify-center text-[10px] text-white font-black">
                      🩳
                    </div>
                  </div>

                  {/* Garment 3: Shirt */}
                  <div
                    className={`flex flex-col items-center transition-all duration-500 ${
                      previewWet ? 'translate-y-1' : '-rotate-1'
                    }`}
                  >
                    <div className="w-2.5 h-1.5 border-t-2 border-teks-sekunder rounded-t-full" />
                    <div className="w-8 h-11 rounded-b-md bg-amber-500/80 shadow-xs flex items-center justify-center text-[10px] text-white font-black">
                      👔
                    </div>
                  </div>
                </div>

                {/* Mechanical Servo Indicator Badge */}
                <div className="absolute bottom-2 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-kartu/90 border border-garis text-[10px] font-mono text-teks-sekunder shadow-xs">
                  <Activity className="w-3 h-3 text-indigo-500" />
                  <span>Sudut Servo: {displayServo}°</span>
                </div>
              </div>

              {/* Interactive Simulation Controls */}
              <div className="w-full sm:w-2/5 space-y-3">
                <div className="space-y-1">
                  <span className="font-bold text-xs sm:text-sm text-teks-utama block">
                    Uji Coba Respon Otomatis:
                  </span>
                  <p className="text-[11px] text-teks-sekunder leading-relaxed">
                    Klik tombol di bawah untuk menyimulasikan deteksi tetesan air dan perhatikan pergerakan angka telemetri di bawah.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant={previewWet ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => setPreviewWet(!previewWet)}
                    className="w-full text-xs py-2.5 font-bold shadow-md cursor-pointer gap-2"
                  >
                    {previewWet ? (
                      <>
                        <Sun className="w-4 h-4" />
                        <span>Keringkan Sensor (Simulasi Selesai)</span>
                      </>
                    ) : (
                      <>
                        <CloudRain className="w-4 h-4" />
                        <span>Simulasikan Tetesan Hujan</span>
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-[11px] text-teks-sekunder px-1">
                    <span>Waktu Respon Servo:</span>
                    <span className="font-mono font-bold text-emerald-500">&lt; 420ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Animated Telemetry Cards (Animasi Meningkat Pas di-Scroll) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Status Servo */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-kartu-muted border border-garis/60 hover:border-indigo-500/40 transition-all space-y-2 shadow-xs group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs text-teks-sekunder font-medium block truncate">
                  Status Servo
                </span>
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0 group-hover:scale-110 transition-transform">
                  <Activity className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-teks-utama">
                  {displayServo}°
                </p>
                <p className="text-[11px] sm:text-xs font-bold text-indigo-500 truncate mt-0.5">
                  {previewWet ? '(Tertutup)' : '(Jemur)'}
                </p>
              </div>
              <div className="w-full bg-garis/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, (displayServo / 90) * 100)}%` }}
                />
              </div>
            </div>

            {/* Card 2: ADC Sensor Air */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-kartu-muted border border-garis/60 hover:border-cyan-500/40 transition-all space-y-2 shadow-xs group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs text-teks-sekunder font-medium block truncate">
                  ADC Sensor Air
                </span>
                <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Cpu className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-cyan-600 dark:text-cyan-400">
                  {displayAdc}
                </p>
                <p className="text-[11px] sm:text-xs font-bold text-teks-sekunder truncate mt-0.5">
                  ADC {previewWet ? '(Basah)' : '(Kering)'}
                </p>
              </div>
              <div className="w-full bg-garis/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(8, (displayAdc / 4095) * 100))}%` }}
                />
              </div>
            </div>

            {/* Card 3: Kelembapan Air */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-kartu-muted border border-garis/60 hover:border-blue-500/40 transition-all space-y-2 shadow-xs group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs text-teks-sekunder font-medium block truncate">
                  Kelembapan Air
                </span>
                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0 group-hover:scale-110 transition-transform">
                  <Droplets className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-teks-utama">
                  {displayHum}%
                </p>
                <p className="text-[11px] sm:text-xs font-bold text-blue-500 truncate mt-0.5">
                  {previewWet ? 'Basah' : 'Kering'}
                </p>
              </div>
              <div className="w-full bg-garis/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, displayHum)}%` }}
                />
              </div>
            </div>

            {/* Card 4: WebSocket Latency */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-kartu-muted border border-garis/60 hover:border-emerald-500/40 transition-all space-y-2 shadow-xs group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs text-teks-sekunder font-medium block truncate">
                  WebSocket Latency
                </span>
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform">
                  <Wifi className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Sub-4ms</span>
                </p>
                <p className="text-[11px] sm:text-xs font-bold text-teks-sekunder truncate mt-0.5 font-mono">
                  {displayLatency}ms Latensi Nyata
                </p>
              </div>
              <div className="w-full bg-garis/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, (displayLatency / 10) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive AI Rain Prediction & Drying Score Sandbox Showcase */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="sukses" className="text-[10px] uppercase font-bold tracking-wider">
            Fitur Cerdas AI Engine
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-teks-utama">
            Prediksi Hujan & Rekomendasi Jemur Berbasis AI
          </h2>
          <p className="text-xs sm:text-sm text-teks-sekunder max-w-lg mx-auto">
            Bukan sekadar sensor reaktif — algoritma AI Rintik menganalisis laju perubahan mikroklimat sebelum tetesan air pertama turun ke tanah.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-kartu border border-garis shadow-lg grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Interactive AI Gauge Visualizer */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-kartu-muted border border-garis/70 text-center space-y-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-garis/60"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * aiScore) / 100}
                  strokeLinecap="round"
                  className={`${
                    aiScore > 65
                      ? 'text-emerald-500'
                      : aiScore > 35
                      ? 'text-amber-500'
                      : 'text-rose-500'
                  } transition-all duration-300`}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black font-mono tracking-tight text-teks-utama">
                  {aiScore}
                </span>
                <span className="text-[10px] text-teks-sekunder font-semibold uppercase">
                  Skor Jemur
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className={`text-sm sm:text-base font-black font-heading ${aiStatus.color}`}>
                {aiStatus.label}
              </span>
              <p className="text-xs text-teks-sekunder">{aiStatus.desc}</p>
            </div>
          </div>

          {/* Interactive Slider Controller */}
          <div className="space-y-5">
            <div className="space-y-1">
              <h4 className="text-sm sm:text-base font-bold text-teks-utama flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span>Simulasikan Kelembapan Udara (RH)</span>
              </h4>
              <p className="text-xs text-teks-sekunder">
                Geser slider untuk melihat bagaimana model AI Rintik menghitung risiko hujan dan memberikan saran jemur otomatis secara realtime:
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-kartu-muted border border-garis/60">
              <div className="flex justify-between text-xs font-bold font-mono">
                <span>Kelembapan Udara:</span>
                <span className="text-indigo-500">{aiSandboxHum}% RH</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                value={aiSandboxHum}
                onChange={(e) => setAiSandboxHum(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-garis rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-teks-sekunder font-medium pt-1">
                <span>20% (Kering Terik)</span>
                <span>60% (Normal)</span>
                <span>95% (Mendung Tebal)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-kartu-muted border border-garis/60">
                <span className="text-[10px] text-teks-sekunder block">Probabilitas Hujan</span>
                <span className="text-base font-bold font-mono text-teks-utama">{aiProb}%</span>
              </div>
              <div className="p-3 rounded-xl bg-kartu-muted border border-garis/60">
                <span className="text-[10px] text-teks-sekunder block">Estimasi Waktu Kering</span>
                <span className="text-base font-bold font-mono text-teks-utama">
                  {aiProb > 70 ? 'Tidak Disarankan' : `~${(1.2 + (100 - aiScore) * 0.03).toFixed(1)} Jam`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works (Alur Kerja Cerdas 3 Langkah) */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-8 border-t border-garis">
        <div className="text-center space-y-2">
          <Badge variant="kering" className="text-[10px] uppercase font-bold tracking-wider">
            Otomatisasi Tanpa Ribet
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-teks-utama">
            Bagaimana Rintik Mengamankan Jemuran Anda?
          </h2>
          <p className="text-xs sm:text-sm text-teks-sekunder max-w-lg mx-auto">
            Hanya 3 langkah presisi dari sensor analog hingga pakaian keluarga Anda terlindungi aman.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl sm:rounded-3xl bg-kartu border border-garis space-y-4 shadow-xs relative">
            <span className="text-3xl font-black font-mono text-indigo-500/20 absolute top-5 right-5">
              01
            </span>
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-teks-utama font-heading">
              1. Deteksi Tetesan Pertama
            </h3>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Plat sensor FC-37 berlapis nikel anti-oksidasi mendeteksi konduktivitas listrik seketika butiran air gerimis menyentuh permukaan.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl sm:rounded-3xl bg-kartu border border-garis space-y-4 shadow-xs relative">
            <span className="text-3xl font-black font-mono text-blue-500/20 absolute top-5 right-5">
              02
            </span>
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-teks-utama font-heading">
              2. Respon Motor Seketika
            </h3>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Mikrokontroler ESP32 langsung memutar motor servo 90° menutup kanopi dalam kurun waktu kurang dari 500ms — bahkan tanpa koneksi internet.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl sm:rounded-3xl bg-kartu border border-garis space-y-4 shadow-xs relative">
            <span className="text-3xl font-black font-mono text-emerald-500/20 absolute top-5 right-5">
              03
            </span>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-teks-utama font-heading">
              3. Notifikasi WebSocket & Telegram
            </h3>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Data telemetri disiarkan realtime via WebSocket ke dashboard dan bot Telegram Anda menerima pesan darurat instan.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Hardware Anatomy & Tech Specs Bento Grid */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-8 border-t border-garis">
        <div className="text-center space-y-2">
          <Badge variant="kering" className="text-[10px] uppercase font-bold tracking-wider">
            Spesifikasi Komponen
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-teks-utama">
            Hardware & Infrastruktur Berkualitas Industri
          </h2>
          <p className="text-xs sm:text-sm text-teks-sekunder max-w-lg mx-auto">
            Dirancang tangguh menghadapi panas terik dan hujan lebat tanpa henti.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-kartu border border-garis space-y-2 shadow-xs">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 inline-block">
              <Cpu className="w-5 h-5" />
            </span>
            <h4 className="font-bold text-sm text-teks-utama">ESP32 Dual-Core 240MHz</h4>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Pemrosesan firmware bare-metal yang super cepat, konsumsi daya rendah, dan modul WiFi internal berdaya jangkau tinggi.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-kartu border border-garis space-y-2 shadow-xs">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500 inline-block">
              <Server className="w-5 h-5" />
            </span>
            <h4 className="font-bold text-sm text-teks-utama">Backend Golang VPS</h4>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Arsitektur server Golang yang ringan (&lt;30MB RAM) dengan koneksi WebSocket persisten untuk komunikasi data tanpa polling.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-kartu border border-garis space-y-2 shadow-xs">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 inline-block">
              <CloudSun className="w-5 h-5" />
            </span>
            <h4 className="font-bold text-sm text-teks-utama">Integrasi Cuaca BMKG</h4>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Sinkronisasi data resmi cuaca BMKG Republik Indonesia hingga ke tingkat desa dan kelurahan secara periodik.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-kartu border border-garis space-y-2 shadow-xs">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 inline-block">
              <Shield className="w-5 h-5" />
            </span>
            <h4 className="font-bold text-sm text-teks-utama">Isolasi Multi-Tenant</h4>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Data sensor dan kontrol motor dienkripsi dan diisolasi ketat per ID pengguna. Tidak ada kebocoran antar akun.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-kartu border border-garis space-y-2 shadow-xs">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 inline-block">
              <BellRing className="w-5 h-5" />
            </span>
            <h4 className="font-bold text-sm text-teks-utama">Alarm Looping & Bot Telegram</h4>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Bunyi alarm synthesizer darurat yang berputar tanpa henti sampai dimatikan, plus pengiriman alert otomatis ke bot Telegram Anda.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-kartu border border-garis space-y-2 shadow-xs">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500 inline-block">
              <Smartphone className="w-5 h-5" />
            </span>
            <h4 className="font-bold text-sm text-teks-utama">Progressive Web App (PWA)</h4>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Bisa diinstal sebagai aplikasi layar utama HP Android maupun iPhone dengan performa native dan tampilan fullscreen.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Interactive Frequently Asked Questions (FAQ) */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-4xl mx-auto space-y-8 border-t border-garis">
        <div className="text-center space-y-2">
          <Badge variant="kering" className="text-[10px] uppercase font-bold tracking-wider">
            Tanya Jawab
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-teks-utama">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xs sm:text-sm text-teks-sekunder max-w-md mx-auto">
            Semua hal yang perlu Anda ketahui mengenai sistem IoT Rintik.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Apakah motor kanopi tetap bisa menutup jika koneksi internet terputus?',
              a: 'Ya, 100% bisa! Mikrokontroler ESP32 menjalankan logika lokal langsung pada hardware. Seketika sensor mendeteksi air, servo langsung bergerak menutup kanopi secara mekanik tanpa memerlukan koneksi internet.',
            },
            {
              q: 'Berapa daya listrik yang dibutuhkan alat ini?',
              a: 'Sangat hemat energi. Sistem berjalan menggunakan suplai adaptor 5V USB (seperti charger HP standar) dengan daya rata-rata di bawah 2 Watt, atau bahkan dapat ditenagai menggunakan powerbank cadangan.',
            },
            {
              q: 'Apakah ada biaya langganan bulanan untuk memantau jemuran?',
              a: 'Tidak ada biaya langganan. Platform Rintik dapat digunakan secara gratis untuk memantau telemetri perangkat dan menerima notifikasi bot Telegram.',
            },
            {
              q: 'Bagaimana cara menambahkan perangkat ESP32 ke akun saya?',
              a: 'Setelah mendaftar akun, buka menu "Kelola Perangkat" lalu klik "Tambah Perangkat". Masukkan ID unik ESP32 dan tentukan batas sensitivitas hujan sesuai keinginan Anda.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-kartu border border-garis overflow-hidden transition-all shadow-xs"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-teks-utama hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    activeFaq === idx ? 'rotate-180 text-indigo-500' : 'text-teks-sekunder'
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-teks-sekunder leading-relaxed border-t border-garis/50 pt-3 animate-in fade-in duration-200">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. Bottom Call to Action */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="p-7 sm:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-cyan-600/15 border border-indigo-500/25 space-y-4 sm:space-y-5">
          <h2 className="text-xl sm:text-3xl font-black font-heading text-teks-utama">
            Siap Mengamankan Jemuran Anda?
          </h2>
          <p className="text-xs sm:text-sm text-teks-sekunder max-w-md mx-auto">
            Daftarkan akun sekarang dan nikmati monitoring jemuran otomatis secara realtime bersama Rintik.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onGoToAuth('register')}
              className="w-full sm:w-auto text-xs sm:text-sm px-6 py-3 font-bold shadow-lg shadow-indigo-600/20"
            >
              Buat Akun Gratis
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onGoToAuth('login')}
              className="w-full sm:w-auto text-xs sm:text-sm px-6 py-3 font-semibold"
            >
              Masuk dengan Akun
            </Button>
          </div>
        </div>
      </section>

      {/* 9. Clean Footer with Direct Legal Links (No Popups!) */}
      <footer className="py-8 border-t border-garis text-center text-xs text-teks-sekunder px-4 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
          <Link
            to="/terms"
            className="hover:text-blue-500 transition-colors cursor-pointer"
          >
            Ketentuan Layanan
          </Link>
          <span className="opacity-40">•</span>
          <Link
            to="/privacy"
            className="hover:text-blue-500 transition-colors cursor-pointer"
          >
            Kebijakan Privasi
          </Link>
          <span className="opacity-40">•</span>
          <a
            href="https://github.com/firdyridho/Project-IoT_Sensor-Jemuran-Otomatis"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500 transition-colors"
          >
            GitHub Repository
          </a>
        </div>
        <p>© 2026 Rintik • Platform IoT Sensor Jemuran Otomatis Realtime</p>
        <p className="text-[11px] opacity-75">
          Didukung oleh Server Cloud Golang & Data Terpadu BMKG Indonesia
        </p>
      </footer>
    </div>
  );
};
