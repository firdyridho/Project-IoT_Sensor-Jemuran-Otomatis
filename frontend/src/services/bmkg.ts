// BMKG Weather API Service according to bmkg-weather/SKILL.md & API.md
import { BmkgResponse, Slot, Lokasi } from '../types/bmkg';
import { StorageService } from './storage';

export interface BmkgFetchResult {
  data: BmkgResponse | null;
  fromCache: boolean;
  isStale: boolean;
  error?: string;
  statusCode?: number;
}

export const ADM4_PRESETS: { code: string; label: string; reg: string; lat: number; lon: number }[] = [
  { code: '31.71.03.1001', label: 'Kemayoran, Jakarta Pusat', reg: 'DKI Jakarta', lat: -6.16, lon: 106.85 },
  { code: '31.71.01.1001', label: 'Gambir, Jakarta Pusat', reg: 'DKI Jakarta', lat: -6.18, lon: 106.83 },
  { code: '32.75.01.1001', label: 'Bekasi Timur, Kota Bekasi', reg: 'Jawa Barat', lat: -6.24, lon: 107.01 },
  { code: '32.73.09.1001', label: 'Bandung Wetan, Kota Bandung', reg: 'Jawa Barat', lat: -6.90, lon: 107.61 },
  { code: '33.74.01.1001', label: 'Semarang Tengah, Kota Semarang', reg: 'Jawa Tengah', lat: -6.98, lon: 110.42 },
  { code: '34.71.01.1001', label: 'Danurejan, Kota Yogyakarta', reg: 'DI Yogyakarta', lat: -7.79, lon: 110.37 },
  { code: '35.78.09.1001', label: 'Gubeng, Kota Surabaya', reg: 'Jawa Timur', lat: -7.27, lon: 112.75 },
  { code: '51.71.01.1001', label: 'Denpasar Selatan, Denpasar', reg: 'Bali', lat: -8.69, lon: 115.22 },
  { code: '15.71.01.1001', label: 'Telanaipura, Kota Jambi', reg: 'Jambi', lat: -1.61, lon: 103.59 },
  { code: '12.71.04.1001', label: 'Medan Petisah, Medan', reg: 'Sumatera Utara', lat: 3.59, lon: 98.66 },
  { code: '73.71.04.1001', label: 'Ujung Pandang, Makassar', reg: 'Sulawesi Selatan', lat: -5.14, lon: 119.41 },
];

export function findNearestAdm4(userLat: number, userLon: number) {
  let nearest = ADM4_PRESETS[0];
  let minDistance = Infinity;

  for (const p of ADM4_PRESETS) {
    const dLat = userLat - p.lat;
    const dLon = userLon - p.lon;
    const dist = dLat * dLat + dLon * dLon;
    if (dist < minDistance) {
      minDistance = dist;
      nearest = p;
    }
  }
  return nearest;
}

export async function fetchBmkgWeather(adm4: string, forceRefresh = false): Promise<BmkgFetchResult> {
  const cleanCode = adm4.trim();
  if (!cleanCode) {
    return { data: null, fromCache: false, isStale: false, error: 'Kode ADM4 tidak boleh kosong' };
  }

  // 1. Check cache first unless forced
  const cached = StorageService.getBmkgCache(cleanCode);
  if (!forceRefresh && cached && !cached.isStale) {
    return { data: cached.data, fromCache: true, isStale: false };
  }

  // 2. Fetch from BMKG Open API
  const url = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${encodeURIComponent(cleanCode)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (res.status === 200) {
      const json = await res.json();
      if (json && json.lokasi && json.data) {
        StorageService.saveBmkgCache(cleanCode, json);
        return { data: json as BmkgResponse, fromCache: false, isStale: false };
      } else {
        throw new Error('Format response BMKG tidak sesuai');
      }
    } else if (res.status === 404) {
      return {
        data: cached?.data || null,
        fromCache: Boolean(cached),
        isStale: true,
        statusCode: 404,
        error: `Kode wilayah ADM4 "${cleanCode}" tidak ditemukan di database BMKG. Silakan periksa kembali kode.`,
      };
    } else if (res.status === 429) {
      return {
        data: cached?.data || null,
        fromCache: Boolean(cached),
        isStale: true,
        statusCode: 429,
        error: 'Batas frekuensi permintaan BMKG (60/menit) tercapai. Menampilkan data cache. Mohon tunggu 1 menit.',
      };
    } else {
      return {
        data: cached?.data || null,
        fromCache: Boolean(cached),
        isStale: true,
        statusCode: res.status,
        error: `Server BMKG mengembalikan kode HTTP ${res.status}.`,
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Koneksi jaringan bermasalah';
    if (cached) {
      return {
        data: cached.data,
        fromCache: true,
        isStale: true,
        error: `Gagal memperbarui data: ${message}. Menampilkan prakiraan sebelumnya.`,
      };
    }
    // Fallback generate realistic mock forecast if offline / no internet for demo
    const mockData = generateMockBmkgForecast(cleanCode);
    return {
      data: mockData,
      fromCache: false,
      isStale: true,
      error: `Tidak dapat menghubungi BMKG (${message}). Menggunakan data prakiraan estimasi offline.`,
    };
  }
}

// Generate fallback forecast matching BMKG verified schema
function generateMockBmkgForecast(adm4: string): BmkgResponse {
  const preset = ADM4_PRESETS.find((p) => p.code === adm4) || {
    label: 'Wilayah Terpilih',
    reg: 'Indonesia',
  };

  const lokasi: Lokasi = {
    adm1: adm4.slice(0, 2),
    adm2: adm4.slice(0, 5),
    adm3: adm4.slice(0, 8),
    adm4,
    provinsi: preset.reg,
    kotkab: preset.label.split(',')[1]?.trim() || 'Kota Setempat',
    kecamatan: preset.label.split(',')[0]?.trim() || 'Kecamatan Setempat',
    desa: preset.label.split(',')[0]?.trim() || 'Desa Setempat',
    lon: 106.845,
    lat: -6.164,
    timezone: 'Asia/Jakarta',
  };

  const now = new Date();
  const cuacaDays: Slot[][] = [];

  const weatherTypes = [
    { code: 1, desc: 'Cerah', descEn: 'Sunny', rain: 0, icon: 'cerah-am.svg' },
    { code: 2, desc: 'Cerah Berawan', descEn: 'Partly Cloudy', rain: 0, icon: 'cerah berawan-am.svg' },
    { code: 3, desc: 'Berawan', descEn: 'Cloudy', rain: 0, icon: 'berawan-am.svg' },
    { code: 61, desc: 'Hujan Ringan', descEn: 'Light Rain', rain: 1.5, icon: 'hujan ringan.svg' },
    { code: 63, desc: 'Hujan Sedang', descEn: 'Moderate Rain', rain: 5.2, icon: 'hujan lebat.svg' },
  ];

  for (let dayIdx = 0; dayIdx < 3; dayIdx++) {
    const slots: Slot[] = [];
    for (let slotIdx = 0; slotIdx < 8; slotIdx++) {
      const slotHour = slotIdx * 3;
      const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayIdx, slotHour, 0, 0);

      const hourStr = String(slotHour).padStart(2, '0');
      const nextHourStr = String((slotHour + 3) % 24).padStart(2, '0');
      const timeIndex = `${hourStr}-${nextHourStr}`;

      const year = slotDate.getFullYear();
      const month = String(slotDate.getMonth() + 1).padStart(2, '0');
      const day = String(slotDate.getDate()).padStart(2, '0');
      const localDatetime = `${year}-${month}-${day} ${hourStr}:00:00`;

      // Higher chance of rain in the afternoon (12:00 - 18:00)
      let wIdx = 1;
      if (slotHour >= 12 && slotHour <= 18) {
        wIdx = Math.random() > 0.4 ? 3 : 1;
      } else if (slotHour >= 21 || slotHour <= 6) {
        wIdx = 0;
      }

      const selectedWeather = weatherTypes[wIdx];
      const temp = 26 + Math.round(Math.sin((slotHour / 24) * Math.PI * 2) * 6);
      const hum = 60 + Math.round(Math.cos((slotHour / 24) * Math.PI * 2) * 30);

      slots.push({
        datetime: slotDate.toISOString(),
        utc_datetime: slotDate.toISOString().replace('T', ' ').slice(0, 19),
        local_datetime: localDatetime,
        analysis_date: `${year}-${month}-${day} 00:00:00`,
        time_index: timeIndex,
        weather: selectedWeather.code,
        weather_desc: selectedWeather.desc,
        weather_desc_en: selectedWeather.descEn,
        t: temp,
        hu: hum,
        tcc: selectedWeather.rain > 0 ? 90 : 30,
        tp: selectedWeather.rain,
        ws: 8.5,
        wd: 'NW',
        wd_to: 'SE',
        wd_deg: 315,
        vs: 10,
        vs_text: '> 10 km',
        image: `https://api-apps.bmkg.go.id/storage/icon/cuaca/${selectedWeather.icon}`,
      });
    }
    cuacaDays.push(slots);
  }

  return {
    lokasi,
    data: [
      {
        lokasi,
        cuaca: cuacaDays,
      },
    ],
  };
}
