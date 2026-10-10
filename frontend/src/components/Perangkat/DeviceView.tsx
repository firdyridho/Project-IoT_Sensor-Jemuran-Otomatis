import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Plus,
  Trash2,
  Check,
  QrCode,
  Sliders,
  Moon,
  Sun,
  Laptop,
  AlertTriangle,
  Play,
  Pause,
  CloudRain,
  SunMedium,
  CloudDrizzle,
  Database,
  Pencil,
  X,
  Volume2,
  Bell,
  Send,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { weatherAudio } from '../../services/weatherAudio';
import { Notifications } from '../../services/notifications';
import { getDefaultBackendUrl } from '../../services/storage';
import { Perangkat } from '../../types/iot';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Badge } from '../Common/Badge';

interface DeviceViewProps {
  devices: Perangkat[];
  activeDevice: Perangkat;
  onSelectDevice: (deviceId: string) => void;
  onAddDevice: (newDevice: Perangkat) => void;
  onUpdateDevice: (updatedDevice: Perangkat) => void;
  onDeleteDevice: (deviceId: string) => void;
  theme: 'light' | 'dark' | 'system';
  onChangeTheme: (theme: 'light' | 'dark' | 'system') => void;
  onClearStorage: () => void;
}

export const DeviceView: React.FC<DeviceViewProps> = ({
  devices,
  activeDevice,
  onSelectDevice,
  onAddDevice,
  onUpdateDevice,
  onDeleteDevice,
  theme,
  onChangeTheme,
  onClearStorage,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Form states for Add Device (Simplified: No Mosquitto URL or ADM4 required)
  const [formName, setFormName] = useState('');
  const [formId, setFormId] = useState('');
  const [formAmbangPct, setFormAmbangPct] = useState(60);
  const [formError, setFormError] = useState('');

  // Form states for Edit Device
  const [editingDevice, setEditingDevice] = useState<Perangkat | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmbangPct, setEditAmbangPct] = useState(60);
  const [editError, setEditError] = useState('');

  // Alarm Ringtone State (FE-10)
  const [alarmSound, setAlarmSound] = useState<'sirine' | 'bell' | 'hujan'>(() => {
    return (localStorage.getItem('hujan.alarm.sound') as 'sirine' | 'bell' | 'hujan') || 'sirine';
  });
  const [alarmVolume, setAlarmVolume] = useState<number>(() => {
    const saved = localStorage.getItem('hujan.alarm.volume');
    return saved ? parseInt(saved, 10) : 75;
  });

  // Telegram Bot State (FE-11)
  const [telegramChatId, setTelegramChatId] = useState<string>(() => {
    return localStorage.getItem('hujan.telegram.chatId') || '';
  });
  const [botUsername, setBotUsername] = useState<string>('rintik_iot_bot');
  const [isBotConfigured, setIsBotConfigured] = useState<boolean>(true);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);

  // Ambil konfigurasi bot Telegram dari backend server
  useEffect(() => {
    const fetchTgConfig = async () => {
      try {
        const backendBase = getDefaultBackendUrl().replace(/\/+$/, '');
        const res = await fetch(`${backendBase}/api/telegram/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.botUsername) setBotUsername(data.botUsername);
          if (data.configured !== undefined) setIsBotConfigured(data.configured);
        }
      } catch {
        // Fallback default
      }
    };
    fetchTgConfig();
  }, []);

  const handleSaveAlarmSettings = (sound: 'sirine' | 'bell' | 'hujan', volume: number) => {
    setAlarmSound(sound);
    setAlarmVolume(volume);
    localStorage.setItem('hujan.alarm.sound', sound);
    localStorage.setItem('hujan.alarm.volume', String(volume));
  };

  const handlePreviewAlarm = () => {
    weatherAudio.previewAlarmSound(alarmSound, alarmVolume);
  };

  const handleOpenTelegramBot = () => {
    const pairUrl = `https://t.me/${botUsername}?start=pair_${encodeURIComponent(activeDevice.deviceId)}`;
    window.open(pairUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenUserInfoBot = () => {
    window.open('https://t.me/userinfobot', '_blank', 'noopener,noreferrer');
  };

  const handleSaveTelegramChatId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramChatId.trim()) return;

    setIsSavingTelegram(true);
    try {
      const backendBase = getDefaultBackendUrl().replace(/\/+$/, '');
      const res = await fetch(`${backendBase}/api/devices/${encodeURIComponent(activeDevice.deviceId)}/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: telegramChatId.trim() }),
      });

      localStorage.setItem('hujan.telegram.chatId', telegramChatId.trim());

      if (res.ok) {
        Notifications.addToast({
          id: 'tg-save-' + Date.now(),
          type: 'success',
          title: 'ID Telegram Terhubung',
          message: `ID Telegram "${telegramChatId.trim()}" berhasil disimpan ke server untuk ${activeDevice.nama}.`,
          timestamp: Date.now(),
        });
      } else {
        Notifications.addToast({
          id: 'tg-save-loc-' + Date.now(),
          type: 'info',
          title: 'Disimpan di Peramban',
          message: `ID Telegram "${telegramChatId.trim()}" disimpan di perangkat ini.`,
          timestamp: Date.now(),
        });
      }
    } catch {
      localStorage.setItem('hujan.telegram.chatId', telegramChatId.trim());
      Notifications.addToast({
        id: 'tg-save-fallback-' + Date.now(),
        type: 'info',
        title: 'Disimpan di Peramban',
        message: `ID Telegram "${telegramChatId.trim()}" disimpan di peramban.`,
        timestamp: Date.now(),
      });
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramChatId.trim()) {
      Notifications.addToast({
        id: 'tg-err-' + Date.now(),
        type: 'warning',
        title: 'Chat ID Belum Diisi',
        message: 'Silakan masukkan Chat ID Telegram Anda atau gunakan tombol "Hubungkan ke Telegram".',
        timestamp: Date.now(),
      });
      return;
    }

    setIsSendingTelegram(true);
    try {
      const backendBase = getDefaultBackendUrl().replace(/\/+$/, '');
      const res = await fetch(`${backendBase}/api/telegram/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: telegramChatId.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        Notifications.addToast({
          id: 'tg-ok-' + Date.now(),
          type: 'success',
          title: 'Uji Coba Telegram Berhasil',
          message: 'Pesan bot pengujian berhasil dikirim ke akun Telegram Anda! Periksa aplikasi Telegram Anda.',
          timestamp: Date.now(),
        });
      } else {
        Notifications.addToast({
          id: 'tg-err-' + Date.now(),
          type: 'danger',
          title: 'Gagal Mengirim Telegram',
          message: data.error || 'Pastikan Anda sudah menekan tombol START pada bot Rintik di Telegram.',
          timestamp: Date.now(),
        });
      }
    } catch (err: any) {
      Notifications.addToast({
        id: 'tg-mock-' + Date.now(),
        type: 'info',
        title: 'Gagal Menghubungi Server',
        message: err.message || 'Tidak dapat terhubung ke endpoint backend Telegram.',
        timestamp: Date.now(),
      });
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const handleCreateRandomId = () => {
    const hex = Math.random().toString(16).slice(2, 14).padEnd(12, '0');
    setFormId(`hs-${hex}`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanId = formId.trim().toLowerCase();
    // Validate hs- + 12 hex chars
    if (!/^hs-[0-9a-f]{12}$/.test(cleanId)) {
      setFormError('ID Perangkat harus berformat hs- diikuti 12 karakter hex (contoh: hs-8f3a1c9d2b70)');
      return;
    }

    if (!formName.trim()) {
      setFormError('Nama perangkat tidak boleh kosong');
      return;
    }

    const newDevice: Perangkat = {
      deviceId: cleanId,
      nama: formName.trim(),
      brokerUrl: 'wss://43-133-136-149.sslip.io/ws',
      lokasiAdm4: '31.71.03.1001',
      fwVersi: '1.1.0',
      lastSeenTs: 0,
      online: false,
      ambangPct: formAmbangPct,
    };

    onAddDevice(newDevice);
    setShowAddForm(false);
    setFormName('');
    setFormId('');
    setFormAmbangPct(60);
  };

  const handleStartEdit = (device: Perangkat) => {
    setEditingDevice(device);
    setEditName(device.nama);
    setEditAmbangPct(device.ambangPct || 60);
    setEditError('');
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingDevice(null);
    setEditError('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;
    setEditError('');

    if (!editName.trim()) {
      setEditError('Nama perangkat tidak boleh kosong');
      return;
    }

    const updated: Perangkat = {
      ...editingDevice,
      nama: editName.trim(),
      ambangPct: Number(editAmbangPct) || 60,
    };

    onUpdateDevice(updated);
    setEditingDevice(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <Card className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                <Cpu className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-teks-utama font-heading">
                Kelola Perangkat & Pengaturan
              </h2>
            </div>
            <p className="text-xs text-teks-sekunder mt-0.5">
              Konfigurasi perangkat ESP32, broker MQTT, emulator pengujian, dan tema tampilan
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              handleCreateRandomId();
              setShowAddForm(true);
            }}
            className="gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Perangkat</span>
          </Button>
        </div>
      </Card>

      {/* Add Device Modal / Collapsible Form */}
      {showAddForm && (
        <Card className="p-5 border-2 border-cyan-500/40 bg-kartu space-y-4">
          <div className="flex items-center justify-between border-b border-garis pb-2">
            <h3 className="font-bold text-sm text-teks-utama">Daftarkan Perangkat ESP32 Baru</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs text-teks-sekunder hover:text-teks-utama"
            >
              Batal
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-teks-sekunder mb-1">
                Nama Perangkat
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Jemuran Belakang Rumah"
                className="w-full bg-kartu-muted border border-garis rounded-xl text-xs px-3 py-2 text-teks-utama focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-teks-sekunder">
                  Device ID (Format hs-12hex)
                </label>
                <button
                  type="button"
                  onClick={handleCreateRandomId}
                  className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  Acak ID
                </button>
              </div>
              <input
                type="text"
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                placeholder="hs-xxxxxxxxxxxx"
                pattern="^hs-[0-9a-fA-F]{12}$"
                className="w-full bg-kartu-muted border border-garis rounded-xl text-xs font-mono px-3 py-2 text-teks-utama focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-teks-sekunder">
                  Ambang Sensitivitas Hujan (% Basah)
                </label>
                <span className="text-xs font-bold font-mono text-cyan-600 dark:text-cyan-400">
                  {formAmbangPct}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="90"
                step="5"
                value={formAmbangPct}
                onChange={(e) => setFormAmbangPct(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-teks-sekunder mt-0.5">
                <span>Lebih Cepat Tutup (20%)</span>
                <span>Standar (60%)</span>
                <span>Hujan Deras (90%)</span>
              </div>
            </div>

            {formError && (
              <p className="text-xs text-red-500 font-medium">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Simpan Perangkat
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Edit Device Form */}
      {editingDevice && (
        <Card className="p-5 border-2 border-blue-500/50 bg-kartu space-y-4">
          <div className="flex items-center justify-between border-b border-garis pb-2">
            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-blue-500" />
              <h3 className="font-bold text-sm text-teks-utama">
                Edit Perangkat: <span className="font-mono text-blue-600 dark:text-blue-400">{editingDevice.deviceId}</span>
              </h3>
            </div>
            <button
              onClick={handleCancelEdit}
              className="text-xs text-teks-sekunder hover:text-teks-utama p-1 rounded-lg"
              aria-label="Tutup edit"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-teks-sekunder mb-1">
                Nama Perangkat
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-kartu-muted border border-garis rounded-xl text-xs px-3 py-2 text-teks-utama focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-teks-sekunder">
                  Ambang Deteksi Hujan (% Basah)
                </label>
                <span className="text-xs font-bold font-mono text-cyan-600 dark:text-cyan-400">
                  {editAmbangPct}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="90"
                step="5"
                value={editAmbangPct}
                onChange={(e) => setEditAmbangPct(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-teks-sekunder mt-0.5">
                <span>Lebih Sensitif (20%)</span>
                <span>Standar (60%)</span>
                <span>Kurang Sensitif (90%)</span>
              </div>
            </div>

            {editError && (
              <p className="text-xs text-red-500 font-medium">{editError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                Batal
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 2. Device List Cards */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-teks-sekunder uppercase tracking-wider">
          Daftar Perangkat Terdaftar ({devices.length} / 5)
        </h3>

        {devices.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-2 border-garis/80">
            <Cpu className="w-10 h-10 text-teks-tertier mx-auto mb-2 opacity-50" />
            <h4 className="font-semibold text-sm text-teks-utama">Belum Ada Perangkat Terdaftar</h4>
            <p className="text-xs text-teks-sekunder mt-1 max-w-sm mx-auto mb-4">
              Semua perangkat telah dihapus. Klik tombol di bawah untuk mendaftarkan unit ESP32 baru.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Daftarkan Perangkat Baru
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {devices.map((device) => {
              const isSelected = activeDevice.deviceId === device.deviceId;

              return (
                <Card
                  key={device.deviceId}
                  className={`p-4 transition-all relative ${
                    isSelected
                      ? 'border-2 border-blue-500/70 bg-blue-500/5'
                      : 'hover:border-garis/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-teks-utama truncate">
                          {device.nama}
                        </h4>
                        {isSelected && (
                          <Badge variant="kering" className="text-[10px]">
                            Aktif
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-mono text-teks-sekunder truncate">
                        {device.deviceId}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isSelected && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onSelectDevice(device.deviceId)}
                          className="text-xs"
                        >
                          Pilih
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(device)}
                        className="text-blue-500 hover:text-blue-600 p-2 min-w-9 min-h-9"
                        title="Edit perangkat"
                        aria-label={`Edit ${device.nama}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteDevice(device.deviceId)}
                        className="text-red-500 hover:text-red-600 p-2 min-w-9 min-h-9"
                        title="Hapus perangkat"
                        aria-label={`Hapus ${device.nama}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-garis/60 text-[11px] text-teks-sekunder grid grid-cols-3 gap-2">
                    <div className="truncate">
                      <span>Server: </span>
                      <strong className="text-cyan-600 dark:text-cyan-400 font-medium">Cloud VPS</strong>
                    </div>
                    <div className="truncate text-center">
                      <span>Sensitivitas: </span>
                      <strong className="text-teks-utama font-mono">{device.ambangPct || 60}%</strong>
                    </div>
                    <div className="truncate text-right">
                      <span>Koneksi: </span>
                      <strong className="text-emerald-500 font-medium">Realtime</strong>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Tampilan & Preferensi */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-teks-sekunder uppercase tracking-wider">
          Preferensi & Tampilan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Theme switcher */}
          <Card className="p-4 space-y-3">
            <h4 className="font-bold text-sm text-teks-utama">Tema Tampilan</h4>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'light', label: 'Terang', icon: Sun },
                  { id: 'dark', label: 'Gelap', icon: Moon },
                  { id: 'system', label: 'Sistem', icon: Laptop },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onChangeTheme(t.id)}
                    className={`min-h-11 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      isSelected
                        ? 'bg-kartu-muted border-cyan-500 text-teks-utama ring-1 ring-cyan-500/20'
                        : 'bg-kartu border-garis text-teks-sekunder hover:text-teks-utama'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Storage & Clear Cache */}
          <Card className="p-4 space-y-3">
            <h4 className="font-bold text-sm text-teks-utama">Penyimpanan Lokal</h4>
            <p className="text-xs text-teks-sekunder leading-relaxed">
              Semua telemetri, log peristiwa, dan cache BMKG disimpan di localStorage browser tanpa pengiriman ke cloud.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClearStorage}
              className="text-red-500 hover:text-red-600 gap-1.5 text-xs w-full"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Bersihkan Cache & Reset Data</span>
            </Button>
          </Card>
        </div>
      </section>

      {/* 4. Pengaturan Nada Dering Alarm Hujan (FE-10) */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-teks-sekunder uppercase tracking-wider">
          Alarm & Peringatan Audio (FE-10)
        </h3>

        <Card className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-garis pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                  <Bell className="w-5 h-5" />
                </span>
                <h4 className="font-bold text-sm text-teks-utama">
                  Nada Dering Alarm Deteksi Hujan
                </h4>
              </div>
              <p className="text-xs text-teks-sekunder mt-0.5">
                Pilih suara peringatan instan saat mikrokontroler mendeteksi tetesan air hujan
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handlePreviewAlarm}
              className="gap-1.5 self-start sm:self-auto"
            >
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Putar Contoh Suara</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'sirine' as const, label: 'Nada Sirine Ringan', desc: 'Sinyal frekuensi siaga cepat' },
              { id: 'bell' as const, label: 'Bell Ding Lembut', desc: 'Lonceng harmonis 2-nada' },
              { id: 'hujan' as const, label: 'Suara Desir Hujan', desc: 'Desir ambient rintik air' },
            ].map((snd) => (
              <button
                key={snd.id}
                type="button"
                onClick={() => handleSaveAlarmSettings(snd.id, alarmVolume)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  alarmSound === snd.id
                    ? 'bg-kartu-muted border-cyan-500 text-teks-utama ring-1 ring-cyan-500/20'
                    : 'bg-kartu border-garis text-teks-sekunder hover:text-teks-utama'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-teks-utama">{snd.label}</span>
                  {alarmSound === snd.id && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-teks-sekunder mt-1">{snd.desc}</p>
              </button>
            ))}
          </div>

          {/* Volume Slider */}
          <div className="pt-2 border-t border-garis flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Volume2 className="w-4 h-4 text-teks-sekunder" />
              <span className="font-semibold text-teks-utama">Tingkat Volume:</span>
              <span className="font-mono text-cyan-400 font-bold">{alarmVolume}%</span>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="range"
                min="10"
                max="100"
                value={alarmVolume}
                onChange={(e) => handleSaveAlarmSettings(alarmSound, parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </Card>
      </section>

      {/* 5. Integrasi Bot Telegram (FE-11) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-teks-sekunder uppercase tracking-wider">
            Integrasi Notifikasi Bot Telegram (FE-11)
          </h3>
          {telegramChatId ? (
            <Badge variant="sukses" className="text-[10px] gap-1 font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Terhubung (ID: {telegramChatId})</span>
            </Badge>
          ) : (
            <Badge variant="netral" className="text-[10px]">
              Belum Terhubung
            </Badge>
          )}
        </div>

        <Card className="p-4 md:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-garis pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                  <MessageSquare className="w-5 h-5" />
                </span>
                <h4 className="font-bold text-sm text-teks-utama">
                  Notifikasi Darurat via Telegram Bot
                </h4>
              </div>
              <p className="text-xs text-teks-sekunder mt-0.5">
                Dapatkan pesan peringatan instan di HP saat jemuran otomatis ditarik kanopi akibat hujan
              </p>
            </div>
          </div>

          {/* METODE 1: CARA TERCEPAT 1-KLIK (SANGAT USER-FRIENDLY) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 border border-sky-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px] font-black uppercase tracking-wider text-sky-400">
                  Cara Tercepat & Praktis (1-Klik)
                </span>
              </div>
              <h5 className="font-bold text-sm text-teks-utama">
                Hubungkan Otomatis ke Bot Rintik
              </h5>
              <p className="text-xs text-teks-sekunder leading-relaxed max-w-xl">
                Cukup klik tombol di samping untuk membuka bot di Telegram, lalu tekan tombol <strong>START</strong>. Akun Anda akan otomatis terhubung seketika tanpa perlu salin-tempel token atau kode rumit!
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleOpenTelegramBot}
              className="shrink-0 gap-2 whitespace-nowrap shadow-lg shadow-sky-500/20 font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white"
            >
              <Send className="w-4 h-4" />
              <span>Hubungkan ke Telegram</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </Button>
          </div>

          {/* METODE 2: ATAU MASUKKAN CHAT ID SECARA MANUAL */}
          <form onSubmit={handleSaveTelegramChatId} className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-teks-utama">
                Atau Masukkan ID Obrolan Telegram (Chat ID) Manual:
              </label>
              <button
                type="button"
                onClick={handleOpenUserInfoBot}
                className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>Cek Chat ID di @userinfobot</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="Contoh: 123456789 atau -100xxxxxxxxxx"
                className="flex-1 px-3 py-2.5 rounded-xl bg-latar border border-garis text-teks-utama text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSavingTelegram}
                className="gap-1.5 whitespace-nowrap font-bold"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSavingTelegram ? 'Menyimpan...' : 'Simpan ID'}</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleTestTelegram}
                disabled={isSendingTelegram}
                className="gap-1.5 whitespace-nowrap font-bold"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTelegram ? 'Mengirim...' : 'Kirim Uji Coba'}</span>
              </Button>
            </div>

            <p className="text-[11px] text-teks-sekunder leading-relaxed">
              💡 <em>Catatan:</em> Token bot sudah dikonfigurasi dan disimpan aman di server backend aplikasi. Pengguna <strong>tidak perlu lagi repot mengisi token bot</strong> apa pun.
            </p>
          </form>
        </Card>
      </section>
    </div>
  );
};
