---
name: bmkg-weather
description: Use ONLY when writing or debugging code that fetches or renders Indonesian weather forecast data from the BMKG open API (api.bmkg.go.id), including adm4 location codes, forecast parsing, weather display, caching, or rate limits. Covers the verified response shape, mandatory BMKG attribution, local_datetime handling, nullable fields, and icon URL encoding. Trigger on keywords like BMKG, prakiraan cuaca, adm4, cuaca BMKG, weather forecast Indonesia, api.bmkg.go.id, ramalan cuaca.
---

# bmkg-weather

Cara mengonsumsi API prakiraan cuaca BMKG dengan benar untuk proyek **HujanPantau**.

## Endpoint

```
GET https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode}
```

| Sifat | Nilai | Terverifikasi |
|---|---|---|
| Autentikasi | tidak ada | 2026-10-08 |
| CORS | `Access-Control-Allow-Origin: *` | 2026-10-08 |
| Rate limit | **60 request per menit per IP** | dokumentasi resmi |
| Cakupan | 3 hari, 8 slot per hari (interval 3 jam) | dokumentasi resmi |
| Pemutakhiran | 2 kali sehari | dokumentasi resmi |

Karena CORS terbuka, panggil **langsung dari browser**. Jangan membuat proxy di Vercel tanpa alasan kuat.

## Kewajiban hukum: atribusi

Dari portal Data Prakiraan Cuaca BMKG:

> Wajib untuk mencantumkan BMKG (Badan Meteorologi, Klimatologi, dan Geofisika) sebagai sumber data dan menampilkannya pada aplikasi/sistem Anda.

Wajib tampil:

- Teks `Sumber: BMKG` permanen di tab Cuaca.
- Atribusi penuh di footer: `Sumber data: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)`.
- Atribusi ikut terbawa saat ekspor CSV/JSON.

Jangan menghapus atribusi saat menyederhanakan tampilan.

## Empat jebakan terverifikasi

### 1. Jangan konversi UTC sendiri

`timezone` di `lokasi` **berbeda per wilayah**:

```
31.71.01.1001  ->  Asia/Jakarta
51.71.01.1001  ->  Asia/Makassar
```

Kadang nilainya berbentuk `+0700`, bukan nama zona.

**Pakai `local_datetime` apa adanya.** Formatnya `YYYY-MM-DD HH:mm:ss` dalam waktu Indonesia.

```ts
// salah
const local = new Date(slot.datetime);
local.setHours(local.getHours() + 7);   // salah untuk Bali

// benar
const local = slot.local_datetime;       // sudah WIB oleh BMKG
```

### 2. URL ikon mengandung spasi

```
https://api-apps.bmkg.go.id/storage/icon/cuaca/cerah berawan-am.svg
```

`<img src>` gagal memuat URL berisi spasi. Encode dulu:

```ts
const safe = raw.replace(/ /g, '%20');
// atau
const safe = new URL(raw).toString();
```

Juga tutupi kasus `null` karena `image` nullable.

### 3. Kode `weather` tidak stabil

Jangan bikin pemetaan sendiri dari kode numerik. Hasil pengamatan:

| `weather` | `weather_desc` teramati |
|---|---|
| 0 | Cerah |
| 1 | Cerah |
| 2 | Cerah Berawan |
| 3 | Berawan |
| 10 | Udara Kabur |
| 61 | Hujan Ringan |

**`weather_desc` adalah sumber kebenaran.** Untuk penanda risiko hujan:

```ts
const berpotensiHujan =
  (tp != null && tp > 0) || /hujan|petir|guntur/i.test(weather_desc);
```

### 4. Kode `adm4` bisa 404

Kode yang tidak ada mengembalikan **404**, bukan objek kosong. Bedakan dari kegagalan jaringan: tampilkan `Lokasi tidak ditemukan`, sarankan periksa kode lagi.

## Endpoint master wilayah TIDAK ada

Semua ini mengembalikan 404 (diuji 2026-10-08):

```
/publik/master/region                     /publik/master/provinsi
/publik/master/region?adm1=31             /publik/master/wilayah
/publik/master/region?type=provinsi       /publik/master/wilayah?provinsi=31
/publik/master/region/31                  /publik/master/wilayah?adm1=31
```

Konsekuensi: **tidak ada cascade dropdown Provinsi - Kota - Kecamatan - Desa**.

Solusi yang dipakai:

1. Pengguna memasukkan kode `adm4` langsung.
2. Nama lengkap lokasi dibaca dari field `lokasi` pada response yang berhasil.
3. Hasil fetch sukses disimpan sebagai entitas `Wilayah` (lihat `ERD.md`).

Bila nanti butuh daftar wilayah: dataset BPS, atau `apiindonesia.id` (butuh API key).

## Bentuk response

```json
{
  "lokasi": { "adm1": "31", "adm4": "31.71.03.1001", "provinsi": "DKI Jakarta",
              "kotkab": "Kota Adm. Jakarta Pusat", "kecamatan": "Kemayoran",
              "desa": "Kemayoran", "lat": -6.16, "lon": 106.84, "timezone": "Asia/Jakarta" },
  "data": [ { "lokasi": { "...": "identik + field type" },
              "cuaca": [ [ {slot} ], [ {hari 2} ], [ {hari 3} ] ] } ]
}
```

**Iterasi dinamis, jangan hardcode:**

- `data` umumnya berisi 1 entri, tapi bisa berubah.
- `data[].cuaca` = hari, `data[].cuaca[][]` = slot.
- Jumlah slot per hari harus dibaca dari panjang array, bukan diasumsikan 8.

## Field per slot

| Field | Tipe | Null | Arti |
|---|---|---|---|
| `local_datetime` | string | tidak | **pakai ini** |
| `utc_datetime` | string | tidak | UTC |
| `datetime` | string | tidak | ISO 8601 UTC |
| `analysis_date` | string | tidak | waktu produksi data |
| `time_index` | string | tidak | rentang jam, contoh `12-13` |
| `weather` | int | tidak | kode, tidak stabil |
| `weather_desc` | string | tidak | **sumber kebenaran** |
| `weather_desc_en` | string | tidak | versi Inggris |
| `t` | number | tidak | suhu derajat Celsius |
| `hu` | number | tidak | kelembapan persen |
| `tcc` | number | tidak | tutupan awan persen |
| `tp` | number | **ya** | curah hujan mm |
| `ws` | number | **ya** | kecepatan angin km/jam |
| `wd` / `wd_to` | string | **ya** | arah angin asal/tujuan |
| `wd_deg` | number | **ya** | arah angin derajat |
| `vs` / `vs_text` | number/string | **ya** | jarak pandang, sering null |
| `image` | string | **ya** | URL SVG, mengandung spasi |

`null` berarti tidak ada data, **bukan nol**. Tampilkan sebagai `—`, jangan `0`.

## Kode adm4

Format 4 segmen, mengacu pada **Kepmendagri No. 100.1.1-6117 Tahun 2022**:

```
31.71.03.1001
 |  |   |    +-- desa/kelurahan
 |  |   +------- kecamatan
 |  +----------- kot/kab
 +-------------- provinsi
```

Contoh terverifikasi:

| adm4 | Lokasi |
|---|---|
| `31.71.03.1001` | DKI Jakarta, Jakarta Pusat, Kemayoran, Kemayoran |
| `32.75.01.1001` | Jawa Barat, Kota Bekasi, Bekasi Timur, Bekasijaya |
| `51.71.01.1001` | Bali, Kota Denpasar, Denpasar Selatan, Serangan |
| `15.71.01.1001` | Jambi, Kota Jambi, Telanaipura, Simpang IV Sipin |

## Strategi cache

| Aturan | Nilai |
|---|---|
| TTL | 3 jam |
| Kunci | `hujan.bmkg.cache.{adm4}` |
| Stempel | `ts` waktu fetch, disimpan terpisah dari data |
| Gagal + ada cache | tampilkan cache + badge `Data prakiraan sebelumnya` |
| Gagal + tanpa cache | layar kosong + tombol `Coba lagi` |

20 request/jam jauh di bawah limit 60/menit. Aman untuk beberapa pengguna berbagi IP.

## Penanganan error

| Kode | Arti | Tindakan |
|---|---|---|
| 200 | sukses | simpan cache, render |
| 404 | `adm4` tidak dikenal | sarankan periksa kode |
| 429 | rate limit | tunggu 60 detik |
| 5xx | gangguan BMKG | pakai cache |
| error jaringan | offline | tombol `Coba lagi` |
| parse error | bukan JSON | perlakukan sebagai gagal |

**Jangan retry agresif.** Rate limit dibagi per IP, retry malah memperpanjang pelanggaran.
