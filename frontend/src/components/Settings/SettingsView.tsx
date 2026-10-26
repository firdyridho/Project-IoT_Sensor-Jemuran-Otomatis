import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Key,
  Send,
  Bell,
  BellOff,
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
  UploadCloud,
  Music,
  FileAudio,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { User, AuthSession } from '../../types/auth';
import { AuthService } from '../../services/auth';
import { getDefaultBackendUrl } from '../../services/storage';
import { PasswordStrengthMeter, evaluatePassword } from './PasswordStrengthMeter';
import { AudioAlarmService, ALARM_TONE_OPTIONS, AlarmToneType, cacheCustomAudio } from '../../utils/audioAlarm';

interface SettingsViewProps {
  user?: User;
  onUpdateUser?: (updated: User) => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme?: () => void;
  onChangeTheme?: (newTheme: 'light' | 'dark' | 'system') => void;
  onClose?: () => void;
  initialTab?: 'profile' | 'password' | 'telegram' | 'preferences';
  backendUrl?: string;
  onLogout?: () => void;
}

type SettingsTab = 'profile' | 'password' | 'telegram' | 'preferences';

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  theme,
  onToggleTheme,
  onChangeTheme,
  onClose,
  initialTab = 'profile',
  backendUrl,
  onLogout,
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
  const [customAlarmUrl, setCustomAlarmUrl] = useState<string>(() => {
    return user?.customAlarmUrl || localStorage.getItem('rintik.alarm.custom_url') || '';
  });
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [prefMsg, setPrefMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const backendBase = backendUrl
    ? backendUrl.replace(/\/+$/, '')
    : typeof window !== 'undefined' && window.location.hostname.includes('sslip.io')
    ? window.location.origin
    : getDefaultBackendUrl();

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
      if (user.customAlarmUrl) {
        const fullUrl = user.customAlarmUrl.startsWith('http')
          ? user.customAlarmUrl
          : `${backendBase}${user.customAlarmUrl}`;
        setCustomAlarmUrl(fullUrl);
        cacheCustomAudio(fullUrl).catch(() => {});
      }
    }
  }, [user, backendBase]);

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
  // 4. Alarm Preferences & Custom Audio Upload Handler (REQ-FE-13)
  // ---------------------------------------------------------------------------
  const handleUploadCustomAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setPrefMsg(null);

    // 1. Client-side Size Validation (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError('Ukuran berkas audio melebihi batas maksimal 5 MB.');
      return;
    }

    // 2. Client-side Format Validation
    const allowedExts = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm'];
    const hasValidExt = allowedExts.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setUploadError('Format tidak didukung. Harap gunakan format: .mp3, .wav, .ogg, .m4a, .aac, atau .webm');
      return;
    }

    setIsUploadingAudio(true);
    setUploadProgress(25);

    try {
      const formData = new FormData();
      formData.append('audio', file);

      setUploadProgress(60);
      const res = await fetch(`${backendBase}/api/user/custom-alarm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengunggah berkas audio');
      }

      setUploadProgress(85);
      const webPath = data.customAlarmUrl || '';
      const fullUrl = webPath.startsWith('http') ? webPath : `${backendBase}${webPath}`;

      setCustomAlarmUrl(fullUrl);
      setAlarmTone('custom');
      localStorage.setItem('rintik.alarm.tone', 'custom');
      localStorage.setItem('rintik.alarm.custom_url', fullUrl);

      // Pre-cache to Cache Storage for offline resilience during storms (REQ-FE-13)
      await cacheCustomAudio(fullUrl);

      if (user && onUpdateUser) {
        onUpdateUser({
          ...user,
          alarmTone: 'custom',
          customAlarmUrl: webPath,
        });
      }

      setUploadProgress(100);
      setPrefMsg({
        type: 'success',
        text: `Berkas audio "${file.name}" berhasil diunggah dan disimpan offline sebagai nada dering aktif!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah berkas audio';
      setUploadError(msg);
    } finally {
      setIsUploadingAudio(false);
      setTimeout(() => setUploadProgress(null), 1200);
      if (e.target) e.target.value = '';
    }
  };

  const handleTogglePreview = (tone: AlarmToneType) => {
    if (isPreviewPlaying) {
      AudioAlarmService.stopPreview();
      setIsPreviewPlaying(false);
    } else {
      setIsPreviewPlaying(true);
      const targetUrl = tone === 'custom' ? customAlarmUrl : undefined;
      AudioAlarmService.previewTone(tone, alarmVolume, targetUrl);
      window.setTimeout(
        () => {
          setIsPreviewPlaying(false);
        },
        tone === 'custom' ? 4000 : 1500
      );
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
          customAlarmUrl: customAlarmUrl,
        }),
      });

      if (user && onUpdateUser) {
        onUpdateUser({
          ...user,
          alarmTone: alarmTone,
          theme: theme,
          customAlarmUrl: customAlarmUrl,
        });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200 text-slate-900 shadow-xs dark:bg-slate-900/80 dark:border-slate-800 dark:text-white backdrop-blur-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pusat Kendali Akun & Sistem</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Pengaturan Akun & Preferensi
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Kelola identitas profil, keamanan kata sandi, integrasi bot Telegram, dan alarm hujan.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Kembali ke Dashboard
          </button>
        )}
      </div>

      {/* Top Quick Actions Bar (Features moved from Header: Theme, Notifications, Logout) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 text-slate-900 shadow-xs dark:bg-slate-900/80 dark:border-slate-800 dark:text-white backdrop-blur-xl">
        {/* 1. Mode Tema (Light / Dark / System) */}
        <div className="flex flex-col justify-between gap-2 p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-800/60 dark:border-slate-700/60 dark:text-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-blue-500" />
              ) : theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Laptop className="w-4 h-4 text-slate-500" />
              )}
              Tema Tampilan
            </span>
            <span className="text-[10px] font-mono capitalize px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              {theme === 'system' ? 'Sistem' : theme === 'dark' ? 'Gelap' : 'Terang'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 pt-0.5">
            <button
              type="button"
              onClick={() => (onChangeTheme ? onChangeTheme('light') : onToggleTheme?.())}
              className={`py-1.5 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                theme === 'light'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-white dark:border-slate-800/80'
              }`}
              title="Aktifkan Mode Terang"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Terang</span>
            </button>
            <button
              type="button"
              onClick={() => (onChangeTheme ? onChangeTheme('dark') : onToggleTheme?.())}
              className={`py-1.5 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-white dark:border-slate-800/80'
              }`}
              title="Aktifkan Mode Gelap"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Gelap</span>
            </button>
            <button
              type="button"
              onClick={() => (onChangeTheme ? onChangeTheme('system') : onToggleTheme?.())}
              className={`py-1.5 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                theme === 'system'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-white dark:border-slate-800/80'
              }`}
              title="Ikuti Setelan Tema Sistem Perangkat"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Sistem</span>
            </button>
          </div>
        </div>

        {/* 2. Status Notifikasi Telegram Bot (100% Saluran Notifikasi Utama) */}
        <div className="flex flex-col justify-between gap-2 p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-800/60 dark:border-slate-700/60 dark:text-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
              <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Notifikasi Telegram
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                telegramChatId.trim()
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
            >
              {telegramChatId.trim() ? 'Terhubung' : 'Belum Konek'}
            </span>
          </div>

          {telegramChatId.trim() ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleOpenTelegramBot}
                className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-600/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Buka percakapan Bot Telegram"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Buka Bot</span>
              </button>
              <button
                type="button"
                disabled={isTestingTelegram}
                onClick={handleTestTelegram}
                className="py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800/60 flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                title="Kirim pesan uji coba peringatan ke Telegram"
              >
                {isTestingTelegram ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-600 dark:text-blue-400" />
                ) : (
                  <Send className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                )}
                <span>Uji</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('telegram')}
              className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              title="Hubungkan akun dengan bot Telegram untuk menerima notifikasi hujan instan"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Hubungkan Bot Telegram</span>
            </button>
          )}
        </div>

        {/* 3. Keluar Akun (Logout) */}
        <div className="flex flex-col justify-between gap-2 p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-800/60 dark:border-slate-700/60 dark:text-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 truncate text-slate-700 dark:text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">{user?.name || 'Pengguna'}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[90px]">
              @{user?.username || 'user'}
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 border border-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:border-red-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Keluar dari sesi akun saat ini"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun (Logout)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Tabs + Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Navigation Tabs */}
        <div className="md:col-span-4 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800/60 dark:text-blue-400 font-semibold shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900/60 dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800/60'
            }`}
          >
            <div
              className={`p-2 rounded-xl ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block text-slate-900 dark:text-slate-100">Profil & Akun</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Nama lengkap & identitas</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'password'
                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800/60 dark:text-blue-400 font-semibold shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900/60 dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800/60'
            }`}
          >
            <div
              className={`p-2 rounded-xl ${
                activeTab === 'password'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <Key className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block text-slate-900 dark:text-slate-100">Keamanan Kata Sandi</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Ganti sandi & indikator kekuatan</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('telegram')}
            className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'telegram'
                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800/60 dark:text-blue-400 font-semibold shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900/60 dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800/60'
            }`}
          >
            <div
              className={`p-2 rounded-xl ${
                activeTab === 'telegram'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <Send className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block text-slate-900 dark:text-slate-100">Integrasi Telegram</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Notifikasi bot & uji coba kirim</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'preferences'
                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800/60 dark:text-blue-400 font-semibold shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900/60 dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800/60'
            }`}
          >
            <div
              className={`p-2 rounded-xl ${
                activeTab === 'preferences'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block text-slate-900 dark:text-slate-100">Alarm & Tampilan</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Nada dering, volume & tema</span>
            </div>
          </button>
        </div>

        {/* Right Tab Content Panel */}
        <div className="md:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs dark:bg-slate-900/80 dark:border-slate-800/90 dark:text-white backdrop-blur-xl">
          {/* TAB 1: PROFIL & AKUN */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profil Pengguna</h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Perbarui informasi nama tampilan dan nama pengguna (username) akun Anda.
                </p>
              </div>

              {profileMsg && (
                <div
                  className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-3 ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                  }`}
                >
                  {profileMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 transition-colors text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Username Akun
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder="budisantoso"
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 transition-colors text-sm font-mono"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                    Minimal 3 karakter tanpa spasi. Digunakan untuk login ke antarmuka Rintik.
                  </span>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
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
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ganti Kata Sandi</h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Amankan akses akun Anda dengan kata sandi yang kuat dan tidak mudah ditebak.
                </p>
              </div>

              {passwordMsg && (
                <div
                  className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-3 ${
                    passwordMsg.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                  }`}
                >
                  {passwordMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSavePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Kata Sandi Lama / Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi saat ini"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-600 text-sm font-medium pr-11 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 8 karakter (huruf & angka)"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-600 text-sm font-medium pr-11 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-600 text-sm font-medium pr-11 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
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
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Integrasi Bot Telegram</h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Terima pemberitahuan peringatan hujan dan penarikan jemuran otomatis langsung ke ponsel Anda.
                </p>
              </div>

              {telegramMsg && (
                <div
                  className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-3 ${
                    telegramMsg.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                  }`}
                >
                  {telegramMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                  )}
                  <span>{telegramMsg.text}</span>
                </div>
              )}

              {/* 1-Click Bot Linking Card */}
              <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/60 space-y-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-sm">
                  <Send className="w-4 h-4" />
                  <span>Hubungkan 1-Klik Otomatis</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Buka bot resmi Rintik di Telegram melalui tombol di bawah, lalu tekan tombol{' '}
                  <strong className="text-blue-700 dark:text-blue-400 font-bold">START</strong>. Akun Anda akan otomatis
                  terhubung seketika.
                </p>
                <button
                  type="button"
                  onClick={handleOpenTelegramBot}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka Bot @{telegramBotUsername}</span>
                </button>
              </div>

              {/* Manual Chat ID Input Form */}
              <form onSubmit={handleSaveTelegram} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Telegram Chat ID Akun Anda
                  </label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="Contoh: 123456789"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-600 text-sm font-mono dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 transition-colors"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                    Chat ID akun personal atau ID grup Telegram tempat bot ditambahkan.
                  </span>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={isTestingTelegram || !telegramChatId.trim()}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{isTestingTelegram ? 'Mengirim Tes...' : 'Uji Kirim Pesan'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingTelegram}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
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
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Preferensi Alarm Hujan & Tampilan</h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Sesuaikan jenis bunyi peringatan, volume audio, dan mode warna antarmuka.
                </p>
              </div>

              {prefMsg && (
                <div
                  className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-3 ${
                    prefMsg.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  <span>{prefMsg.text}</span>
                </div>
              )}

              {/* Alarm Tone Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Pilihan Nada Dering Alarm Hujan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALARM_TONE_OPTIONS.map((tone) => {
                    const isSelected = alarmTone === tone.id;
                    return (
                      <div
                        key={tone.id}
                        onClick={() => setAlarmTone(tone.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 dark:bg-blue-950/30 dark:border-blue-500 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/60 dark:border-slate-700/80 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-bold text-sm ${
                              isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {tone.label}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                          {tone.description}
                        </p>

                        {/* Tone Preview Button */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={tone.id === 'custom' && !customAlarmUrl}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePreview(tone.id);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-transparent inline-flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {isPreviewPlaying && alarmTone === tone.id ? (
                              <>
                                <Square className="w-3 h-3 text-red-500 fill-red-500" />
                                <span>Hentikan</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 text-blue-600 fill-blue-600 dark:text-blue-400 dark:fill-blue-400" />
                                <span>Dengarkan Bunyi</span>
                              </>
                            )}
                          </button>

                          {tone.id === 'custom' && customAlarmUrl && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span>Tersimpan</span>
                            </span>
                          )}
                        </div>

                        {/* Dedicated Upload Area for Custom Tone (REQ-FE-13) */}
                        {tone.id === 'custom' && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-2.5"
                          >
                            {uploadError && (
                              <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{uploadError}</span>
                              </div>
                            )}

                            {customAlarmUrl && (
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 dark:bg-slate-900/60 dark:border-slate-700 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 truncate pr-2">
                                  <Music className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                  <span className="text-slate-700 dark:text-slate-300 font-mono truncate text-[11px]">
                                    {customAlarmUrl.split('/').pop() || 'custom_alarm_audio'}
                                  </span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 font-bold shrink-0">
                                  Offline Ready
                                </span>
                              </div>
                            )}

                            <label className="block cursor-pointer">
                              <input
                                type="file"
                                accept=".mp3,.wav,.ogg,.m4a,.aac,.webm,audio/*"
                                onChange={handleUploadCustomAudio}
                                disabled={isUploadingAudio}
                                className="hidden"
                              />
                              <div className="px-3.5 py-2.5 rounded-xl border border-dashed border-blue-300 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 dark:border-blue-500/50 dark:hover:border-blue-400 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 text-center transition-colors flex items-center justify-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
                                {isUploadingAudio ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                                    <span>Mengunggah ({uploadProgress ?? 0}%)...</span>
                                  </>
                                ) : (
                                  <>
                                    <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span>
                                      {customAlarmUrl ? 'Ganti Berkas Audio' : 'Unggah Audio Kustom (Maks. 5MB)'}
                                    </span>
                                  </>
                                )}
                              </div>
                            </label>

                            {uploadProgress !== null && (
                              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            )}

                            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block">
                              Mendukung .mp3, .wav, .ogg, .m4a. Disimpan di VPS &amp; dicache otomatis ke
                              peramban agar siap berbunyi meski offline saat badai.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Volume Slider */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    {alarmVolume === 0 ? (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                    Tingkat Volume Alarm
                  </span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 text-sm font-black">{alarmVolume}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={alarmVolume}
                  onChange={(e) => setAlarmVolume(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Telegram Bot Notification Guidance Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">
                        Peringatan Hujan Otomatis via Telegram
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          telegramChatId.trim()
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {telegramChatId.trim() ? 'Bot Terhubung' : 'Belum Terhubung'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 block leading-relaxed">
                      Peringatan hujan dikirimkan secara instan ke Telegram Anda tanpa kendala izin peramban atau mode hemat daya ponsel.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('telegram')}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800/60 transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{telegramChatId.trim() ? 'Kelola Bot' : 'Hubungkan'}</span>
                  </button>
                </div>

                {telegramChatId.trim() && (
                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">
                      Chat ID terhubung: <code className="font-mono text-blue-700 dark:text-blue-300 font-bold">{telegramChatId}</code>
                    </span>
                    <button
                      type="button"
                      disabled={isTestingTelegram}
                      onClick={handleTestTelegram}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-600 inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {isTestingTelegram ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Uji Kirim Pesan Telegram</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Continuous Persistent Alarm Toggle Switch */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/80 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">
                    Alarm Berdering Terus-Menerus
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 block">
                    Alarm akan terus berdering tanpa henti layaknya panggilan masuk darurat sampai Anda
                    menekan tombol &quot;Matikan Alarm&quot;.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setContinuousAlarm(!continuousAlarm)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors relative shrink-0 cursor-pointer ${
                    continuousAlarm ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
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
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/80 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">Tema Antarmuka</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 block">
                    Mode tema aktif: <strong className="text-blue-600 dark:text-blue-400 uppercase font-bold">{theme}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-600 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <>
                      <Moon className="w-4 h-4 text-blue-500" />
                      <span>Mode Gelap</span>
                    </>
                  ) : theme === 'light' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Mode Terang</span>
                    </>
                  ) : (
                    <>
                      <Laptop className="w-4 h-4 text-slate-500" />
                      <span>Sistem</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
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
