import React, { useState } from 'react';
import {
  CloudSun,
  CloudRain,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Clock,
  Wind,
  Droplets,
  Cloud,
  Eye,
  CheckCircle2,
  LocateFixed,
} from 'lucide-react';
import { BmkgResponse, Slot, ikonAman, berpotensiHujan, semuaSlot } from '../../types/bmkg';
import { ADM4_PRESETS, findNearestAdm4 } from '../../services/bmkg';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Badge } from '../Common/Badge';

interface WeatherViewProps {
  weatherData: BmkgResponse | null;
  isLoading: boolean;
  isStale: boolean;
  error?: string;
  currentAdm4: string;
  onRefresh: (adm4?: string) => void;
  onSelectAdm4: (adm4: string) => void;
}

export const WeatherView: React.FC<WeatherViewProps> = ({
  weatherData,
  isLoading,
  isStale,
  error,
  currentAdm4,
  onRefresh,
  onSelectAdm4,
}) => {
  const [customCode, setCustomCode] = useState(currentAdm4);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice('Perangkat Anda tidak mendukung fitur deteksi lokasi GPS.');
      return;
    }
    setIsLocating(true);
    setLocationNotice('Mendeteksi koordinat GPS wilayah Anda...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestAdm4(latitude, longitude);
        setCustomCode(nearest.code);
        onSelectAdm4(nearest.code);
        setLocationNotice(`Lokasi terdeteksi: ${nearest.label}`);
      },
      () => {
        setIsLocating(false);
        setLocationNotice('Izin lokasi ditolak di browser. Silakan pilih wilayah dari menu daftar.');
      },
      { timeout: 10000 }
    );
  };

  // Group slots by day
  const daysData = weatherData?.data?.[0]?.cuaca || [];

  // Flatten all slots to compute rain risk statistics
  const allSlots = weatherData ? semuaSlot(weatherData) : [];
  const riskSlots = allSlots.filter(berpotensiHujan);
  // Each slot represents 3 hours
  const totalRainHours = riskSlots.length * 3;

  const handleApplyCustomCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCode.trim()) {
      onSelectAdm4(customCode.trim());
    }
  };

  const activeDaySlots: Slot[] = daysData[activeDayIndex] || [];

  // Format date header for active tab
  const getDayHeader = (slot?: Slot) => {
    if (!slot) return 'Hari Ini';
    const dateStr = slot.local_datetime.split(' ')[0];
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Location Selector */}
      <Card className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                <CloudSun className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-teks-utama font-heading">
                Prakiraan Cuaca Resmi BMKG
              </h2>
            </div>
            <p className="text-xs text-teks-sekunder mt-0.5">
              Data terbuka 3 hari per 3 jam dari Badan Meteorologi, Klimatologi, dan Geofisika
            </p>
          </div>

          {/* Refresh button */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRefresh()}
              disabled={isLoading}
              className="gap-2 shrink-0"
              aria-label="Perbarui data cuaca"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Memuat...' : 'Perbarui'}</span>
            </Button>
          </div>
        </div>

        {/* Location selector / ADM4 switcher */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-garis">
          {/* Preset dropdown & GPS detector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-teks-sekunder">
                Pilih Wilayah Populer
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-500 hover:text-cyan-400 disabled:opacity-50 cursor-pointer transition-colors"
                title="Deteksi wilayah terdekat via koordinat GPS perangkat"
              >
                <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Mencari GPS...' : 'Deteksi Lokasi GPS'}</span>
              </button>
            </div>
            <select
              value={currentAdm4}
              onChange={(e) => {
                setCustomCode(e.target.value);
                onSelectAdm4(e.target.value);
              }}
              className="w-full bg-kartu-muted border border-garis rounded-xl text-xs font-semibold px-3 py-2.5 text-teks-utama focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {ADM4_PRESETS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.label} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Custom ADM4 code input */}
          <form onSubmit={handleApplyCustomCode} className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-teks-sekunder mb-1">
                Kode ADM4 Khusus (Format: XX.XX.XX.XXXX)
              </label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="Contoh: 31.71.03.1001"
                pattern="^\d{2}\.\d{2}\.\d{2}\.\d{4}$"
                className="w-full bg-kartu-muted border border-garis rounded-xl text-xs font-mono px-3 py-2.5 text-teks-utama focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="min-h-10 text-xs">
              Terapkan
            </Button>
          </form>
        </div>

        {/* Location Notice Banner */}
        {locationNotice && (
          <div className="text-xs px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <LocateFixed className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span>{locationNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setLocationNotice(null)}
              className="text-teks-muted hover:text-teks-utama text-[11px] ml-2"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Current Location Badge and Info */}
        {weatherData && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs bg-kartu-muted/60 p-3 rounded-xl border border-garis/80">
            <div className="flex items-center gap-1.5 font-semibold text-teks-utama">
              <MapPin className="w-4 h-4 text-cyan-500 shrink-0" />
              <span>
                {weatherData.lokasi.desa}, Kec. {weatherData.lokasi.kecamatan}, {weatherData.lokasi.kotkab},{' '}
                {weatherData.lokasi.provinsi}
              </span>
            </div>
            <div className="flex items-center gap-2 text-teks-sekunder font-mono text-[11px]">
              <span>Zona: {weatherData.lokasi.timezone}</span>
              {isStale && <Badge variant="peringatan">Data Cache</Badge>}
            </div>
          </div>
        )}
      </Card>

      {/* Error / Warning Alert */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-3"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Perhatian:</p>
            <p className="leading-relaxed opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* 2. Rain Risk Summary Banner (PRD FR-20) */}
      <Card
        className={`p-4 md:p-5 border-2 transition-colors ${
          totalRainHours > 0
            ? 'border-cyan-500/40 bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent'
            : 'border-green-500/40 bg-gradient-to-r from-green-500/10 via-transparent to-transparent'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                totalRainHours > 0
                  ? 'bg-cyan-500/20 text-cyan-500'
                  : 'bg-green-500/20 text-green-500'
              }`}
            >
              {totalRainHours > 0 ? (
                <CloudRain className="w-6 h-6 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-teks-utama">
                {totalRainHours > 0
                  ? `Peringatan: Berpotensi ${totalRainHours} Jam Hujan`
                  : 'Prakiraan Aman untuk Menjemur'}
              </h3>
              <p className="text-xs text-teks-sekunder mt-0.5 max-w-xl leading-relaxed">
                {totalRainHours > 0
                  ? `BMKG memperkirakan terdapat ${riskSlots.length} slot waktu berisiko hujan/petir dalam 3 hari ke depan. Pastikan memeriksa jemuran pada jam-jam tersebut.`
                  : 'Tidak terdeteksi potensi hujan signifikan dalam 3 hari ke depan di wilayah ini.'}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">
            <Badge variant={totalRainHours > 0 ? 'hujan' : 'sukses'} dot>
              {totalRainHours > 0 ? `${riskSlots.length} Slot Hujan` : 'Kondisi Cerah'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* 3. 3-Day Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-garis pb-2 overflow-x-auto">
        {daysData.map((daySlots, idx) => {
          const firstSlot = daySlots[0];
          const hasRain = daySlots.some(berpotensiHujan);
          const isSelected = activeDayIndex === idx;

          return (
            <button
              key={idx}
              onClick={() => setActiveDayIndex(idx)}
              className={`min-h-11 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all focus:outline-none shrink-0 ${
                isSelected
                  ? 'bg-kartu-muted border-cyan-500 text-teks-utama ring-1 ring-cyan-500/20 shadow-xs'
                  : 'bg-kartu border-garis text-teks-sekunder hover:text-teks-utama'
              }`}
            >
              <span>{getDayHeader(firstSlot)}</span>
              {hasRain && (
                <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" title="Ada potensi hujan" />
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Weather Slots Grid (8 slots per day) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {activeDaySlots.map((slot, sIdx) => {
          const isRain = berpotensiHujan(slot);
          const iconUrl = ikonAman(slot.image);
          const time = slot.local_datetime.split(' ')[1]?.slice(0, 5) || slot.time_index;

          return (
            <Card
              key={sIdx}
              className={`p-3.5 space-y-2.5 transition-all ${
                isRain
                  ? 'border-cyan-500/50 bg-cyan-500/5 hover:border-cyan-500'
                  : 'hover:border-garis/80'
              }`}
            >
              {/* Slot Header: Time & Risk Badge */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold font-mono text-teks-utama flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teks-sekunder" />
                  {time} WIB
                </span>
                {isRain ? (
                  <Badge variant="hujan" dot>
                    Hujan
                  </Badge>
                ) : (
                  <span className="text-[11px] text-teks-sekunder">{slot.weather_desc}</span>
                )}
              </div>

              {/* Weather Icon & Temperature */}
              <div className="flex items-center gap-3 py-1">
                <div className="p-2 rounded-xl bg-kartu-muted shrink-0 w-12 h-12 flex items-center justify-center">
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt={slot.weather_desc}
                      className="w-9 h-9 object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <CloudSun className="w-8 h-8 text-cyan-500" />
                  )}
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-teks-utama tracking-tight">
                    {slot.t}°C
                  </div>
                  <div className="text-xs font-medium text-teks-sekunder truncate max-w-[130px]">
                    {slot.weather_desc}
                  </div>
                </div>
              </div>

              {/* Weather Metrics (Rainfall, Humidity, Wind, Cloud) */}
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-garis/70 text-[11px] text-teks-sekunder">
                <div className="flex items-center gap-1.5 truncate">
                  <Droplets className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                  <span>
                    Hujan: {slot.tp != null ? `${slot.tp} mm` : '0 mm'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Lembap: {slot.hu}%</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Wind className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  <span>
                    {slot.ws != null ? `${slot.ws} km/h` : '—'} {slot.wd || ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Cloud className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Awan: {slot.tcc}%</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 5. Mandatory BMKG Legal Notice (FR-21) */}
      <Card className="bg-kartu-muted/40 p-4 border border-garis text-xs text-teks-sekunder space-y-1">
        <div className="font-semibold text-teks-utama flex items-center gap-1.5">
          <span>Kepatuhan Data Terbuka:</span>
          <Badge variant="netral">Sumber Resmi BMKG</Badge>
        </div>
        <p className="leading-relaxed">
          Prakiraan cuaca disediakan oleh <strong>Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)</strong> Republik Indonesia melalui portal API publik resmi.
          Pembaruan data dilakukan 2 kali sehari dengan resolusi wilayah tingkat kelurahan/desa (ADM4).
        </p>
      </Card>
    </div>
  );
};
