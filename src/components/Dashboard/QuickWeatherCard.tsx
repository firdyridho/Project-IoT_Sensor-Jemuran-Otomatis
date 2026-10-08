import React from 'react';
import { CloudSun, ChevronRight, Droplets, MapPin } from 'lucide-react';
import { Card } from '../Common/Card';
import { BmkgResponse, ikonAman, berpotensiHujan, semuaSlot } from '../../types/bmkg';

interface QuickWeatherCardProps {
  weatherData: BmkgResponse | null;
  isLoading: boolean;
  onOpenWeatherTab: () => void;
}

export const QuickWeatherCard: React.FC<QuickWeatherCardProps> = ({
  weatherData,
  isLoading,
  onOpenWeatherTab,
}) => {
  if (isLoading) {
    return (
      <Card className="animate-pulse p-4">
        <div className="h-4 bg-garis rounded w-1/3 mb-3" />
        <div className="h-10 bg-garis rounded w-1/2" />
      </Card>
    );
  }

  if (!weatherData) return null;

  const slots = semuaSlot(weatherData);
  const nextSlot = slots[0];
  const lokasi = weatherData.lokasi;

  const isRainRisk = nextSlot ? berpotensiHujan(nextSlot) : false;
  const safeIcon = nextSlot ? ikonAman(nextSlot.image) : null;

  return (
    <Card
      variant="interactive"
      onClick={onOpenWeatherTab}
      className="border border-garis flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5"
    >
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
          {safeIcon ? (
            <img
              src={safeIcon}
              alt={nextSlot?.weather_desc || 'Cuaca BMKG'}
              className="w-10 h-10 object-contain"
              onError={(e) => {
                // fallback if BMKG SVG fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <CloudSun className="w-9 h-9" />
          )}
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-teks-sekunder">
            <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="truncate font-medium">
              {lokasi.kecamatan}, {lokasi.kotkab}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-kartu-muted border border-garis shrink-0">
              BMKG
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-teks-utama">
              {nextSlot ? nextSlot.weather_desc : 'Prakiraan Cuaca'}
            </span>
            {nextSlot && (
              <span className="text-sm font-semibold text-teks-sekunder">
                {nextSlot.t}°C
              </span>
            )}
          </div>

          <p className="text-xs text-teks-sekunder">
            {isRainRisk ? (
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold inline-flex items-center gap-1">
                <Droplets className="w-3 h-3" /> Berpotensi hujan dalam 3 jam ke depan
              </span>
            ) : (
              <span>Kondisi cerah/berawan menurut BMKG</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-garis">
        <span className="text-[11px] font-medium text-teks-sekunder italic">
          Sumber: BMKG
        </span>
        <div className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 gap-1 hover:underline">
          <span>Lihat 3 Hari</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Card>
  );
};
