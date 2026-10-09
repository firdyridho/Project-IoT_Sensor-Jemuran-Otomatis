import React, { useState } from 'react';
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
} from 'lucide-react';
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
    </div>
  );
};
