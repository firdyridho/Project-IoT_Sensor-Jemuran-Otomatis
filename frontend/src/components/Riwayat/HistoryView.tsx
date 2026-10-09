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
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  events,
  device,
  onClearEvents,
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
      <div className="flex items-center gap-2 border-b border-garis pb-2">
        <button
          onClick={() => setActiveSubTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeSubTab === 'events'
              ? 'bg-cyan-500 text-white shadow-md'
              : 'bg-kartu text-teks-sekunder hover:text-teks-utama border border-garis'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Log Peristiwa IoT</span>
          <span className="text-xs px-1.5 py-0.2 rounded-full bg-white/20">
            {events.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai-accuracy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeSubTab === 'ai-accuracy'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-kartu text-teks-sekunder hover:text-teks-utama border border-garis'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-indigo-300" />
          <span>Log Akurasi AI</span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-400/20">
            Cerdas
          </span>
        </button>
      </div>

      {/* Render Sub-Tab 2: AI Accuracy View (FE-07) */}
      {activeSubTab === 'ai-accuracy' && (
        <AIAccuracyView deviceId={device.deviceId} />
      )}

      {/* Render Sub-Tab 1: Log Peristiwa IoT & Sensor */}
      {activeSubTab === 'events' && (
        <>
          {/* Header and Actions */}
          <Card className="p-4 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                    <History className="w-5 h-5" />
                  </span>
                  <h2 className="text-lg font-bold text-teks-utama font-heading">
                    Riwayat & Log Peristiwa
                  </h2>
                </div>
                <p className="text-xs text-teks-sekunder mt-0.5">
                  Catatan kejadian hujan, online/offline, dan boot mikrokontroler jemuran
                </p>
              </div>

              {/* Export buttons (FE-08) */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={filteredEvents.length === 0}
                  className="gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
                  <span>Ekspor CSV</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportJSON}
                  disabled={filteredEvents.length === 0}
                  className="gap-1.5"
                >
                  <FileJson className="w-3.5 h-3.5 text-blue-500" />
                  <span>JSON</span>
                </Button>
                {events.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearEvents}
                    className="text-red-500 hover:text-red-600 gap-1"
                    title="Hapus riwayat lokal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Datepicker Range Filter (FE-09) */}
            <div className="p-3 rounded-2xl bg-latar border border-garis flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-teks-sekunder flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                  Rentang Tanggal:
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-kartu border border-garis text-teks-utama text-xs focus:outline-none focus:border-cyan-500"
                />
                <span className="text-teks-sekunder">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-kartu border border-garis text-teks-utama text-xs focus:outline-none focus:border-cyan-500"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="p-1 rounded-lg hover:bg-kartu-muted text-teks-sekunder hover:text-teks-utama transition-colors"
                    title="Reset Filter Tanggal"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="text-xs text-teks-sekunder font-mono">
                Menampilkan <strong className="text-teks-utama">{filteredEvents.length}</strong> dari {events.length} event
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-garis">
              <span className="text-xs font-semibold text-teks-sekunder flex items-center gap-1 mr-2 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Filter Event:
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
                  className={`min-h-9 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    filterType === f.id
                      ? 'bg-kartu-muted border-cyan-500/40 text-teks-utama border ring-1 ring-cyan-500/20'
                      : 'bg-kartu border-garis text-teks-sekunder border hover:text-teks-utama'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Event List */}
          {filteredEvents.length === 0 ? (
            <Card className="p-8 text-center text-teks-sekunder">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Tidak ada peristiwa tercatat</p>
              <p className="text-xs mt-1 opacity-70">
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

                return (
                  <Card
                    key={`${ev.deviceId}-${ev.ts}-${idx}`}
                    className="p-3.5 sm:p-4 hover:border-cyan-500/30 transition-all flex items-start gap-3.5"
                  >
                    <div className="p-2.5 rounded-2xl bg-latar border border-garis shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-cyan-400" />
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

                      <p className="text-xs text-teks-sekunder mt-0.5">
                        {meta.desc}
                      </p>

                      {ev.data && Object.keys(ev.data).length > 0 && (
                        <div className="mt-2 p-2 rounded-xl bg-latar border border-garis text-[11px] font-mono text-teks-sekunder flex flex-wrap gap-x-4 gap-y-1">
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
