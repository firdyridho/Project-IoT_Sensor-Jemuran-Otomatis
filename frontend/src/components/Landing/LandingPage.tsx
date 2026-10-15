import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
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
  Sliders,
  Umbrella,
  Home,
  Cable,
} from 'lucide-react';
import { Button } from '../Common/Button';

interface LandingPageProps {
  onGoToAuth: (mode: 'login' | 'register') => void;
  onQuickDemo?: () => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
}

// Ease-out expo curve for snappy telemetry counter movement
function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

// Hero headline typing effect hook
const HERO_TYPE_TARGET = 'Amankan Jemuran Otomatis.';

function useHeroHeadlineTypewriter(text = HERO_TYPE_TARGET, typingSpeed = 80, deletingSpeed = 40, pause = 3200) {
  const [subIdx, setSubIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isDeleting && subIdx === text.length) {
      const timeout = setTimeout(() => setIsDeleting(true), pause);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && subIdx === 0) {
      setIsDeleting(false);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIdx((prev) => prev + (isDeleting ? -1 : 1));
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [subIdx, isDeleting, text, typingSpeed, deletingSpeed, pause]);

  return text.substring(0, subIdx);
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToAuth,
  onQuickDemo,
  theme,
  onToggleTheme,
}) => {
  // Simulation State: false = kering (area luar), true = hujan (tali menarik ke atap tertutup)
  const [previewWet, setPreviewWet] = useState(false);
  const [hasScrolledIntoMetrics, setHasScrolledIntoMetrics] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Interactive AI Sandbox Slider (Kelembapan Udara)
  const [aiSandboxHum, setAiSandboxHum] = useState(55);

  // Ref for scroll intersection observer
  const metricsSectionRef = useRef<HTMLDivElement>(null);

  // Animated Telemetry Counters
  const [displayServo, setDisplayServo] = useState(0);
  const [displayAdc, setDisplayAdc] = useState(0);
  const [displayHum, setDisplayHum] = useState(0);
  const [displayLatency, setDisplayLatency] = useState(0);

  // Target values based on wet / dry state
  const targetServo = previewWet ? 90 : 0;
  const targetAdc = previewWet ? 1420 : 3850;
  const targetHum = previewWet ? 88 : 12;
  const targetLatency = 3.8;

  // Hero headline typing hook
  const typedHeroText = useHeroHeadlineTypewriter();

  // 1. Lenis Smooth Scrolling for Landing Page
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // 2. Intersection Observer for Telemetry Counters
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

  // 3. Count-up Animation on Scroll or Simulation Toggle
  useEffect(() => {
    if (!hasScrolledIntoMetrics) return;

    let startTimestamp: number | null = null;
    const duration = 1600;

    const startServo = displayServo;
    const startAdc = displayAdc === 0 ? (previewWet ? 3850 : 0) : displayAdc;
    const startHum = displayHum === 0 ? (previewWet ? 12 : 0) : displayHum;
    const startLatency = displayLatency === 0 ? 0 : displayLatency;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);

      setDisplayServo(Math.round(startServo + (targetServo - startServo) * eased));
      setDisplayAdc(Math.round(startAdc + (targetAdc - startAdc) * eased));
      setDisplayHum(Math.round(startHum + (targetHum - startHum) * eased));
      setDisplayLatency(
        parseFloat((startLatency + (targetLatency - startLatency) * eased).toFixed(1))
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
      ? { label: 'Tarik Jemuran ke Atap', color: 'text-rose-500', desc: 'Indikasi hujan lebat mendekat' }
      : aiProb > 40
      ? { label: 'Waspada Jemuran', color: 'text-amber-500', desc: 'Peningkatan kelembapan udara terdeteksi' }
      : { label: 'Aman Dijemur di Luar', color: 'text-emerald-500', desc: 'Sinar matahari optimal & stabil' };

  return (
    <div className="min-h-screen bg-latar text-teks-utama flex flex-col selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
      {/* Moving Ethereal Blue-Purple Gradient Ambient Backdrop (Halus, Tipis & Bergerak Perlahan) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1300px] h-[580px] sm:h-[720px] bg-gradient-to-r from-blue-600/10 via-indigo-600/8 to-purple-600/10 blur-3xl pointer-events-none -z-10 animate-subtle-gradient"
        aria-hidden="true"
      />
      <div
        className="absolute top-[750px] left-[-6%] w-[520px] h-[520px] bg-gradient-to-tr from-purple-600/6 via-indigo-500/5 to-blue-500/6 rounded-full blur-3xl pointer-events-none -z-10 animate-float-slow"
        aria-hidden="true"
      />
      <div
        className="absolute top-[1450px] right-[-6%] w-[480px] h-[480px] bg-gradient-to-bl from-blue-600/6 via-violet-500/5 to-cyan-500/5 rounded-full blur-3xl pointer-events-none -z-10 animate-subtle-gradient"
        aria-hidden="true"
      />

      {/* 1. Clean Responsive Navbar (Shadcn Minimalist Style with Dark Mode Fix) */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-slate-200/80 dark:border-slate-800/80 text-slate-900 dark:text-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 min-w-0 group">
            <img
              src="/favicon.svg?v=2"
              alt="Rintik Logo"
              className="w-8 h-8 rounded-xl shadow-xs shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-black text-base sm:text-lg tracking-tight text-teks-utama leading-tight truncate">
                Rintik
              </span>
              <span className="text-[10px] text-teks-sekunder font-medium hidden xs:block truncate">
                IoT Rel Tali Jemuran Otomatis
              </span>
            </div>
          </Link>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleTheme}
              className="min-h-9 min-w-9 p-2 rounded-xl text-teks-sekunder hover:text-teks-utama hover:bg-kartu-muted border border-transparent hover:border-garis transition-all flex items-center justify-center cursor-pointer"
              aria-label="Ganti tema"
              title={`Mode Tema: ${theme === 'dark' ? 'Gelap' : theme === 'light' ? 'Terang' : 'Sistem (Otomatis)'}`}
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-cyan-400" />
              ) : theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Laptop className="w-4 h-4 text-blue-500 dark:text-blue-400" />
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

      {/* 2. Hero Section with Typing Animation & Handcrafted Underline Highlight */}
      <section className="pt-12 sm:pt-20 pb-12 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
        {/* Main Headline: Baris 1 "Pantau Hujan Realtime." dan Baris 2 "Amankan Jemuran Otomatis." */}
        <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight text-teks-utama max-w-4xl mx-auto leading-[1.2] sm:leading-[1.15]">
          <span className="block">Pantau Hujan Realtime.</span>
          <span className="block mt-1 sm:mt-2 min-h-[1.22em]">
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                {typedHeroText || '\u00A0'}
              </span>
              <span className="inline-block w-[3px] h-[0.8em] bg-cyan-400 ml-1.5 align-middle animate-pulse rounded-full" />
              {/* Harmonized Underline Highlight with Gentle Blue Glow */}
              <svg
                className={`absolute left-0 -bottom-1.5 w-full h-3.5 text-blue-500/40 dark:text-cyan-400/40 pointer-events-none transition-opacity duration-300 ${
                  typedHeroText.includes('Jemuran') ? 'opacity-100' : 'opacity-0'
                }`}
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 14 Q 50 2, 100 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </span>
        </h1>

        {/* Subtitle Explaining the Rope/Pulley Hardware */}
        <p className="text-xs xs:text-sm sm:text-base lg:text-lg text-teks-sekunder max-w-2xl mx-auto leading-relaxed">
          Sistem IoT presisi tinggi yang menggerakkan motor servo penarik tali jemuran ke atap tertutup seketika tetesan air pertama terdeteksi di plat sensor. Lindungi pakaian keluarga tanpa rasa cemas, kapan pun dan di mana pun.
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

      {/* 3. Interactive Hardware Stage: Tali Katrol Rel Jemuran ke Atap Tertutup */}
      <section
        ref={metricsSectionRef}
        className="py-6 sm:py-10 px-4 sm:px-6 max-w-4xl mx-auto w-full"
      >
        <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-kartu border border-garis shadow-2xl backdrop-blur-xl relative space-y-5 text-left transition-all">
          {/* Hardware Header Bar (No Badges) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-garis/60 pb-3 sm:pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                <Cpu className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-teks-utama truncate">
                  Konsol Telemetri Hardware ESP32
                </h3>
                <p className="text-[11px] sm:text-xs text-teks-sekunder font-mono truncate">
                  Sistem Rel Tali Katrol ESP32-WROOM • Motor Penggerak • Sensor FC-37
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold font-mono text-teks-utama block">
                {previewWet ? 'Kondisi: Terdeteksi Hujan' : 'Kondisi: Cuaca Kering'}
              </span>
              <span className="text-[10px] text-teks-sekunder font-mono">
                {previewWet ? 'Tali Bergeser ke Atap' : 'Jemuran di Area Luar'}
              </span>
            </div>
          </div>

          {/* Physical Stage: Rope Pulley & Sheltered Roof Simulator (High Contrast & Clear Typography) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-kartu-muted to-kartu border border-garis relative overflow-hidden shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch justify-between gap-5">
              {/* Visual Rope & Clothesline Simulator */}
              <div className="relative w-full sm:w-3/5 min-h-[250px] sm:min-h-[270px] rounded-2xl bg-latar border border-garis flex flex-col justify-between overflow-hidden p-3.5 sm:p-4 shadow-inner select-none">
                {/* Layer 1: Background & Environment (Atap vs Luar) */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {/* Left Zone: Sheltered Terrace & Canopy (48%) */}
                  <div className="w-[48%] h-full bg-slate-200/60 dark:bg-slate-800/70 border-r border-slate-300/80 dark:border-slate-700/80 relative flex flex-col justify-between overflow-hidden">
                    {/* Architectural Awning / Roof Overhang */}
                    <div className="w-full">
                      <div className="h-3.5 bg-slate-300 dark:bg-slate-700 border-b border-slate-400/40 dark:border-slate-600/60 flex items-center px-2 shadow-xs">
                        <div className="w-full h-1 bg-slate-400/50 dark:bg-slate-600/50 rounded-full" />
                      </div>
                    </div>

                    {/* Wall Texture / Servo Motor Wall Mount on Far Left */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-14 bg-slate-400 dark:bg-slate-700 rounded-r-md border-y border-r border-slate-500/40 dark:border-slate-600/60 flex flex-col items-center justify-around py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" title="Motor Aktuator" />
                      <span className="w-1.5 h-1 bg-slate-600 dark:bg-slate-400 rounded-full" />
                    </div>

                    {/* Subtle floor surface */}
                    <div className="w-full h-3 bg-slate-300/70 dark:bg-slate-700/50 border-t border-slate-300 dark:border-slate-700" />
                  </div>

                  {/* Right Zone: Outdoor Open Air & Sunshine / Rain (52%) */}
                  <div
                    className={`w-[52%] h-full relative flex flex-col justify-between overflow-hidden transition-colors duration-700 ${
                      previewWet
                        ? 'bg-gradient-to-b from-slate-300/40 via-cyan-900/10 to-blue-900/15 dark:from-slate-800/60 dark:via-cyan-950/30 dark:to-blue-950/40'
                        : 'bg-gradient-to-b from-amber-100/40 via-amber-50/20 to-transparent dark:from-amber-950/20 dark:via-amber-900/10 dark:to-transparent'
                    }`}
                  >
                    {/* Sky Ambient / Sun Glow in Dry Mode */}
                    {!previewWet && (
                      <div className="absolute top-2 right-3 w-20 h-20 rounded-full bg-amber-400/15 blur-xl pointer-events-none" />
                    )}

                    {/* Animated Rain Falling Outdoors Exclusively when Wet */}
                    {previewWet && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[15, 35, 55, 75, 90].map((leftPercent, idx) => (
                          <span
                            key={idx}
                            className="absolute top-0 w-0.5 bg-gradient-to-b from-cyan-400/80 to-blue-500/80 rounded-full animate-bounce"
                            style={{
                              left: `${leftPercent}%`,
                              height: `${14 + (idx % 3) * 8}px`,
                              animationDuration: `${0.45 + (idx % 3) * 0.12}s`,
                              animationDelay: `${idx * 0.08}s`,
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Right Pole / Wall Anchor with idler pulley bracket */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-12 bg-slate-300 dark:bg-slate-700 rounded-l-md border-y border-l border-slate-400/40 dark:border-slate-600/50" />

                    {/* Ground surface */}
                    <div className="w-full h-3 bg-slate-200/80 dark:bg-slate-800/80 border-t border-slate-300 dark:border-slate-700" />
                  </div>
                </div>

                {/* Layer 2: Top Zone Headers (Spacious, Clear, Non-Overlapping) */}
                <div className="relative z-10 flex items-start justify-between gap-2">
                  {/* Left Zone Header: Sheltered Area */}
                  <div className="flex items-center gap-2 max-w-[48%]">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Umbrella className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-teks-utama block leading-tight truncate">
                        Area Atap Tertutup
                      </span>
                      <span className="text-[10px] text-teks-sekunder font-medium block leading-tight truncate">
                        Teduh & Bebas Basah
                      </span>
                    </div>
                  </div>

                  {/* Right Zone Header: Outdoor Area */}
                  <div className="flex items-center gap-2 max-w-[50%] justify-end text-right">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block leading-tight truncate">
                        Area Luar Terbuka
                      </span>
                      <span className="text-[10px] text-teks-sekunder font-medium block leading-tight truncate">
                        {previewWet ? 'Terguyur Hujan' : 'Sinar Matahari Terik'}
                      </span>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Sun className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Layer 3: Pulley Rope System & Gliding Clothes Carriage */}
                <div className="relative z-10 w-full my-auto py-5">
                  {/* Steel Pulley Track Cable */}
                  <div className="relative w-full h-1 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-between shadow-xs">
                    {/* Motor Pulley Hub (Left Wall / Atap) */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 border-indigo-500 bg-slate-900 flex items-center justify-center -ml-2.5 transition-transform duration-700 shadow-sm ${
                        previewWet ? 'rotate-180' : 'rotate-0'
                      }`}
                      title="Motor Servo Katrol"
                    >
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    </div>

                    {/* Return Idler Wheel (Right Outdoor Anchor) */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-500 bg-slate-900 flex items-center justify-center -mr-2.5 transition-transform duration-700 shadow-sm ${
                        previewWet ? 'rotate-180' : 'rotate-0'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                    </div>
                  </div>

                  {/* Gliding Clothesline Trolley Carriage */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out flex flex-col items-center pointer-events-none"
                    style={{
                      left: previewWet ? '24%' : '74%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {/* Trolley Roller Wheels Riding on Cable */}
                    <div className="flex items-center gap-2 -mb-0.5">
                      <div className="w-2 h-2 rounded-full bg-slate-700 dark:bg-slate-200 border border-slate-900" />
                      <div className="w-2 h-2 rounded-full bg-slate-700 dark:bg-slate-200 border border-slate-900" />
                    </div>

                    {/* Trolley Metal Bracket with Cable/Motor icon */}
                    <div className="w-5 h-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xs flex items-center justify-center shadow-md">
                      <Cable className="w-3 h-3 text-white" />
                    </div>

                    {/* Clothes Drying Bar / Rod */}
                    <div className="w-20 sm:w-24 h-1.5 bg-slate-800 dark:bg-slate-200 rounded-full my-0.5 shadow-sm" />

                    {/* Clothes Hanging Gracefully with Real Hanger Hooks */}
                    <div className="flex items-start justify-center gap-2 sm:gap-2.5 pt-0.5">
                      {/* Item 1: Shirt on Hanger */}
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-1 border-t border-l border-slate-500 dark:border-slate-400 rounded-tl-sm -mb-0.5" />
                        <svg
                          className="w-5 h-6 text-indigo-500 dark:text-indigo-400 filter drop-shadow-xs"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M20.38 3.46l-4.22 1.41a2 2 0 0 1-1.31-.05L12 3.65l-2.85 1.17a2 2 0 0 1-1.31.05L3.62 3.46a1 1 0 0 0-1.28 1.13l1.1 5.51a1 1 0 0 0 .9.8l1.66.17V20a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.93l1.66-.17a1 1 0 0 0 .9-.8l1.1-5.51a1 1 0 0 0-1.26-1.13z" />
                        </svg>
                      </div>

                      {/* Item 2: Pants / Trousers */}
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-1 border-t border-l border-slate-500 dark:border-slate-400 rounded-tl-sm -mb-0.5" />
                        <svg
                          className="w-4 h-6 text-cyan-600 dark:text-cyan-400 filter drop-shadow-xs"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18 2H6a2 2 0 0 0-2 2v18l7-4 7 4V4a2 2 0 0 0-2-2z" />
                        </svg>
                      </div>

                      {/* Item 3: Towel / Cloth */}
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-1 border-t border-l border-slate-500 dark:border-slate-400 rounded-tl-sm -mb-0.5" />
                        <svg
                          className="w-4 h-5 text-amber-500 dark:text-amber-400 filter drop-shadow-xs"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <rect x="4" y="3" width="16" height="18" rx="2" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Layer 4: Clean Telemetry Status Dock (Zero Collisions, Spacious & Crisp) */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-garis/60">
                  <div className="flex items-center gap-1.5 text-xs text-teks-utama font-medium">
                    <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>
                      Posisi Rel:{' '}
                      <span className="font-mono font-bold">{previewWet ? '90°' : '0°'}</span>
                    </span>
                    <span className="text-[11px] text-teks-sekunder">
                      ({previewWet ? 'Bawah Atap' : 'Area Luar'})
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      previewWet
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        previewWet ? 'bg-indigo-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    <span>{previewWet ? 'Pakaian Terlindungi' : 'Menjemur di Terik Sinar'}</span>
                  </span>
                </div>
              </div>

              {/* Simulation Interactive Controls with Dashboard-Style Blue-Purple Toggle */}
              <div className="w-full sm:w-2/5 flex flex-col justify-between space-y-3.5 py-1">
                <div className="space-y-1.5">
                  <span className="font-bold text-xs sm:text-sm text-teks-utama block">
                    Uji Respon Tali Katrol:
                  </span>
                  <p className="text-[11px] text-teks-sekunder leading-relaxed">
                    Klik toggle untuk menyimulasikan respon sensor ketika hujan turun. Motor katrol secara otomatis menggeser jemuran ke area atap tertutup dalam hitungan sub-detik.
                  </p>
                </div>

                {/* Dashboard-Style Rail Toggle Bar with Soft Blue-Purple Accent */}
                <div
                  onClick={() => setPreviewWet(!previewWet)}
                  className="relative h-11 w-full rounded-full border border-slate-300 dark:border-slate-700 bg-slate-200/90 dark:bg-slate-800 p-1 cursor-pointer select-none transition-all shadow-inner"
                  role="button"
                  tabIndex={0}
                  aria-label="Toggle posisi jemuran"
                >
                  {/* Track guide line */}
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-1 bg-slate-300 dark:bg-slate-700 rounded-full pointer-events-none" />

                  {/* Two fixed target labels */}
                  <div className="relative z-0 h-full flex items-center justify-between px-3 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <Umbrella className="w-3 h-3 text-indigo-500" />
                      <span>Atap (90°)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-500" />
                      <span>Luar (0°)</span>
                    </span>
                  </div>

                  {/* Sliding Knob with Blue-Purple (Biru Ungu) Accent */}
                  <div
                    className={`absolute top-1 bottom-1 flex items-center gap-1.5 px-3.5 rounded-full text-[11px] font-black shadow-md transition-all duration-500 ease-in-out select-none ${
                      previewWet
                        ? 'left-1 translate-x-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white ring-2 ring-indigo-400 shadow-indigo-500/30'
                        : 'left-[calc(100%-4px)] -translate-x-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/25'
                    }`}
                  >
                    {previewWet ? (
                      <>
                        <Umbrella className="w-3.5 h-3.5 shrink-0" />
                        <span className="whitespace-nowrap">Bawah Atap</span>
                      </>
                    ) : (
                      <>
                        <Sun className="w-3.5 h-3.5 shrink-0" />
                        <span className="whitespace-nowrap">Luar Terbuka</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Button with Soft Blue-Purple Gradient */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewWet(!previewWet)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer ${
                      previewWet
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-amber-500/20'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25'
                    }`}
                  >
                    {previewWet ? (
                      <>
                        <Sun className="w-4 h-4" />
                        <span>Keringkan Sensor (Tarik ke Luar)</span>
                      </>
                    ) : (
                      <>
                        <CloudRain className="w-4 h-4" />
                        <span>Simulasikan Tetesan Hujan</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-teks-sekunder px-1 font-mono">
                    <span>Kecepatan Tarik Motor:</span>
                    <span className="font-bold text-emerald-500">&lt; 450ms (Sub-Detik)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Animated Telemetry Cards on Scroll (Zero Slop, Pure Precision) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Status Servo */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-kartu-muted border border-garis/60 hover:border-indigo-500/40 transition-all space-y-2 shadow-xs group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs text-teks-sekunder font-medium block truncate">
                  Status Servo
                </span>
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                  <Activity className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-teks-utama">
                  {displayServo}°
                </p>
                <p className="text-[11px] sm:text-xs font-bold text-indigo-500 truncate mt-0.5">
                  {previewWet ? '(Di Bawah Atap)' : '(Jemur)'}
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
                <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
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
                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
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
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
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

      {/* 4. Interactive AI Rain Prediction & Drying Score Sandbox (Vibrant & Elegant) */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold font-mono bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI MICROCLIMATE INTELLIGENCE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-teks-utama">
            Prediksi Hujan & Rekomendasi Jemur Berbasis AI
          </h2>
          <p className="text-xs sm:text-sm text-teks-sekunder max-w-xl mx-auto leading-relaxed">
            Algoritma AI Rintik memantau gradien laju perubahan kelembapan dan tekanan udara sebelum tetesan air pertama turun ke permukaan kain jemuran.
          </p>
        </div>

        <div className="p-6 sm:p-9 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-500/5 via-kartu to-purple-500/10 border border-indigo-500/20 shadow-xl backdrop-blur-xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* AI Circular Gauge with Radiant Glow */}
          <div className="flex flex-col items-center justify-center p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-kartu-muted/90 to-kartu border border-garis/80 text-center space-y-4 shadow-sm relative overflow-hidden">
            {/* Ambient subtle backglow */}
            <div
              className={`absolute inset-0 opacity-20 blur-2xl transition-all duration-700 pointer-events-none ${
                aiScore > 65
                  ? 'bg-emerald-500'
                  : aiScore > 35
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />

            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-200 dark:text-slate-800"
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
                  } transition-all duration-500`}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black font-mono tracking-tight text-teks-utama">
                  {aiScore}
                </span>
                <span className="text-[10px] text-teks-sekunder font-bold tracking-wider uppercase mt-0.5">
                  Skor Jemur
                </span>
              </div>
            </div>

            <div className="space-y-1.5 z-10">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black font-heading shadow-xs ${
                aiScore > 65
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : aiScore > 35
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              }`}>
                {aiStatus.label}
              </span>
              <p className="text-xs text-teks-sekunder leading-relaxed max-w-xs">{aiStatus.desc}</p>
            </div>
          </div>

          {/* Interactive Slider Controller & Rich Data Grid */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <h4 className="text-sm sm:text-base font-bold text-teks-utama flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span>Simulasikan Kelembapan Udara (RH)</span>
              </h4>
              <p className="text-xs text-teks-sekunder leading-relaxed">
                Geser penggeser di bawah untuk mengamati adaptasi model AI Rintik dalam menghitung risiko hujan dan mengendalikan motor jemuran:
              </p>
            </div>

            {/* Slider with Vibrant Gradient Track */}
            <div className="space-y-2.5 p-4 sm:p-5 rounded-2xl bg-kartu-muted border border-garis/70 shadow-xs">
              <div className="flex justify-between text-xs font-bold font-mono">
                <span className="text-teks-sekunder">Tingkat Kelembapan:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm">{aiSandboxHum}% RH</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                value={aiSandboxHum}
                onChange={(e) => setAiSandboxHum(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer h-2.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-lg accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-teks-sekunder font-medium pt-1 font-mono">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">20% (Kering)</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">60% (Sedang)</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">95% (Jenuh Air)</span>
              </div>
            </div>

            {/* 4 Rich Colorful Metric Chips */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-kartu border border-garis/80 space-y-1 shadow-xs">
                <span className="text-[11px] text-teks-sekunder font-medium flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                  Probabilitas Hujan
                </span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-lg font-black font-mono ${aiProb > 70 ? 'text-rose-500' : aiProb > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {aiProb}%
                  </span>
                  <span className="text-[10px] font-mono text-teks-sekunder">
                    {aiProb > 70 ? 'Tinggi' : aiProb > 40 ? 'Sedang' : 'Rendah'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-kartu border border-garis/80 space-y-1 shadow-xs">
                <span className="text-[11px] text-teks-sekunder font-medium flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  Estimasi Kering
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black font-mono text-teks-utama">
                    {aiProb > 70 ? 'Segera Atap' : `~${(1.2 + (100 - aiScore) * 0.03).toFixed(1)} Jam`}
                  </span>
                  <span className="text-[10px] font-mono text-teks-sekunder">
                    {aiProb > 70 ? 'Kritis' : 'Terik'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-kartu border border-garis/80 space-y-1 shadow-xs">
                <span className="text-[11px] text-teks-sekunder font-medium flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  Posisi Katrol Tali
                </span>
                <span className="text-xs font-black font-mono text-teks-utama block">
                  {aiProb > 70 ? '90° (Tarik ke Atap)' : '0° (Jemur Luar)'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-kartu border border-garis/80 space-y-1 shadow-xs">
                <span className="text-[11px] text-teks-sekunder font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  Evaporasi Mikro
                </span>
                <span className={`text-xs font-black font-mono block ${aiScore > 65 ? 'text-emerald-500' : aiScore > 35 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {aiScore > 65 ? 'Optimal (Cepat)' : aiScore > 35 ? 'Cukup (Moderat)' : 'Lambat (Lembap)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works (Alur Kerja 3 Langkah Presisi) */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-8 border-t border-garis">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-teks-utama">
            Alur Otomatisasi Rel Tali Jemuran
          </h2>
          <p className="text-xs sm:text-sm text-teks-sekunder max-w-lg mx-auto">
            Hanya 3 langkah presisi dari sensor analog hingga jemuran pakaian aman berada di bawah naungan atap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl sm:rounded-3xl bg-kartu border border-garis space-y-4 shadow-xs relative">
            <span className="text-3xl font-black font-mono text-indigo-500/20 absolute top-5 right-5">
              01
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-teks-utama font-heading">
              1. Deteksi Tetesan Pertama
            </h3>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Plat sensor FC-37 mendeteksi konduktivitas listrik seketika butiran air gerimis menyentuh lempeng sensor di luar ruangan.
            </p>
          </div>

          <div className="p-6 rounded-2xl sm:rounded-3xl bg-kartu border border-garis space-y-4 shadow-xs relative">
            <span className="text-3xl font-black font-mono text-blue-500/20 absolute top-5 right-5">
              02
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-teks-utama font-heading">
              2. Tali Menarik ke Atap
            </h3>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Mikrokontroler ESP32 langsung menggerakkan motor penarik tali rel, memindahkan jemuran ke tempat teduh di bawah atap tertutup dalam &lt;500ms.
            </p>
          </div>

          <div className="p-6 rounded-2xl sm:rounded-3xl bg-kartu border border-garis space-y-4 shadow-xs relative">
            <span className="text-3xl font-black font-mono text-emerald-500/20 absolute top-5 right-5">
              03
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-teks-utama font-heading">
              3. Notifikasi WebSocket & Bot
            </h3>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Status telemetri terbarui realtime di dashboard dan bot Telegram mengirimkan pesan darurat instan ke ponsel Anda.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Hardware Bento Grid (Shadcn Minimalist) */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-8 border-t border-garis">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-teks-utama">
            Hardware & Infrastruktur Berkualitas
          </h2>
          <p className="text-xs sm:text-sm text-teks-sekunder max-w-lg mx-auto">
            Komponen andal yang tahan terhadap perubahan cuaca panas terik maupun hujan deras.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-kartu border border-garis space-y-2 shadow-xs">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 inline-block">
              <Cpu className="w-5 h-5" />
            </span>
            <h4 className="font-bold text-sm text-teks-utama">ESP32 Dual-Core 240MHz</h4>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Eksekusi firmware lokal instan dengan konsumsi daya rendah dan konektivitas WiFi jarak jauh yang stabil.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-kartu border border-garis space-y-2 shadow-xs">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500 inline-block">
              <Server className="w-5 h-5" />
            </span>
            <h4 className="font-bold text-sm text-teks-utama">Backend Golang Cloud</h4>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Server Golang efisien (&lt;30MB RAM) dengan koneksi WebSocket persisten untuk komunikasi data tanpa jeda polling.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-kartu border border-garis space-y-2 shadow-xs">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 inline-block">
              <CloudSun className="w-5 h-5" />
            </span>
            <h4 className="font-bold text-sm text-teks-utama">Prakiraan Cuaca BMKG</h4>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Sinkronisasi data resmi cuaca BMKG Republik Indonesia hingga tingkat kelurahan secara otomatis.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-kartu border border-garis space-y-2 shadow-xs">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 inline-block">
              <Shield className="w-5 h-5" />
            </span>
            <h4 className="font-bold text-sm text-teks-utama">Isolasi Akun Multi-Tenant</h4>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Data sensor dan kontrol rel tali terenkripsi serta diisolasi ketat per ID pengguna.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-kartu border border-garis space-y-2 shadow-xs">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 inline-block">
              <BellRing className="w-5 h-5" />
            </span>
            <h4 className="font-bold text-sm text-teks-utama">Alarm Looping & Bot Telegram</h4>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Nada dering sirine looping persisten dan notifikasi darurat terhubung ke Telegram Bot.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-kartu border border-garis space-y-2 shadow-xs">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500 inline-block">
              <Smartphone className="w-5 h-5" />
            </span>
            <h4 className="font-bold text-sm text-teks-utama">Progressive Web App (PWA)</h4>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Dapat diinstal langsung ke layar utama Android maupun iOS dengan tampilan fullscreen.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Silky-Smooth FAQ Accordion with CSS Grid Transition */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-4xl mx-auto space-y-8 border-t border-garis">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-teks-utama">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xs sm:text-sm text-teks-sekunder max-w-md mx-auto">
            Informasi lengkap seputar operasional hardware dan sistem IoT Rintik.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Bagaimana cara kerja tali katrol jemuran saat hujan turun?',
              a: 'Ketika lempeng sensor FC-37 mendeteksi tetesan air hujan pertama, mikrokontroler ESP32 langsung mengaktifkan motor untuk menarik tali katrol. Tali tersebut menggeser rel jemuran pakaian masuk ke area atap tertutup (tempat teduh) secara otomatis dalam waktu kurang dari 500ms.',
            },
            {
              q: 'Apakah jemuran tetap bisa tertarik ke atap jika WiFi/internet terputus?',
              a: 'Ya, 100% aman! Logika penarikan tali jemuran berjalan langsung di dalam firmware ESP32 tanpa memerlukan koneksi cloud. Begitu sensor basah, jemuran langsung ditarik ke bawah atap.',
            },
            {
              q: 'Berapa kebutuhan daya listrik untuk alat jemuran ini?',
              a: 'Sistem dirancang hemat energi menggunakan adaptor 5V USB (seperti charger HP standar) dengan konsumsi daya rata-rata di bawah 2 Watt, atau dapat ditenagai menggunakan powerbank cadangan.',
            },
            {
              q: 'Apakah ada biaya langganan bulanan?',
              a: 'Tidak ada biaya langganan. Platform Rintik dapat digunakan secara gratis untuk memantau telemetri perangkat dan menerima notifikasi peringatan hujan.',
            },
          ].map((item, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-kartu border border-garis overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-teks-utama hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-300 ease-out ${
                      isOpen ? 'rotate-180 text-indigo-500' : 'text-teks-sekunder'
                    }`}
                  />
                </button>

                {/* Silky-Smooth Height Transition via CSS Grid */}
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-teks-sekunder leading-relaxed border-t border-garis/50 pt-3">
                      {item.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Bottom Call to Action */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="p-7 sm:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-blue-600/10 via-indigo-600/10 to-cyan-600/10 border border-indigo-500/20 space-y-4 sm:space-y-5">
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
