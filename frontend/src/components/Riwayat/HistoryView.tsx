import React, { useState } from 'react';
import {
  History,
  Download,
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
} from 'lucide-react';
import { Peristiwa, JenisPeristiwa, Perangkat } from '../../types/iot';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Badge } from '../Common/Badge';

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
  const [filterType, setFilterType] = useState<string>('all');

  const filteredEvents = events.filter((ev) => {
    if (filterType === 'all') return true;
    return ev.jenis === filterType;
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

  // Export CSV
  const handleExportCSV = () => {
    if (events.length === 0) return;
    const header = 'Waktu,Timestamp_MS,Perangkat_ID,Jenis_Event,Keterangan_Data,Sumber\r\n';
    const rows = events.map((e) => {
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

  // Export JSON
  const handleExportJSON = () => {
    if (events.length === 0) return;
    const exportData = {
      app: 'HujanPantau',
      exportTs: Date.now(),
      attribution: 'Sumber data cuaca: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)',
      device: {
        id: device.deviceId,
        name: device.nama,
        adm4: device.lokasiAdm4,
      },
      events,
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
              Catatan kejadian hujan, online/offline, dan boot disimpan lokal di browser (maks 200)
            </p>
          </div>

          {/* Export buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              disabled={events.length === 0}
              className="gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
              <span>Ekspor CSV</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportJSON}
              disabled={events.length === 0}
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

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-garis">
          <span className="text-xs font-semibold text-teks-sekunder flex items-center gap-1 mr-2 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: 'all', label: `Semua (${events.length})` },
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

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card className="p-12 text-center text-teks-sekunder space-y-2">
          <History className="w-10 h-10 opacity-30 mx-auto" />
          <h3 className="text-sm font-semibold text-teks-utama">Belum Ada Riwayat Peristiwa</h3>
          <p className="text-xs max-w-sm mx-auto leading-relaxed">
            Peristiwa seperti transisi hujan, online/offline, atau reboot akan dicatat di sini secara otomatis.
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredEvents.slice().reverse().map((event, idx) => {
            const meta = getEventMeta(event.jenis);
            const Icon = meta.icon;
            const dateObj = new Date(event.ts);
            const timeStr = dateObj.toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            const dateStr = dateObj.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
            });

            return (
              <Card
                key={`${event.ts}-${idx}`}
                className="p-3.5 md:p-4 flex items-start gap-3.5 transition-all hover:border-garis/90"
              >
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    meta.color === 'hujan'
                      ? 'bg-cyan-500/15 text-cyan-500'
                      : meta.color === 'kering'
                      ? 'bg-blue-500/15 text-blue-500'
                      : meta.color === 'sukses'
                      ? 'bg-green-500/15 text-green-500'
                      : meta.color === 'bahaya'
                      ? 'bg-red-500/15 text-red-500'
                      : 'bg-kartu-muted text-teks-sekunder'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <h4 className="text-sm font-bold text-teks-utama">{meta.label}</h4>
                    <span className="text-[11px] font-mono text-teks-sekunder">
                      {dateStr} • {timeStr} WIB
                    </span>
                  </div>

                  <p className="text-xs text-teks-sekunder mt-0.5 leading-relaxed">{meta.desc}</p>

                  {/* Additional payload data pills */}
                  {event.data && Object.keys(event.data).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-garis/50">
                      {Object.entries(event.data).map(([k, v]) => (
                        <span
                          key={k}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-kartu-muted border border-garis/70 text-teks-sekunder"
                        >
                          {k}: <strong>{String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Badge variant={meta.color} className="shrink-0 hidden sm:inline-flex">
                  {event.jenis}
                </Badge>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
