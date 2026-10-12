import React, { useState } from 'react';
import {
  AtSign,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  LogIn,
  UserPlus,
  ArrowLeft,
  CloudRain,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Moon,
  Sun,
  Laptop,
} from 'lucide-react';
import { Button } from '../Common/Button';
import { AuthService } from '../../services/auth';
import { AuthSession } from '../../types/auth';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  backendUrl: string;
  onSuccess: (session: AuthSession) => void;
  onBackToLanding: () => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  backendUrl,
  onSuccess,
  onBackToLanding,
  theme,
  onToggleTheme,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await AuthService.login(backendUrl, username, password, rememberMe);
        if (res.success && res.session) {
          onSuccess(res.session);
        } else {
          setErrorMsg(res.error || 'Username atau kata sandi tidak cocok');
        }
      } else {
        if (!name.trim()) {
          setErrorMsg('Nama lengkap wajib diisi');
          setIsLoading(false);
          return;
        }
        if (username.trim().length < 3) {
          setErrorMsg('Username minimal 3 karakter');
          setIsLoading(false);
          return;
        }
        const res = await AuthService.register(backendUrl, name, username, password, rememberMe);
        if (res.success && res.session) {
          onSuccess(res.session);
        } else {
          setErrorMsg(res.error || 'Gagal mendaftarkan akun baru');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan pada sistem autentikasi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const session = AuthService.demoLogin(rememberMe);
    onSuccess(session);
  };

  return (
    <div className="min-h-screen bg-latar text-teks-utama flex flex-col selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Bar for Back & Theme Toggle */}
      <header className="w-full border-b bg-kartu/80 backdrop-blur-md border-garis sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-teks-sekunder hover:text-teks-utama p-2 -ml-2 rounded-xl hover:bg-kartu-muted transition-all"
            aria-label="Kembali ke Beranda"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-teks-sekunder hover:text-teks-utama hover:bg-kartu-muted border border-transparent hover:border-garis transition-all"
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
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-3.5 sm:px-6">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Visual & Perks (Hidden on small mobile, visible on lg or desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-6 p-8 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border border-garis/80">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                <CloudRain className="w-7 h-7" />
              </div>

              <div>
                <h2 className="font-heading font-black text-2xl tracking-tight text-teks-utama">
                  HujanPantau IoT
                </h2>
                <p className="text-xs text-teks-sekunder mt-1">
                  Proteksi jemuran cerdas dengan isolasi multi-user aman.
                </p>
              </div>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-teks-utama">Data Terisolasi Penuh</h4>
                  <p className="text-[11px] text-teks-sekunder">
                    Data perangkat dan sensor Anda tidak akan tertukar dengan pengguna lain.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-teks-utama">Realtime WebSocket Cloud</h4>
                  <p className="text-[11px] text-teks-sekunder">
                    Sinkronisasi data milidetik langsung dari ESP32 ke Tencent VPS.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-teks-utama">Fitur Ingat Saya</h4>
                  <p className="text-[11px] text-teks-sekunder">
                    Tidak perlu repot login ulang setiap membuka browser atau HP.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-kartu-muted/60 border border-garis/60 text-[11px] text-teks-sekunder">
              <span className="font-semibold text-teks-utama">Akun Demo Cepat:</span> Gunakan username{' '}
              <code className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">admin</code> / password{' '}
              <code className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">admin123</code>
            </div>
          </div>

          {/* Right Column: Authentication Form Card */}
          <div className="lg:col-span-7 w-full max-w-md mx-auto">
            <div className="p-6 sm:p-8 rounded-3xl bg-kartu border border-garis shadow-2xl backdrop-blur-xl space-y-6">
              {/* Header inside Form Card */}
              <div className="text-center space-y-2">
                <div className="lg:hidden inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 mb-1">
                  <CloudRain className="w-6 h-6" />
                </div>
                <h1 className="font-heading font-black text-xl sm:text-2xl tracking-tight text-teks-utama">
                  {mode === 'login' ? 'Masuk ke Akun Anda' : 'Buat Akun Baru'}
                </h1>
                <p className="text-xs text-teks-sekunder">
                  {mode === 'login'
                    ? 'Masukkan username dan kata sandi untuk mengelola jemuran cerdas'
                    : 'Daftarkan diri Anda dalam beberapa detik tanpa biaya'}
                </p>
              </div>

              {/* Mode Tabs Switcher */}
              <div className="grid grid-cols-2 p-1 bg-kartu-muted rounded-2xl border border-garis/60 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    mode === 'login'
                      ? 'bg-kartu text-teks-utama shadow-sm'
                      : 'text-teks-sekunder hover:text-teks-utama'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    mode === 'register'
                      ? 'bg-kartu text-teks-utama shadow-sm'
                      : 'text-teks-sekunder hover:text-teks-utama'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Akun</span>
                </button>
              </div>

              {/* Error Alert Box */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 animate-in fade-in flex items-start gap-2">
                  <span className="shrink-0 font-bold">⚠️</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-teks-sekunder uppercase tracking-wider block">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-teks-sekunder absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Alfadhilah"
                        className="w-full bg-kartu-muted border border-garis rounded-xl pl-10 pr-3.5 py-3 text-xs sm:text-sm text-teks-utama focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-teks-sekunder uppercase tracking-wider block">
                    Username
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-teks-sekunder absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      minLength={3}
                      autoCapitalize="none"
                      autoCorrect="off"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                      placeholder="Contoh: alfadhilah"
                      className="w-full bg-kartu-muted border border-garis rounded-xl pl-10 pr-3.5 py-3 text-xs sm:text-sm text-teks-utama focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-teks-sekunder uppercase tracking-wider block">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-teks-sekunder absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-kartu-muted border border-garis rounded-xl pl-10 pr-11 py-3 text-xs sm:text-sm text-teks-utama focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="min-h-11 min-w-11 absolute right-0 top-0 flex items-center justify-center text-teks-sekunder hover:text-teks-utama"
                      aria-label="Tampilkan kata sandi"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Ingat Saya Feature */}
                <div className="pt-1 text-left">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        rememberMe
                          ? 'bg-cyan-500 border-cyan-500 text-white'
                          : 'border-garis bg-kartu-muted'
                      }`}
                    >
                      {rememberMe && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs text-teks-utama font-medium">
                      Ingat saya di perangkat ini
                    </span>
                  </label>
                  <p className="text-[11px] text-teks-sekunder ml-7 mt-0.5">
                    Tetap login otomatis sehingga tidak perlu login lagi di HP/laptop ini.
                  </p>
                </div>

                {/* Submit Action */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                  className="w-full mt-2 shadow-lg shadow-cyan-500/20 text-sm py-3 font-bold"
                >
                  {isLoading
                    ? 'Memproses...'
                    : mode === 'login'
                    ? 'Masuk ke Dashboard'
                    : 'Daftar & Masuk Otomatis'}
                </Button>
              </form>

              {/* Quick Demo Access Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-garis" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-kartu px-3 text-[11px] text-teks-sekunder font-medium">
                    Atau masuk secara instan
                  </span>
                </div>
              </div>

              {/* 1-Click Demo Login */}
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleDemoLogin}
                className="w-full gap-2 text-xs py-2.5 hover:border-amber-500/40"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Coba Mode Demo (1-Klik Tanpa Akun)</span>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-teks-sekunder border-t border-garis/60">
        <p>© 2026 HujanPantau • Sistem IoT Sensor Jemuran Otomatis</p>
      </footer>
    </div>
  );
};
