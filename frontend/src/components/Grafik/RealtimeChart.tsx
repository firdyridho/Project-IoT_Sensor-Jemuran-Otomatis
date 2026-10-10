import React, { useState, useMemo } from 'react';
import { PembacaanHujan } from '../../types/iot';
import { Card } from '../Common/Card';
import { Activity, Droplets, Thermometer, Gauge, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '../Common/Button';

export type ChartSeries = 'pct' | 'raw' | 'tempC' | 'hum';
export type ChartRange = '5m' | '1h' | 'session';

interface RealtimeChartProps {
  readings: PembacaanHujan[];
  thresholdPct: number;
}

export const RealtimeChart: React.FC<RealtimeChartProps> = ({
  readings,
  thresholdPct,
}) => {
  const [range, setRange] = useState<ChartRange>('1h');
  const [activeSeries, setActiveSeries] = useState<ChartSeries>('pct');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Export Telemetry CSV (FE-08)
  const handleExportTelemetryCSV = () => {
    if (readings.length === 0) return;
    const header = 'Waktu,Timestamp_MS,DeviceId,Wet_Pct,ADC_Raw,Is_Wet,Suhu_C,Kelembapan_Pct,Baterai_V,Baterai_Pct,RSSI\r\n';
    const rows = readings.map((r) => {
      const d = new Date(r.ts).toISOString();
      return `"${d}",${r.ts},"${r.deviceId}",${r.pct},${r.raw},${r.wet},${r.suhuC ?? ''},${r.lembapPct ?? ''},${r.bateraiV ?? ''},${r.bateraiPct ?? ''},${r.rssi ?? ''}`;
    });
    const blob = new Blob([header + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `telemetri-hujan-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter points according to selected range
  const filteredData = useMemo(() => {
    if (readings.length === 0) return [];
    const now = Date.now();
    let cutoff = 0;
    if (range === '5m') {
      cutoff = now - 5 * 60 * 1000;
    } else if (range === '1h') {
      cutoff = now - 60 * 60 * 1000;
    }

    if (cutoff === 0) {
      return readings;
    }
    const sliced = readings.filter((r) => r.ts >= cutoff);
    return sliced.length > 0 ? sliced : readings.slice(-20);
  }, [readings, range]);

  // Extract metric values
  const seriesConfig = {
    pct: { label: 'Basah (%)', unit: '%', color: '#0891b2', darkColor: '#22d3ee', icon: Droplets, maxDef: 100, minDef: 0 },
    raw: { label: 'ADC Analog', unit: '', color: '#2563eb', darkColor: '#60a5fa', icon: Activity, maxDef: 4095, minDef: 0 },
    tempC: { label: 'Suhu (°C)', unit: '°C', color: '#f97316', darkColor: '#fb923c', icon: Thermometer, maxDef: 45, minDef: 20 },
    hum: { label: 'Kelembapan (%)', unit: '%', color: '#10b981', darkColor: '#34d399', icon: Gauge, maxDef: 100, minDef: 30 },
  };

  const currentCfg = seriesConfig[activeSeries];

  // Calculate SVG coordinates
  const width = 800;
  const height = 320;
  const padding = { top: 25, right: 30, bottom: 40, left: 55 };

  const { points, minVal, maxVal, pathD, areaD } = useMemo(() => {
    if (filteredData.length === 0) {
      return { points: [], minVal: 0, maxVal: 100, pathD: '', areaD: '' };
    }

    let min = Infinity;
    let max = -Infinity;

    const values = filteredData.map((d) => {
      let val = 0;
      if (activeSeries === 'pct') val = d.pct;
      else if (activeSeries === 'raw') val = d.raw;
      else if (activeSeries === 'tempC') val = d.suhuC != null ? d.suhuC : 28;
      else if (activeSeries === 'hum') val = d.lembapPct != null ? d.lembapPct : 75;

      if (val < min) min = val;
      if (val > max) max = val;
      return val;
    });

    // Provide comfortable padding
    if (activeSeries === 'pct') {
      min = 0;
      max = 100;
    } else if (activeSeries === 'raw') {
      min = 0;
      max = 4095;
    } else {
      min = Math.floor(min - 2);
      max = Math.ceil(max + 2);
      if (min === max) {
        min -= 5;
        max += 5;
      }
    }

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const pts = filteredData.map((d, i) => {
      const x = padding.left + (i / Math.max(1, filteredData.length - 1)) * plotW;
      const yNorm = (values[i] - min) / (max - min || 1);
      const y = padding.top + plotH - yNorm * plotH;
      return { x, y, val: values[i], ts: d.ts };
    });

    if (pts.length === 0) return { points: [], minVal: min, maxVal: max, pathD: '', areaD: '' };

    const pD = pts.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
    const aD = `${pD} L ${pts[pts.length - 1].x} ${height - padding.bottom} L ${pts[0].x} ${height - padding.bottom} Z`;

    return { points: pts, minVal: min, maxVal: max, pathD: pD, areaD: aD };
  }, [filteredData, activeSeries]);

  // Threshold Y coordinate for PCT series
  const thresholdY = useMemo(() => {
    if (activeSeries !== 'pct') return null;
    const plotH = height - padding.top - padding.bottom;
    const yNorm = (thresholdPct - minVal) / (maxVal - minVal || 1);
    return padding.top + plotH - yNorm * plotH;
  }, [activeSeries, thresholdPct, minVal, maxVal]);

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <Card className="space-y-4 p-4 md:p-6 relative overflow-hidden border">
      {/* Decorative ambient gradient corner glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header with Series Selector & Range Chips */}
      <div className="relative z-10 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-indigo-500/10 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-teks-utama font-heading tracking-tight leading-tight">
                Grafik Telemetri Realtime
              </h2>
              <p className="text-xs text-teks-sekunder mt-0.5 font-medium">
                {filteredData.length} data point • Live streaming dari ESP32
              </p>
            </div>
          </div>
        </div>

        {/* Range Buttons & Export Button */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-kartu/80 backdrop-blur-xs p-1 rounded-xl border border-garis shadow-xs">
            {(
              [
                { id: '5m', label: '5m' },
                { id: '1h', label: '1 Jam' },
                { id: 'session', label: 'Sesi Ini' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setRange(item.id)}
                className={`min-h-8 px-3 py-1 rounded-lg text-xs font-bold transition-all focus:outline-none cursor-pointer ${
                  range === item.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xs'
                    : 'text-teks-sekunder hover:text-teks-utama'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportTelemetryCSV}
            disabled={readings.length === 0}
            className="gap-1.5 shadow-xs bg-kartu/90 hover:bg-kartu"
            title="Ekspor CSV Telemetri Sensor"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden xs:inline font-bold">Ekspor CSV</span>
          </Button>
        </div>
      </div>

      {/* Series Metric Pills with Modern Gradient Styles */}
      <div className="flex flex-wrap gap-2 pt-1">
        {(['pct', 'raw', 'tempC', 'hum'] as const).map((s) => {
          const cfg = seriesConfig[s];
          const Icon = cfg.icon;
          const isSelected = activeSeries === s;
          const activeGradients: Record<string, string> = {
            pct: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 border-cyan-400',
            raw: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 border-blue-400',
            tempC: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20 border-amber-400',
            hum: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 border-emerald-400',
          };

          return (
            <button
              key={s}
              onClick={() => setActiveSeries(s)}
              className={`min-h-10 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                isSelected
                  ? activeGradients[s]
                  : 'bg-kartu/80 border-garis text-teks-sekunder hover:bg-kartu-muted hover:text-teks-utama'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative w-full overflow-hidden bg-kartu-muted/40 rounded-xl border border-garis/80 pt-2">
        {points.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-teks-sekunder text-sm">
            <Activity className="w-8 h-8 opacity-40 mb-2 animate-pulse" />
            <span>Menunggu titik telemetry masuk...</span>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-64 md:h-80 select-none overflow-visible"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const svgX = ((e.clientX - rect.left) / rect.width) * width;
              // Find closest point
              let closestIdx = 0;
              let closestDist = Infinity;
              points.forEach((pt, idx) => {
                const dist = Math.abs(pt.x - svgX);
                if (dist < closestDist) {
                  closestDist = dist;
                  closestIdx = idx;
                }
              });
              setHoverIndex(closestIdx);
            }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={currentCfg.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={currentCfg.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = padding.top + (height - padding.top - padding.bottom) * pct;
              const val = Math.round(maxVal - (maxVal - minVal) * pct);
              return (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="currentColor"
                    className="text-garis/60"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-teks-sekunder font-mono"
                  >
                    {val}
                    {currentCfg.unit}
                  </text>
                </g>
              );
            })}

            {/* Threshold Line (if viewing 'pct') */}
            {thresholdY !== null && (
              <g>
                <line
                  x1={padding.left}
                  y1={thresholdY}
                  x2={width - padding.right}
                  y2={thresholdY}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="6 3"
                  className="opacity-70"
                />
                <text
                  x={width - padding.right - 4}
                  y={thresholdY - 5}
                  textAnchor="end"
                  className="text-[10px] fill-red-500 font-semibold font-mono"
                >
                  Ambang Hujan ({thresholdPct}%)
                </text>
              </g>
            )}

            {/* Area fill */}
            <path d={areaD} fill="url(#chartGrad)" />

            {/* Main Path line */}
            <path
              d={pathD}
              fill="none"
              stroke={currentCfg.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Time labels at bottom */}
            {points.length > 1 && (
              <g className="text-[10px] fill-teks-sekunder font-mono">
                <text x={padding.left} y={height - 12} textAnchor="start">
                  {new Date(points[0].ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </text>
                <text x={width / 2} y={height - 12} textAnchor="middle">
                  {new Date(points[Math.floor(points.length / 2)].ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </text>
                <text x={width - padding.right} y={height - 12} textAnchor="end">
                  {new Date(points[points.length - 1].ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </text>
              </g>
            )}

            {/* Hover Cursor and tooltip */}
            {activePoint && (
              <g>
                <line
                  x1={activePoint.x}
                  y1={padding.top}
                  x2={activePoint.x}
                  y2={height - padding.bottom}
                  stroke="currentColor"
                  className="text-teks-sekunder/80"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="5"
                  fill={currentCfg.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        )}

        {/* Floating Tooltip Details */}
        {activePoint && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 bg-kartu/95 backdrop-blur-md border border-garis shadow-lg rounded-xl px-3 py-1.5 flex items-center gap-3 text-xs pointer-events-none"
          >
            <span className="font-mono text-teks-sekunder">
              {new Date(activePoint.ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="w-1 h-3 bg-garis rounded-full" />
            <span className="font-bold text-teks-utama">
              {currentCfg.label}: {activePoint.val} {currentCfg.unit}
            </span>
          </div>
        )}
      </div>

      {/* Chart Footer summary with Modern Gradient Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-center text-xs">
        <div className="p-3 rounded-2xl bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20 shadow-2xs">
          <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Nilai Terakhir</span>
          <p className="font-black font-mono text-base text-teks-utama mt-1">
            {filteredData[filteredData.length - 1]
              ? `${activeSeries === 'pct' ? filteredData[filteredData.length - 1].pct : activeSeries === 'raw' ? filteredData[filteredData.length - 1].raw : activeSeries === 'tempC' ? filteredData[filteredData.length - 1].suhuC : filteredData[filteredData.length - 1].lembapPct} ${currentCfg.unit}`
              : '—'}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/20 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Titik Terendah</span>
          <p className="font-black font-mono text-base text-teks-utama mt-1">
            {minVal} {currentCfg.unit}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/20 shadow-2xs">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Titik Tertinggi</span>
          <p className="font-black font-mono text-base text-teks-utama mt-1">
            {maxVal} {currentCfg.unit}
          </p>
        </div>
      </div>
    </Card>
  );
};
