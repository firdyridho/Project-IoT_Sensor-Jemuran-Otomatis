import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Key,
  Send,
  BellRing,
  Volume2,
  VolumeX,
  Play,
  Square,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Save,
  Moon,
  Sun,
  Laptop,
  Check,
} from 'lucide-react';
import { User, AuthSession } from '../../types/auth';
import { AuthService } from '../../services/auth';
import { PasswordStrengthMeter, evaluatePassword } from './PasswordStrengthMeter';
import { AudioAlarmService, ALARM_TONE_OPTIONS, AlarmToneType } from '../../utils/audioAlarm';

interface SettingsViewProps {
  user?: User;
  onUpdateUser?: (updated: User) => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
  onClose?: () => void;
  initialTab?: 'profile' | 'password' | 'telegram' | 'preferences';
}

type SettingsTab = 'profile' | 'password' | 'telegram' | 'preferences';

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  theme,
  onToggleTheme,
  onClose,
  initialTab = 'profile',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Telegram Form State
  const [telegramChatId, setTelegramChatId] = useState(user?.telegramChatId || '');
  const [telegramBotUsername, setTelegramBotUsername] = useState('Rintik_Iot_Bot');
  const [telegramMsg, setTelegramMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  // Alarm & Theme Preferences State
  const [alarmTone, setAlarmTone] = useState<AlarmToneType>(() => {
    return (localStorage.getItem('rintik.alarm.tone') as AlarmToneType) || 'emergency_siren';
  });
  const [alarmVolume, setAlarmVolume] = useState<number>(() => {
    const saved = localStorage.getItem('rintik.alarm.volume');
    return saved ? parseInt(saved, 10) : 80;
  });
  const [continuousAlarm, setContinuousAlarm] = useState<boolean>(() => {
    const saved = localStorage.getItem('rintik.alarm.continuous');
    return saved !== null ? saved === 'true' : true;
  });
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [prefMsg, setPrefMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const backendBase =
    typeof window !== 'undefined'
      ? window.location.hostname.includes('sslip.io')
        ? window.location.origin
        : 'https://staging-43-133-136-149.sslip.io'
      : '';

  const session = AuthService.getSession();
  const token = session?.token || '';

  // Load Telegram bot config
  useEffect(() => {
    fetch(`${backendBase}/api/telegram/config`)
      .then((res) => res.json())
      .then((data) => {
        if (data.botUsername) {
          setTelegramBotUsername(data.botUsername);
        }
      })
      .catch(() => {});
  }, [backendBase]);

  // Sync state when user prop updates
  useEffect(() => {
    if (user) {
      setName(user.name);
      setUsername(user.username);
      if (user.telegramChatId) setTelegramChatId(user.telegramChatId);
      if (user.alarmTone) setAlarmTone(user.alarmTone as AlarmToneType);
    }
  }, [user]);

  // ---------------------------------------------------------------------------
  // 1. Profile Update Handler (PUT /api/user/profile)
  // ---------------------------------------------------------------------------
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanName) {
      setProfileMsg({ type: 'error', text: 'Nama lengkap wajib diisi' });
      return;
    }
    if (cleanUsername.length < 3) {
      setProfileMsg({ type: 'error', text: 'Username minimal 3 karakter' });
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch(`${backendBase}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: cleanName,
          username: cleanUsername,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui profil');
      }

      // If backend returned a new JWT token (due to username change), update session
      if (data.token && session) {
        const newSession: AuthSession = {
          ...session,
          token: data.token,
          user: {
            ...session.user,
            name: cleanName,
            username: cleanUsername,
          },
        };
        AuthService.saveSession(newSession);
      }

      const updatedUser: User = {
        ...(user || { id: session?.user?.id || 'u-1', name: cleanName, username: cleanUsername }),
        name: cleanName,
        username: cleanUsername,
      };

      if (onUpdateUser) onUpdateUser(updatedUser);
      setProfileMsg({ type: 'success', text: 'Profil akun berhasil disimpan!' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setProfileMsg({ type: 'error', text: errorMessage });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. Password Update Handler (PUT /api/user/password)
  // ---------------------------------------------------------------------------
  const passwordEval = evaluatePassword(newPassword, confirmPassword);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Kata sandi saat ini wajib diisi' });
      return;
    }
    if (!passwordEval.isReady) {
      setPasswordMsg({
        type: 'error',
        text: 'Pastikan kata sandi baru memenuhi seluruh syarat dan konfirmasi cocok',
      });
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch(`${backendBase}/api/user/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengganti kata sandi');
      }

      setPasswordMsg({ type: 'success', text: 'Kata sandi Anda berhasil diperbarui!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengganti kata sandi';
      setPasswordMsg({ type: 'error', text: errorMessage });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. Telegram Update & Test Handler
  // ---------------------------------------------------------------------------
  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setTelegramMsg(null);

    setIsSavingTelegram(true);
    try {
      const cleanChatId = telegramChatId.trim();
      const res = await fetch(`${backendBase}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          telegramChatId: cleanChatId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan ID Telegram');
      }

      localStorage.setItem('rintik.telegram.chatId', cleanChatId);
      if (user && onUpdateUser) {
        onUpdateUser({ ...user, telegramChatId: cleanChatId });
      }

      setTelegramMsg({
        type: 'success',
        text: cleanChatId
          ? `Chat ID "${cleanChatId}" berhasil dihubungkan ke akun!`
          : 'Integrasi Telegram berhasil dinonaktifkan',
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan ID Telegram';
      setTelegramMsg({ type: 'error', text: errorMessage });
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    setTelegramMsg(null);
    const targetId = telegramChatId.trim();
    if (!targetId) {
      setTelegramMsg({
        type: 'error',
        text: 'Masukkan Chat ID terlebih dahulu atau klik tombol "Hubungkan ke Bot Telegram"',
      });
      return;
    }

    setIsTestingTelegram(true);
    try {
      const res = await fetch(`${backendBase}/api/user/test-telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatId: targetId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim pesan bot Telegram');
      }

      setTelegramMsg({
        type: 'success',
        text: 'Pesan bot pengujian berhasil dikirim! Silakan periksa aplikasi Telegram Anda.',
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengirim pesan bot';
      setTelegramMsg({ type: 'error', text: errorMessage });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleOpenTelegramBot = () => {
    const userId = session?.user?.id || user?.id || '';
    const botUrl = `https://t.me/${telegramBotUsername}?start=pair_user_${encodeURIComponent(userId)}`;
    window.open(botUrl, '_blank', 'noopener,noreferrer');
  };

  // ---------------------------------------------------------------------------
  // 4. Alarm Preferences Handler
  // ---------------------------------------------------------------------------
  const handleTogglePreview = (tone: AlarmToneType) => {
    if (isPreviewPlaying) {
      AudioAlarmService.stopPreview();
      setIsPreviewPlaying(false);
    } else {
      setIsPreviewPlaying(true);
      AudioAlarmService.previewTone(tone, alarmVolume);
      window.setTimeout(() => {
        setIsPreviewPlaying(false);
      }, 1500);
    }
  };

  const handleSavePreferences = async () => {
    setPrefMsg(null);
    localStorage.setItem('rintik.alarm.tone', alarmTone);
    localStorage.setItem('rintik.alarm.volume', String(alarmVolume));
    localStorage.setItem('rintik.alarm.continuous', String(continuousAlarm));

    try {
      // Sync to cloud backend
      await fetch(`${backendBase}/api/user/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          alarmSound: alarmTone,
          alarmVolume: alarmVolume,
          tema: theme,
        }),
      });

      await fetch(`${backendBase}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          alarmTone: alarmTone,
          theme: theme,
        }),
      });

      if (user && onUpdateUser) {
        onUpdateUser({ ...user, alarmTone: alarmTone, theme: theme });
      }

      setPrefMsg({ type: 'success', text: 'Preferensi alarm & tampilan berhasil disimpan!' });
    } catch {
      setPrefMsg({
        type: 'success',
        text: 'Preferensi disimpan di peramban ini (sinkronisasi cloud menunggu koneksi).',
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pusat Kendali Akun & Sistem</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Pengaturan Akun & Preferensi
          </h1>
          <p className="text-sm text-slate-400">
            Kelola identitas profil, keamanan kata sandi, integrasi bot Telegram, dan alarm hujan.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
          >
            Kembali ke Dashboard
          </button>
        )}
      </div>

      {/* Main Grid: Sidebar Tabs + Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Navigation Tabs */}
        <div className="md:col-span-4 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              activeTab === 'profile'
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div
              className={`p-2 rounded-xl ${
                activeTab === 'profile' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block">Profil & Akun</span>
              <span className="text-xs text-slate-400 block">Nama lengkap & identitas</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              activeTab === 'password'
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div
              className={`p-2 rounded-xl ${
                activeTab === 'password' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Key className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block">Keamanan Kata Sandi</span>
              <span className="text-xs text-slate-400 block">Ganti sandi & indikator kekuatan</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('telegram')}
            className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              activeTab === 'telegram'
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div
              className={`p-2 rounded-xl ${
                activeTab === 'telegram' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Send className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block">Integrasi Telegram</span>
              <span className="text-xs text-slate-400 block">Notifikasi bot & uji coba kirim</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              activeTab === 'preferences'
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div
              className={`p-2 rounded-xl ${
                activeTab === 'preferences'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block">Alarm & Tampilan</span>
              <span className="text-xs text-slate-400 block">Nada dering, volume & tema</span>
            </div>
          </button>
        </div>

        {/* Right Tab Content Panel */}
        <div className="md:col-span-8 bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          {/* TAB 1: PROFIL & AKUN */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">Profil Pengguna</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Perbarui informasi nama tampilan dan nama pengguna (username) akun Anda.
                </p>
              </div>

              {profileMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3 ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-300 border border-red-500/30'
                  }`}
                >
                  {profileMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Username Akun
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder="budisantoso"
                      className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm font-mono"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Minimal 3 karakter tanpa spasi. Digunakan untuk login ke antarmuka Rintik.
                  </span>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: KEAMANAN KATA SANDI */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">Ganti Kata Sandi</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Amankan akses akun Anda dengan kata sandi yang kuat dan tidak mudah ditebak.
                </p>
              </div>

              {passwordMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3 ${
                    passwordMsg.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-300 border border-red-500/30'
                  }`}
                >
                  {passwordMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSavePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Kata Sandi Lama / Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi saat ini"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 text-sm font-medium pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 8 karakter (huruf & angka)"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 text-sm font-medium pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 text-sm font-medium pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Meter Component */}
                <PasswordStrengthMeter password={newPassword} confirmPassword={confirmPassword} />

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingPassword || !passwordEval.isReady || !currentPassword}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Key className="w-4 h-4" />
                    <span>{isSavingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: INTEGRASI TELEGRAM */}
          {activeTab === 'telegram' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">Integrasi Bot Telegram</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Terima pemberitahuan peringatan hujan dan penarikan jemuran otomatis langsung ke ponsel Anda.
                </p>
              </div>

              {telegramMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3 ${
                    telegramMsg.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-300 border border-red-500/30'
                  }`}
                >
                  {telegramMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  )}
                  <span>{telegramMsg.text}</span>
                </div>
              )}

              {/* 1-Click Bot Linking Card */}
              <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-3">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                  <Send className="w-4 h-4" />
                  <span>Hubungkan 1-Klik Otomatis</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Buka bot resmi Rintik di Telegram melalui tombol di bawah, lalu tekan tombol{' '}
                  <strong className="text-cyan-400 font-bold">START</strong>. Akun Anda akan otomatis
                  terhubung seketika.
                </p>
                <button
                  type="button"
                  onClick={handleOpenTelegramBot}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-900/30 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka Bot @{telegramBotUsername}</span>
                </button>
              </div>

              {/* Manual Chat ID Input Form */}
              <form onSubmit={handleSaveTelegram} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Telegram Chat ID Akun Anda
                  </label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="Contoh: 123456789"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 text-sm font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Chat ID akun personal atau ID grup Telegram tempat bot ditambahkan.
                  </span>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={isTestingTelegram || !telegramChatId.trim()}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-40"
                  >
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>{isTestingTelegram ? 'Mengirim Tes...' : 'Uji Kirim Pesan'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingTelegram}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-cyan-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingTelegram ? 'Menyimpan...' : 'Simpan ID Telegram'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: PREFERENSI ALARM & TAMPILAN */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">Preferensi Alarm Hujan & Tampilan</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Sesuaikan jenis bunyi peringatan, volume audio, dan mode warna antarmuka.
                </p>
              </div>

              {prefMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3 ${
                    prefMsg.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-300 border border-red-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>{prefMsg.text}</span>
                </div>
              )}

              {/* Alarm Tone Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Pilihan Nada Dering Alarm Hujan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALARM_TONE_OPTIONS.map((tone) => {
                    const isSelected = alarmTone === tone.id;
                    return (
                      <div
                        key={tone.id}
                        onClick={() => setAlarmTone(tone.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50'
                            : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-bold text-sm ${
                              isSelected ? 'text-cyan-300' : 'text-slate-200'
                            }`}
                          >
                            {tone.label}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                          {tone.description}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePreview(tone.id);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700/80 hover:bg-slate-600 text-slate-200 inline-flex items-center gap-1.5 transition-all"
                        >
                          {isPreviewPlaying && alarmTone === tone.id ? (
                            <>
                              <Square className="w-3 h-3 text-red-400 fill-red-400" />
                              <span>Hentikan</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                              <span>Dengarkan Bunyi</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Volume Slider */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    {alarmVolume === 0 ? (
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                    )}
                    Tingkat Volume Alarm
                  </span>
                  <span className="font-mono text-cyan-400 text-sm font-black">{alarmVolume}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={alarmVolume}
                  onChange={(e) => setAlarmVolume(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Continuous Persistent Alarm Toggle Switch */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-white block">
                    Alarm Berdering Terus-Menerus
                  </span>
                  <span className="text-xs text-slate-400 block">
                    Alarm akan terus berdering tanpa henti layaknya panggilan masuk darurat sampai Anda
                    menekan tombol &quot;Matikan Alarm&quot;.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setContinuousAlarm(!continuousAlarm)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                    continuousAlarm ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      continuousAlarm ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Theme Preference Toggle */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-white block">Tema Antarmuka</span>
                  <span className="text-xs text-slate-400 block">
                    Mode tema aktif: <strong className="text-cyan-400 uppercase">{theme}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all"
                >
                  {theme === 'dark' ? (
                    <>
                      <Moon className="w-4 h-4 text-cyan-400" />
                      <span>Mode Gelap</span>
                    </>
                  ) : theme === 'light' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Mode Terang</span>
                    </>
                  ) : (
                    <>
                      <Laptop className="w-4 h-4 text-slate-300" />
                      <span>Sistem</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Preferensi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
