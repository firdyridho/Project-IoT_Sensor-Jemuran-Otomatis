import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Trash2,
  Check,
  Server,
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
} from 'lucide-react';
import { Perangkat } from '../../types/iot';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Badge } from '../Common/Badge';
import { simulator } from '../../services/simulator';

interface DeviceViewProps {
  devices: Perangkat[];
  activeDevice: Perangkat;
  onSelectDevice: (deviceId: string) => void;
  onAddDevice: (newDevice: Perangkat) => void;
  onDeleteDevice: (deviceId: string) => void;
  theme: 'light' | 'dark' | 'system';
  onChangeTheme: (theme: 'light' | 'dark' | 'system') => void;
  onClearStorage: () => void;
  isSimulating: boolean;
  onToggleSimulator: () => void;
}

export const DeviceView: React.FC<DeviceViewProps> = ({
  devices,
  activeDevice,
  onSelectDevice,
  onAddDevice,
  onDeleteDevice,
  theme,
  onChangeTheme,
  onClearStorage,
  isSimulating,
  onToggleSimulator,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formId, setFormId] = useState('');
  const [formBroker, setFormBroker] = useState('wss://test.mosquitto.org:8081/mqtt');
  const [formAdm4, setFormAdm4] = useState('31.71.03.1001');
  const [formError, setFormError] = useState('');

  // Simulator controls
  const [simMode, setSimMode] = useState<'dry' | 'light_rain' | 'heavy_rain'>('dry');
  const [simOnline, setSimOnline] = useState(true);

  const handleSimModeChange = (mode: 'dry' | 'light_rain' | 'heavy_rain') => {
    setSimMode(mode);
    simulator.setRainMode(mode);
  };

  const handleSimOnlineChange = (online: boolean) => {
    setSimOnline(online);
    simulator.setOnline(online);
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
      brokerUrl: formBroker.trim(),
      lokasiAdm4: formAdm4.trim(),
      fwVersi: '1.0.0',
      lastSeenTs: Date.now(),
      online: true,
      ambangPct: 60,
    };

    onAddDevice(newDevice);
    setShowAddForm(false);
    setFormName('');
    setFormId('');
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-teks-sekunder mb-1">
                  URL Broker WSS
                </label>
                <input
                  type="text"
                  value={formBroker}
                  onChange={(e) => setFormBroker(e.target.value)}
                  className="w-full bg-kartu-muted border border-garis rounded-xl text-xs font-mono px-3 py-2 text-teks-utama focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-teks-sekunder mb-1">
                  Kode ADM4 Wilayah
                </label>
                <input
                  type="text"
                  value={formAdm4}
                  onChange={(e) => setFormAdm4(e.target.value)}
                  className="w-full bg-kartu-muted border border-garis rounded-xl text-xs font-mono px-3 py-2 text-teks-utama focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
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
                    {devices.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteDevice(device.deviceId)}
                        className="text-red-500 hover:text-red-600 p-2 min-w-9 min-h-9"
                        title="Hapus perangkat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-garis/60 text-[11px] text-teks-sekunder grid grid-cols-2 gap-2">
                  <div className="truncate">
                    <span>Broker: </span>
                    <strong className="text-teks-utama">{device.brokerUrl.split('//')[1]?.split(':')[0] || 'Mosquitto'}</strong>
                  </div>
                  <div className="truncate text-right">
                    <span>ADM4: </span>
                    <strong className="text-teks-utama font-mono">{device.lokasiAdm4}</strong>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3. Interactive ESP32 Simulator Panel */}
      <Card className="p-5 border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-transparent space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-500">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-teks-utama flex items-center gap-2">
                <span>Simulator Hardware ESP32</span>
                <Badge variant={isSimulating ? 'hujan' : 'netral'} dot>
                  {isSimulating ? 'Berjalan' : 'Nonaktif'}
                </Badge>
              </h3>
              <p className="text-xs text-teks-sekunder mt-0.5">
                Uji coba deteksi hujan, alarm audio, grafik realtime, dan LWT tanpa memerlukan mikrokontroler fisik
              </p>
            </div>
          </div>

          <Button
            variant={isSimulating ? 'secondary' : 'primary'}
            size="sm"
            onClick={onToggleSimulator}
            className="gap-2 shrink-0 self-start sm:self-auto"
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'Hentikan Simulator' : 'Nyalakan Simulator'}</span>
          </Button>
        </div>

        {isSimulating && (
          <div className="space-y-4 pt-3 border-t border-garis">
            <div>
              <label className="block text-xs font-semibold text-teks-sekunder mb-2">
                Simulasi Kondisi Sensor Cuaca:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSimModeChange('dry')}
                  className={`min-h-11 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                    simMode === 'dry'
                      ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30 shadow-xs'
                      : 'bg-kartu border-garis text-teks-sekunder hover:text-teks-utama'
                  }`}
                >
                  <SunMedium className="w-4 h-4 text-blue-500" />
                  <span>Kering (0–10%)</span>
                </button>

                <button
                  onClick={() => handleSimModeChange('light_rain')}
                  className={`min-h-11 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                    simMode === 'light_rain'
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/30 shadow-xs'
                      : 'bg-kartu border-garis text-teks-sekunder hover:text-teks-utama'
                  }`}
                >
                  <CloudDrizzle className="w-4 h-4 text-cyan-500" />
                  <span>Gerimis (40–55%)</span>
                </button>

                <button
                  onClick={() => handleSimModeChange('heavy_rain')}
                  className={`min-h-11 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                    simMode === 'heavy_rain'
                      ? 'bg-cyan-600/20 border-cyan-500 text-cyan-600 dark:text-cyan-300 ring-1 ring-cyan-500/40 shadow-xs font-bold'
                      : 'bg-kartu border-garis text-teks-sekunder hover:text-teks-utama'
                  }`}
                >
                  <CloudRain className="w-4 h-4 text-cyan-400 animate-bounce" />
                  <span>Hujan Lebat (80–95%)</span>
                </button>
              </div>
            </div>

            {/* Simulated Online/Offline Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-kartu border border-garis">
              <div>
                <span className="text-xs font-bold text-teks-utama">Status Daya/Koneksi ESP32</span>
                <p className="text-[11px] text-teks-sekunder">
                  Simulasikan perangkat mati tiba-tiba untuk memicu Last Will & Testament (LWT)
                </p>
              </div>
              <Button
                variant={simOnline ? 'secondary' : 'danger'}
                size="sm"
                onClick={() => handleSimOnlineChange(!simOnline)}
                className="text-xs"
              >
                {simOnline ? 'Matikan (Offline)' : 'Nyalakan Kembali'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 4. Tampilan & Pengaturan Umum */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-teks-sekunder uppercase tracking-wider">
          Pengaturan Aplikasi
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
