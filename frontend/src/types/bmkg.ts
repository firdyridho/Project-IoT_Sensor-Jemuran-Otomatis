// Types and helpers for BMKG Weather API based on bmkg-weather/SKILL.md

export interface Slot {
  datetime: string;
  utc_datetime: string;
  local_datetime: string; // YYYY-MM-DD HH:mm:ss, already local Indonesian time! Never do manual UTC conversion!
  analysis_date: string;
  time_index: string;
  weather: number;
  weather_desc: string; // Ground truth for weather condition!
  weather_desc_en: string;
  t: number; // Celsius
  hu: number; // Humidity %
  tcc: number; // Cloud cover %
  tp: number | null; // Rainfall mm (nullable)
  ws: number | null; // Wind speed km/h (nullable)
  wd: string | null; // Wind direction origin (nullable)
  wd_to: string | null; // Wind direction target (nullable)
  wd_deg: number | null; // Wind direction degrees (nullable)
  vs: number | null; // Visibility (nullable)
  vs_text: string | null; // Visibility text (nullable)
  image: string | null; // Icon SVG URL (nullable, contains spaces!)
}

export interface Lokasi {
  adm1: string;
  adm2: string;
  adm3: string;
  adm4: string;
  provinsi: string;
  kotkab: string;
  kecamatan: string;
  desa: string;
  lon: number;
  lat: number;
  timezone: string;
  type?: string;
}

export interface BmkgResponse {
  lokasi: Lokasi;
  data: {
    lokasi: Lokasi;
    cuaca: Slot[][];
  }[];
}

// Helpers specified in bmkg-weather/SKILL.md
export const ikonAman = (raw: string | null): string | null => {
  if (!raw) return null;
  return raw.replace(/ /g, '%20');
};

export const berpotensiHujan = (slot: Slot): boolean => {
  return (slot.tp != null && slot.tp > 0) || /hujan|petir|guntur/i.test(slot.weather_desc);
};

export const semuaSlot = (response: BmkgResponse): Slot[] => {
  if (!response?.data || !Array.isArray(response.data)) return [];
  return response.data.flatMap((d) => (Array.isArray(d.cuaca) ? d.cuaca.flat() : []));
};
