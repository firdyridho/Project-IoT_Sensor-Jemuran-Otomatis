import React, { useState } from 'react';
import {
  History,
  Filter,
  CloudRain,
  Sun,
  Power,
  WifiOff,
  RefreshCw,
  CheckCircle,
  FileSpreadsheet,
  FileJson,
  Trash2,
  Calendar,
  BrainCircuit,
  RotateCcw,
} from 'lucide-react';
import { Peristiwa, JenisPeristiwa, Perangkat } from '../../types/iot';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Badge } from '../Common/Badge';
import { AIAccuracyView } from './AIAccuracyView';

interface HistoryViewProps {
  events: Peristiwa[];
  device: Perangkat;
  onClearEvents: () => void;
  backendUrl?: string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  events,
  device,
  onClearEvents,
  backendUrl,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'events' | 'ai-accuracy'>('events');
  const [filterType, setFilterType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Date filtering logic (FE-09)
  const filteredEvents = events.filter((ev) => {
    if (filterType !== 'all' && ev.jenis !== filterType) {
      return false;
    }

    if (startDate) {
      const startMs = new Date(startDate + 'T00:00:00').getTime();
      if (ev.ts < startMs) return false;
    }

    if (endDate) {
      const endMs = new Date(endDate + 'T23:59:59').getTime();
      if (ev.ts > endMs) return false;
    }

    return true;
  });

  const getEventMeta = (jenis: JenisPeristiwa) => {
    switch (jenis) {
      case 'rain_start':
        return {
          label: 'Hujan Terdeteksi',
          color: 'hujan' as const,
          icon: CloudRain,
          desc: 'Sensor mendeteksi basah melampaui ambang batas',
        };
      case 'rain_stop':
        return {
          label: 'Hujan Berhenti',
          color: 'kering' as const,
          icon: Sun,
          desc: 'Kondisi kembali kering (histeresis selesai)',
        };
      case 'device_boot':
        return {
          label: 'Sistem ESP32 Boot',
          color: 'netral' as const,
          icon: Power,
          desc: 'Mikrokontroler baru saja menyala / restart',
        };
      case 'wifi_fail':
        return {
          label: 'Koneksi WiFi Terputus',
          color: 'bahaya' as const,
          icon: WifiOff,
          desc: 'Gagal terhubung ke SSID jaringan lokal',
        };
      case 'mqtt_retry':
        return {
          label: 'Mencoba Reconnect Broker',
          color: 'peringatan' as const,
          icon: RefreshCw,
          desc: 'Percobaan menyambung kembali ke broker MQTT',
        };
      case 'device_online':
        return {
          label: 'Perangkat Online',
          color: 'sukses' as const,
          icon: CheckCircle,
          desc: 'Perangkat aktif dan mempublikasikan data',
        };
      case 'device_offline':
        return {
          label: 'Perangkat Offline',
          color: 'offline' as const,
          icon: WifiOff,
          desc: 'LWT diterima atau tidak ada kabar > 90s',
        };
      default:
        return {
          label: jenis,
          color: 'netral' as const,
          icon: History,
          desc: 'Peristiwa sistem',
        };
    }
  };

  // Export CSV (FE-08)
  const handleExportCSV = () => {
    if (filteredEvents.length === 0) return;
    const header = 'Waktu,Timestamp_MS,Perangkat_ID,Jenis_Event,Keterangan_Data,Sumber\r\n';
    const rows = filteredEvents.map((e) => {
      const d = new Date(e.ts).toISOString();
      const meta = JSON.stringify(e.data || {}).replace(/"/g, '""');
      return `"${d}",${e.ts},"${e.deviceId}","${e.jenis}","${meta}","HujanPantau & BMKG"`;
    });
    const blob = new Blob([header + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `riwayat-hujan-${device.deviceId}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON (FE-08)
  const handleExportJSON = () => {
    if (filteredEvents.length === 0) return;
    const exportData = {
      app: 'HujanPantau',
      exportTs: Date.now(),
      attribution: 'Sumber data cuaca: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)',
      device: {
        id: device.deviceId,
        name: device.nama,
        adm4: device.lokasiAdm4,
      },
      events: filteredEvents,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `riwayat-hujan-${device.deviceId}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* 1. Sub-Tab Switcher (FE-07: Tab Riwayat Log Akurasi AI) */}
      <div className="flex items-center gap-2 border-b border-garis pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('events')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'events'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 border border-cyan-400/40'
              : 'bg-kartu text-teks-sekunder hover:text-teks-utama border border-garis hover:bg-kartu-muted'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Log Peristiwa IoT</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
            {events.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai-accuracy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'ai-accuracy'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/40'
              : 'bg-kartu text-teks-sekunder hover:text-teks-utama border border-garis hover:bg-kartu-muted'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-indigo-300" />
          <span>Log Akurasi AI</span>
          <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-400/20">
            Cerdas
          </span>
        </button>
      </div>

      {/* Render Sub-Tab 2: AI Accuracy View (FE-07) */}
      {activeSubTab === 'ai-accuracy' && (
        <AIAccuracyView deviceId={device.deviceId} backendUrl={backendUrl} />
      )}

      {/* Render Sub-Tab 1: Log Peristiwa IoT & Sensor */}
      {activeSubTab === 'events' && (
        <>
          {/* Header and Actions with Modern Gradient */}
          <Card className="p-4 md:p-6 space-y-4 relative overflow-hidden">
            <div className="absolute -top-14 -right-14 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25">
                    <History className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-teks-utama font-heading tracking-tight leading-tight">
                      Riwayat & Log Peristiwa
                    </h2>
                    <p className="text-xs text-teks-sekunder mt-0.5">
                      Catatan kejadian hujan, online/offline, dan boot mikrokontroler jemuran
                    </p>
                  </div>
                </div>
              </div>

              {/* Export buttons (FE-08) with modern gradient touches */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={filteredEvents.length === 0}
                  className="gap-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Ekspor CSV</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportJSON}
                  disabled={filteredEvents.length === 0}
                  className="gap-1.5 bg-gradient-to-r from-sky-500/10 to-blue-500/10 hover:from-sky-500/20 hover:to-blue-500/20 border-sky-500/30 text-sky-600 dark:text-sky-400 font-bold"
                >
                  <FileJson className="w-3.5 h-3.5 text-sky-500" />
                  <span>JSON</span>
                </Button>
                {events.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearEvents}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-1 rounded-xl"
                    title="Hapus riwayat lokal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Datepicker Range Filter (FE-09) */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-kartu-muted/60 to-kartu-muted/30 border border-garis flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-teks-sekunder flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                  Rentang Tanggal:
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-kartu border border-garis text-teks-utama text-xs focus:outline-none focus:border-cyan-500 font-medium shadow-2xs"
                />
                <span className="text-teks-sekunder font-medium">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-kartu border border-garis text-teks-utama text-xs focus:outline-none focus:border-cyan-500 font-medium shadow-2xs"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="p-1.5 rounded-xl hover:bg-kartu-muted text-teks-sekunder hover:text-teks-utama transition-colors border border-garis/60"
                    title="Reset Filter Tanggal"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="text-xs text-teks-sekunder font-mono bg-kartu px-2.5 py-1 rounded-lg border border-garis">
                Menampilkan <strong className="text-cyan-500">{filteredEvents.length}</strong> dari {events.length} event
              </div>
            </div>

            {/* Filter Pills with Gradient Accent */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-garis">
              <span className="text-xs font-semibold text-teks-sekunder flex items-center gap-1 mr-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-cyan-500" /> Filter Event:
              </span>
              {[
                { id: 'all', label: `Semua` },
                { id: 'rain_start', label: 'Hujan Mulai' },
                { id: 'rain_stop', label: 'Hujan Selesai' },
                { id: 'device_online', label: 'Online' },
                { id: 'device_offline', label: 'Offline' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`min-h-9 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    filterType === f.id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm shadow-cyan-500/25 border border-cyan-400/40'
                      : 'bg-kartu border-garis text-teks-sekunder border hover:bg-kartu-muted hover:text-teks-utama'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Event List */}
          {filteredEvents.length === 0 ? (
            <Card className="p-8 text-center text-teks-sekunder border-dashed border-2 border-garis/80">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 w-fit mx-auto mb-3">
                <History className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-teks-utama">Tidak ada peristiwa tercatat</p>
              <p className="text-xs mt-1 text-teks-sekunder max-w-sm mx-auto">
                {filterType !== 'all' || startDate || endDate
                  ? 'Coba atur ulang filter pencarian Anda'
                  : 'Event hujan dan status koneksi perangkat akan otomatis muncul di sini'}
              </p>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {filteredEvents.map((ev, idx) => {
                const meta = getEventMeta(ev.jenis);
                const Icon = meta.icon;
                const d = new Date(ev.ts);
                const timeStr = d.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const dateStr = d.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                // Modern color styling based on event type
                const cardAccentClass =
                  ev.jenis === 'rain_start'
                    ? 'border-l-4 border-l-cyan-500 bg-gradient-to-r from-cyan-500/5 to-transparent'
                    : ev.jenis === 'rain_stop'
                    ? 'border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-500/5 to-transparent'
                    : ev.jenis === 'device_online'
                    ? 'border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-500/5 to-transparent'
                    : ev.jenis === 'device_offline' || ev.jenis === 'wifi_fail'
                    ? 'border-l-4 border-l-rose-500 bg-gradient-to-r from-rose-500/5 to-transparent'
                    : 'border-l-4 border-l-blue-400/50 bg-gradient-to-r from-blue-500/5 to-transparent';

                return (
                  <Card
                    key={`${ev.deviceId}-${ev.ts}-${idx}`}
                    className={`p-3.5 sm:p-4 hover:border-cyan-500/40 hover:translate-x-1 transition-all duration-200 flex items-start gap-3.5 shadow-2xs ${cardAccentClass}`}
                  >
                    <div className="p-2.5 rounded-2xl bg-kartu border border-garis shrink-0 mt-0.5 shadow-xs">
                      <Icon className="w-4 h-4 text-cyan-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-teks-utama">
                            {meta.label}
                          </h4>
                          <Badge variant={meta.color}>
                            {ev.jenis}
                          </Badge>
                        </div>
                        <span className="text-xs text-teks-sekunder font-mono">
                          {dateStr}, {timeStr}
                        </span>
                      </div>

                      <p className="text-xs text-teks-sekunder mt-1">
                        {meta.desc}
                      </p>

                      {ev.data && Object.keys(ev.data).length > 0 && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-latar border border-garis/80 text-[11px] font-mono text-teks-sekunder flex flex-wrap gap-x-4 gap-y-1">
                          {Object.entries(ev.data).map(([k, v]) => (
                            <span key={k}>
                              <strong className="text-teks-utama">{k}:</strong> {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
