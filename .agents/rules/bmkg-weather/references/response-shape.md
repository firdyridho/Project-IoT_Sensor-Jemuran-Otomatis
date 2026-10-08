# Bentuk Response BMKG - Sampel Terverifikasi

Diambil langsung dari `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=31.71.01.1001` pada 2026-10-08.

Status `200`, `Content-Type: application/json; charset=utf-8`, header `Access-Control-Allow-Origin: *`.

## Struktur puncak

```json
{
  "lokasi": { "...": "metadata lokasi" },
  "data": [
    { "lokasi": { "...": "identik + field type" }, "cuaca": [ [ ], [ ], [ ] ] }
  ]
}
```

| Bagian | Bentuk | Catatan |
|---|---|---|
| `lokasi` | objek | ada di dua tempat, isinya sama |
| `data` | array | umumnya 1 entri |
| `data[].cuaca` | array of array | luar = hari, dalam = slot 3 jam |
| `data[].cuaca[][]` | array of objek | satu slot prakiraan |

**Iterasi dinamis.** Jangan hardcode jumlah `data` maupun jumlah slot per hari.

## `lokasi`

```json
{
  "adm1": "31",
  "adm2": "31.71",
  "adm3": "31.71.01",
  "adm4": "31.71.01.1001",
  "provinsi": "DKI Jakarta",
  "kotkab": "Kota Adm. Jakarta Pusat",
  "kecamatan": "Gambir",
  "desa": "Gambir",
  "lon": 106.8267073562,
  "lat": -6.1763842693,
  "timezone": "Asia/Jakarta"
}
```

Versi dalam `data[0].lokasi` punya tambahan field `"type": "adm4"`.

**`timezone` tidak konsisten antar wilayah:**

| adm4 | timezone |
|---|---|
| `31.71.01.1001` (Jakarta) | `Asia/Jakarta` |
| `51.71.01.1001` (Denpasar) | `Asia/Makassar` |
| `15.71.01.1001` (Jambi) | `Asia/Jakarta` |
| `32.75.01.1001` (Bekasi) | `Asia/Jakarta` |

Karena itu jangan pernah menghitung waktu lokal sendiri dari `datetime`. Pakai `local_datetime`.

## Satu slot - sampel nyata

```json
{
  "datetime": "2026-10-08T06:00:00Z",
  "utc_datetime": "2026-10-08 06:00:00",
  "local_datetime": "2026-10-08 13:00:00",
  "analysis_date": "2026-10-08T00:00:00",
  "time_index": "5-6",
  "weather": 2,
  "weather_desc": "Cerah Berawan",
  "weather_desc_en": "Partly Cloudy",
  "wd_deg": 348,
  "wd": "NW",
  "wd_to": "SE",
  "ws": 11.1,
  "hu": 55,
  "tcc": 88,
  "tp": 0.1,
  "t": 32,
  "vs": null,
  "vs_text": null,
  "image": "https://api-apps.bmkg.go.id/storage/icon/cuaca/cerah berawan-am.svg"
}
```

Perhatikan dua hal:

1. `image` mengandung **spasi** di tengah URL.
2. `vs` dan `vs_text` bernilai `null`.

## Sampel kedua (slot malam)

```json
{
  "datetime": "2026-10-08T15:00:00Z",
  "utc_datetime": "2026-10-08 15:00:00",
  "local_datetime": "2026-10-08 22:00:00",
  "analysis_date": "2026-10-08T00:00:00",
  "time_index": "14-15",
  "weather": 0,
  "weather_desc": "Cerah",
  "weather_desc_en": "Sunny",
  "wd_deg": 236,
  "wd": "SW",
  "wd_to": "NE",
  "ws": 1.5,
  "hu": 77,
  "tcc": 8,
  "tp": 0,
  "t": 28,
  "vs": null,
  "vs_text": null,
  "image": "https://api-apps.bmkg.go.id/storage/icon/cuaca/cerah-pm.svg"
}
```

`local_datetime` 22:00 sedangkan `utc_datetime` 15:00, selisihnya 7 jam untuk zona WIB.

## Pengamatan kode `weather`

Dari pengambilan sampel ke beberapa lokasi:

| `weather` | `weather_desc` teramati | Jumlah |
|---|---|---|
| 0 | Cerah | 13 |
| 1 | Cerah | 38 |
| 2 | Cerah Berawan | 22 |
| 3 | Berawan | 7 |
| 10 | Udara Kabur | 19 |
| 61 | Hujan Ringan | 1 |

Kode `0` dan `1` sama-sama menghasilkan "Cerah". Ini membuktikan **kode numerik tidak bisa dijadikan dasar pemetaan**. Selalu pakai `weather_desc`.

## Skema validasi TypeScript (usulan)

```ts
type Slot = {
  local_datetime: string;
  utc_datetime: string;
  datetime: string;
  analysis_date: string;
  time_index: string;
  weather: number;
  weather_desc: string;
  weather_desc_en: string;
  t: number;
  hu: number;
  tcc: number;
  tp: number | null;
  ws: number | null;
  wd: string | null;
  wd_to: string | null;
  wd_deg: number | null;
  vs: number | null;
  vs_text: string | null;
  image: string | null;
};

type Lokasi = {
  adm1: string; adm2: string; adm3: string; adm4: string;
  provinsi: string; kotkab: string; kecamatan: string; desa: string;
  lon: number; lat: number; timezone: string;
  type?: string;
};

type BmkgResponse = {
  lokasi: Lokasi;
  data: { lokasi: Lokasi; cuaca: Slot[][] }[];
};
```

## Fungsi pembantu

```ts
export const ikonAman = (raw: string | null): string | null =>
  raw ? raw.replace(/ /g, '%20') : null;

export const berpotensiHujan = (s: Slot): boolean =>
  (s.tp != null && s.tp > 0) || /hujan|petir|guntur/i.test(s.weather_desc);

export const semuaSlot = (r: BmkgResponse): Slot[] =>
  r.data.flatMap((d) => d.cuaca.flat());
```

`semuaSlot` meratakan struktur dua tingkat menjadi satu array untuk digambar pada satu sumbu waktu. Lihat `ERD.md` keputusan D2.

## Endpoint master wilayah

Semua mengembalikan 404 (diuji 2026-10-08):

```
/publik/master/region                     /publik/master/provinsi
/publik/master/region?adm1=31             /publik/master/wilayah
/publik/master/region?type=provinsi       /publik/master/wilayah?provinsi=31
/publik/master/region/31                  /publik/master/wilayah?adm1=31
```

Tidak ada daftar wilayah dari API. Pengguna memasukkan `adm4` sendiri.
