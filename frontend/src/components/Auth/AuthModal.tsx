import React, { useState } from 'react';
import { Mail, Lock, User, X, Check, Eye, EyeOff, ShieldCheck, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { Button } from '../Common/Button';
import { AuthService } from '../../services/auth';
import { AuthSession } from '../../types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
  backendUrl: string;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  backendUrl,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Default true for user convenience
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await AuthService.login(backendUrl, email, password, rememberMe);
        if (res.success && res.session) {
          onSuccess(res.session);
          onClose();
        } else {
          setErrorMsg(res.error || 'Email atau kata sandi tidak sesuai');
        }
      } else {
        if (!name.trim()) {
          setErrorMsg('Nama lengkap wajib diisi');
          setIsLoading(false);
          return;
        }
        const res = await AuthService.register(backendUrl, name, email, password, rememberMe);
        if (res.success && res.session) {
          onSuccess(res.session);
          onClose();
        } else {
          setErrorMsg(res.error || 'Gagal mendaftarkan akun baru');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const session = AuthService.demoLogin(rememberMe);
    onSuccess(session);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-kartu border border-garis rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-teks-sekunder hover:text-teks-utama p-1 rounded-xl transition-colors"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center shadow-inner">
            {mode === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <h3 className="text-xl font-bold text-teks-utama font-heading">
            {mode === 'login' ? 'Masuk ke HujanPantau' : 'Buat Akun Baru'}
          </h3>
          <p className="text-xs text-teks-sekunder max-w-xs mx-auto">
            {mode === 'login'
              ? 'Akses dashboard sensor jemuran dan riwayat IoT Anda.'
              : 'Daftar untuk mengamankan data dan memisahkan perangkat Anda.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-kartu-muted rounded-xl border border-garis text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-kartu text-cyan-600 dark:text-cyan-400 shadow-sm border border-garis'
                : 'text-teks-sekunder hover:text-teks-utama'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-kartu text-cyan-600 dark:text-cyan-400 shadow-sm border border-garis'
                : 'text-teks-sekunder hover:text-teks-utama'
            }`}
          >
            Daftar Akun
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2 animate-in fade-in">
            <span className="shrink-0">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-teks-sekunder uppercase tracking-wider">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-teks-sekunder absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Alfadhilah"
                  className="w-full bg-kartu-muted border border-garis rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-teks-utama focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-teks-sekunder uppercase tracking-wider">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-teks-sekunder absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-kartu-muted border border-garis rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-teks-utama focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-teks-sekunder uppercase tracking-wider">
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
                className="w-full bg-kartu-muted border border-garis rounded-xl pl-10 pr-10 py-2.5 text-xs text-teks-utama focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-teks-sekunder hover:text-teks-utama"
                aria-label="Tampilkan kata sandi"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Ingat Saya (Remember Me) Feature */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                  rememberMe
                    ? 'bg-cyan-500 border-cyan-500 text-white'
                    : 'bg-kartu-muted border-garis'
                }`}
              >
                {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div className="text-xs">
                <span className="font-semibold text-teks-utama">Ingat saya</span>
                <span className="text-[11px] text-teks-sekunder block">
                  Tetap masuk di browser ini secara otomatis
                </span>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading}
            className="w-full mt-2 justify-center shadow-lg shadow-cyan-500/20"
          >
            {isLoading
              ? 'Memproses...'
              : mode === 'login'
              ? 'Masuk ke Dashboard'
              : 'Daftar & Masuk'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-garis w-full" />
          <span className="bg-kartu px-3 text-[11px] text-teks-sekunder uppercase tracking-wider relative">
            atau coba langsung
          </span>
        </div>

        {/* Quick Demo Login */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleDemoLogin}
          className="w-full justify-center gap-1.5 text-xs text-teks-utama border-cyan-500/30 hover:border-cyan-500"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Masuk Cepat Sebagai Demo (1-Klik)</span>
        </Button>
      </div>
    </div>
  );
};
