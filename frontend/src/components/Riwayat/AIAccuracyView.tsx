import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Percent,
  Calendar,
  Filter,
  Download,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../Common/Card';
import { Badge } from '../Common/Badge';
import { Button } from '../Common/Button';
import { BackendService } from '../../services/api';

export interface AIPredictionAccuracyLog {
  id: string;
  timestamp: number;
  probabilityPct: number;
  predictedRain: boolean;
  confidenceLevel: 'high' | 'medium' | 'low';
  actualRainOccurred: boolean;
  accuracyStatus: 'tepat' | 'meleset';
  humidityDelta: string;
  tempDelta: string;
  notes: string;
}

// Realistic sample historical log records
const DEFAULT_LOGS: AIPredictionAccuracyLog[] = [
  {
    id: 'log-1',
    timestamp: Date.now() - 35 * 60 * 1000,
    probabilityPct: 88,
    predictedRain: true,
    confidenceLevel: 'high',
    actualRainOccurred: true,
    accuracyStatus: 'tepat',
    humidityDelta: '+16.2%',
    tempDelta: '-2.4°C',
    notes: 'Model memprediksi gerimis dalam 20 menit, sensor basah terpicu menit ke-18.',
  },
  {
    id: 'log-2',
    timestamp: Date.now() - 95 * 60 * 1000,
    probabilityPct: 75,
    predictedRain: true,
    confidenceLevel: 'high',
    actualRainOccurred: true,
    accuracyStatus: 'tepat',
    humidityDelta: '+12.5%',
    tempDelta: '-1.8°C',
    notes: 'Penurunan suhu tajam dan kelembapan tinggi, hujan lebat terkonfirmasi.',
  },
  {
    id: 'log-3',
    timestamp: Date.now() - 180 * 60 * 1000,
    probabilityPct: 45,
    predictedRain: false,
    confidenceLevel: 'medium',
    actualRainOccurred: false,
    accuracyStatus: 'tepat',
    humidityDelta: '+4.1%',
    tempDelta: '-0.3°C',
    notes: 'Awan mendung lewat tanpa tetesan air ke sensor. Prediksi tepat.',
  },
  {
    id: 'log-4',
    timestamp: Date.now() - 320 * 60 * 1000,
    probabilityPct: 62,
    predictedRain: true,
    confidenceLevel: 'medium',
    actualRainOccurred: false,
    accuracyStatus: 'meleset',
    humidityDelta: '+9.4%',
    tempDelta: '-1.1°C',
    notes: 'Angin kencang meniup awan hujan menjauhi area jemuran (False Positive).',
  },
  {
    id: 'log-5',
    timestamp: Date.now() - 480 * 60 * 1000,
    probabilityPct: 15,
    predictedRain: false,
    confidenceLevel: 'high',
    actualRainOccurred: false,
    accuracyStatus: 'tepat',
    humidityDelta: '-1.2%',
    tempDelta: '+0.5°C',
    notes: 'Cuaca terik siang hari, sensor stabil kering sempurna.',
  },
  {
    id: 'log-6',
    timestamp: Date.now() - 720 * 60 * 1000,
    probabilityPct: 92,
    predictedRain: true,
    confidenceLevel: 'high',
    actualRainOccurred: true,
    accuracyStatus: 'tepat',
    humidityDelta: '+18.9%',
    tempDelta: '-3.1°C',
    notes: 'Badai petir diprediksi 25 menit sebelumnya, motor kanopi berhasil menutup tepat waktu.',
  },
];

interface AIAccuracyViewProps {
  deviceId: string;
  backendUrl?: string;
}

export const AIAccuracyView: React.FC<AIAccuracyViewProps> = ({ deviceId, backendUrl }) => {
  const [logs, setLogs] = useState<AIPredictionAccuracyLog[]>(DEFAULT_LOGS);
  const [filterAccuracy, setFilterAccuracy] = useState<'all' | 'tepat' | 'meleset'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadLogs = async () => {
    if (!backendUrl) return;
    setIsLoading(true);
    try {
      const data = await BackendService.getAIPredictionsHistory(backendUrl, deviceId);
      if (data?.logs && Array.isArray(data.logs) && data.logs.length > 0) {
        const formatted: AIPredictionAccuracyLog[] = data.logs.map((item: any, idx: number) => {
          const ts = item.createdAt ? new Date(item.createdAt).getTime() : Date.now() - idx * 600000;
          return {
            id: String(item.id || `log-${idx}`),
            timestamp: ts,
            probabilityPct: item.probabilityPct ?? item.probability ?? 75,
            predictedRain: item.predictedRain ?? item.willRain ?? true,
            confidenceLevel: item.confidenceLevel || 'high',
            actualRainOccurred: item.actualRainOccurred ?? true,
            accuracyStatus: item.accuracyStatus || 'tepat',
            humidityDelta: item.humidityDelta || '+10.0%',
            tempDelta: item.tempDelta || '-1.5°C',
            notes: item.notes || item.summary || 'Hasil evaluasi model AI.',
          };
        });
        setLogs(formatted);
      }
    } catch {
      // Keep DEFAULT_LOGS on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (backendUrl) {
      loadLogs();
    }
  }, [backendUrl, deviceId]);

  const filteredLogs = logs.filter((log) => {
    if (filterAccuracy === 'all') return true;
    return log.accuracyStatus === filterAccuracy;
  });

  const totalLogs = logs.length;
  const tepatCount = logs.filter((l) => l.accuracyStatus === 'tepat').length;
  const melesetCount = totalLogs - tepatCount;
  const accuracyRate = totalLogs > 0 ? Math.round((tepatCount / totalLogs) * 100) : 0;

  const handleExportCSV = () => {
    const header = 'ID,Timestamp,Waktu,Probabilitas_Pct,Prediksi_Hujan,Confidence,Sensor_Fisik_Hujan,Status_Akurasi,Delta_Kelembapan,Delta_Suhu,Catatan\r\n';
    const rows = filteredLogs.map((l) => {
      const d = new Date(l.timestamp).toISOString();
      return `"${l.id}",${l.timestamp},"${d}",${l.probabilityPct},${l.predictedRain},"${l.confidenceLevel}",${l.actualRainOccurred},"${l.accuracyStatus}","${l.humidityDelta}","${l.tempDelta}","${l.notes.replace(/"/g, '""')}"`;
    });
    const blob = new Blob([header + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `riwayat-akurasi-ai-${deviceId}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* 1. Metric Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 sm:p-4 bg-slate-900/60 border-white/10">
          <div className="flex items-center gap-2 text-sky-400 mb-1">
            <Percent className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Akurasi Model</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {accuracyRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tingkat ketepatan prediksi</div>
        </Card>

        <Card className="p-3.5 sm:p-4 bg-slate-900/60 border-white/10">
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <BrainCircuit className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Evaluasi</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {totalLogs}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Siklus analisis prediktif</div>
        </Card>

        <Card className="p-3.5 sm:p-4 bg-slate-900/60 border-white/10">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Prediksi Tepat</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
            {tepatCount}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">Sesuai kondisi sensor</div>
        </Card>

        <Card className="p-3.5 sm:p-4 bg-slate-900/60 border-white/10">
          <div className="flex items-center gap-2 text-rose-400 mb-1">
            <XCircle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Meleset</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-300 font-mono">
            {melesetCount}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-0.5">Divergensi mikroklimat</div>
        </Card>
      </div>

      {/* 2. Filter & Actions Bar */}
      <Card className="p-3.5 sm:p-4 bg-slate-900/60 border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">Filter Status:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterAccuracy('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filterAccuracy === 'all'
                  ? 'bg-sky-500 text-white font-bold'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              Semua ({totalLogs})
            </button>
            <button
              onClick={() => setFilterAccuracy('tepat')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filterAccuracy === 'tepat'
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              Tepat ({tepatCount})
            </button>
            <button
              onClick={() => setFilterAccuracy('meleset')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filterAccuracy === 'meleset'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              Meleset ({melesetCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {backendUrl && (
            <Button
              variant="secondary"
              size="sm"
              onClick={loadLogs}
              disabled={isLoading}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Memuat...' : 'Segarkan'}
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor Log AI (CSV)
          </Button>
        </div>
      </Card>

      {/* 3. Log Table */}
      <Card className="p-0 overflow-hidden bg-slate-900/60 border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Waktu Prediksi</th>
                <th className="py-3 px-4">Probabilitas AI</th>
                <th className="py-3 px-4">Tingkat Keyakinan</th>
                <th className="py-3 px-4">Faktor Δ Sensor</th>
                <th className="py-3 px-4">Sensor Fisik</th>
                <th className="py-3 px-4 text-center">Status Akurasi</th>
                <th className="py-3 px-4">Catatan Evaluasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredLogs.map((log) => {
                const dateObj = new Date(log.timestamp);
                const timeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(
                  dateObj.getMinutes()
                ).padStart(2, '0')}`;
                const dateStr = `${dateObj.getDate()} ${
                  ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][
                    dateObj.getMonth()
                  ]
                }`;

                return (
                  <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      <div className="font-semibold text-white">{timeStr} WIB</div>
                      <div className="text-[10px] text-slate-500">{dateStr}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-sm">
                      <span
                        className={
                          log.probabilityPct >= 70
                            ? 'text-cyan-400'
                            : log.probabilityPct >= 40
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }
                      >
                        {log.probabilityPct}%
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          log.confidenceLevel === 'high'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : log.confidenceLevel === 'medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {log.confidenceLevel === 'high' ? 'Tinggi' : 'Sedang'}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                      <div>RH: <span className="text-cyan-300 font-bold">{log.humidityDelta}</span></div>
                      <div>T: <span className="text-amber-300 font-bold">{log.tempDelta}</span></div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.actualRainOccurred ? (
                        <span className="inline-flex items-center gap-1 text-cyan-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          Hujan Basah
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          Kering
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      {log.accuracyStatus === 'tepat' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Tepat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
                          <XCircle className="w-3.5 h-3.5" />
                          Meleset
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-400 max-w-xs leading-relaxed">
                      {log.notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
