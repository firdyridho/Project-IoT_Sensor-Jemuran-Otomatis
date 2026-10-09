# API - Kontrak Integrasi

Dokumen ini mengikat tiga antarmuka eksternal yang dipakai **HujanPantau**: MQTT untuk realtime perangkat, BMKG untuk prakiraan cuaca, dan Telegram untuk notifikasi.

| | |
|---|---|
| Versi | 1.0 |
| Tanggal | 2026-10-08 |
| Terkait | `PRD.md` - `ERD.md` |

---

## Bagian A - MQTT Realtime

### A.1 Parameter koneksi

| Nilai | Web (browser) | Firmware (ESP32) |
|---|---|---|
| Protokol | MQTT over WebSocket Secure | MQTT over TCP |
| Port | 8884 (TLS) | 1883 (plaintext) |
| Library | `mqtt` (mqtt.js) | `PubSubClient` |
| Klien ID | `web-{random hex}` | `esp32-{deviceId}` |
| QoS | 0 | 0 |
| Keepalive | 30 detik | 30 detik |
| Clean session | true | true |

Keduanya terhubung ke **broker yang sama**, hanya protokolnya berbeda. Browser tidak bisa memakai port 1883 karena berada di luar kemampuan WebSocket.

### A.2 Server Broker & Endpoint

| Tipe | Endpoint / URL | Port / Protokol | Keterangan |
|---|---|---|---|
| Private Server VPS (Utama) | `wss://43-133-136-149.sslip.io/ws` | WSS (443 SSL) | Server Golang WebSocket Dedicated |
| Private MQTT VPS (ESP32) | `43.133.136.149` | 1883 (TCP MQTT) | Broker Lokal Tencent Cloud |
| EMQX (Fallback) | `wss://broker.emqx.io:8884/mqtt` | 8884 (WSS) | Broker cadangan opsional |
| HiveMQ (Fallback) | `wss://broker.hivemq.com:8884/mqtt` | 8884 (WSS) | Broker cadangan opsional |

### A.3 Struktur topik

```
hujansensor/{deviceId}/state
hujansensor/{deviceId}/telemetry
hujansensor/{deviceId}/event
hujansensor/{deviceId}/cmd        # disiapkan untuk v2, belum dipakai di v1
```

| Topik | Retained | Interval | QoS | Keterangan |
|---|---|---|---|---|
| `state` | **ya** | 5 detik dan saat boot | 0 | Sumber status, termasuk LWT |
| `telemetry` | tidak | 3 detik | 0 | Untuk grafik realtime |
| `event` | tidak | diskret | 0 | Kejadian bertransisi |
| `cmd` | - | - | - | Diblokir di v1, aplikasi bersifat read-only |

`deviceId` berformat `hs-` diikuti 12 karakter hex, contoh `hs-8f3a1c9d2b70`. Pola ini divalidasi oleh sisi web dan menjadi pengaman informal terhadap topik yang salah ketik.

### A.4 Payload `state`

Retained. Juga dipakai sebagai LWT dengan nilai `{"v":1,"status":"offline"}`.

```json
{
  "v": 1,
  "deviceId": "hs-8f3a1c9d2b70",
  "status": "online",
  "fw": "1.0.0",
  "ts": 1763308800000,
  "uptimeS": 84213,
  "rssi": -58,
  "ip": "192.168.1.14",
  "rain": {
    "raw": 812,
    "pct": 18,
    "wet": false,
    "thresholdPct": 60,
    "sinceMs": 1763304600000
  },
  "env": { "tempC": 28.4, "hum": 82 },
  "power": { "vbat": 3.91, "pct": 74, "charging": false },
  "loc": { "adm4": "31.71.03.1001" }
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `v` | int | ya | Versi skema, selalu `1` |
| `deviceId` | string | ya | Harus cocok dengan segmen topik |
| `status` | enum | ya | `online`, `offline` |
| `fw` | string | ya | Versi firmware |
| `ts` | int | ya | Epoch milidetik, jam perangkat |
| `uptimeS` | int | ya | Detik sejak boot |
| `rssi` | int | tidak | dBm, negatif |
| `ip` | string | tidak | Alamat lokal, bersifat informatif |
| `rain.raw` | int | ya | ADC 0-4095 |
| `rain.pct` | int | ya | 0-100 |
| `rain.wet` | bool | ya | Hasil histeresis, bukan pembanding langsung |
| `rain.thresholdPct` | int | ya | Ambang yang dipakai perangkat |
| `rain.sinceMs` | int | ya | Waktu mulai status saat ini |
| `env` | object | tidak | **Boleh null** bila tidak ada DHT |
| `power` | object | tidak | **Boleh null** bila tidak ada pengukur tegangan |
| `loc.adm4` | string | tidak | Dipakai sebagai default lokasi BMKG |

### A.5 Payload `telemetry`

```json
{
  "v": 1,
  "deviceId": "hs-8f3a1c9d2b70",
  "ts": 1763308803000,
  "raw": 815,
  "pct": 18,
  "wet": false,
  "tempC": 28.4,
  "hum": 82,
  "vbat": 3.91,
  "rssi": -58
}
```

Field `env` dan `power` diratakan di sini agar pesan ringkas karena dikirim tiap 3 detik. `tempC`, `hum`, dan `vbat` bertipe `number | null`.

### A.6 Payload `event`

```json
{
  "v": 1,
  "deviceId": "hs-8f3a1c9d2b70",
  "type": "rain_start",
  "ts": 1763308803000,
  "data": { "pct": 78, "raw": 612 }
}
```

| `type` | Arti | `data` |
|---|---|---|
| `rain_start` | Transisi kering ke hujan | `pct`, `raw` |
| `rain_stop` | Transisi hujan ke kering | `pct`, `raw` |
| `device_boot` | Perangkat menyala | `resetReason` |
| `wifi_fail` | Gagal terhubung ke WiFi | `ssid`, `code` |
| `mqtt_retry` | Broker terputus dan sedang mencoba ulang | `attempt`, `delayMs` |

### A.7 Aturan LWT

```cpp
client.connect(clientId, willTopic, willQoS, willRetain, willMessage);
```

| Parameter | Nilai |
|---|---|
| `willTopic` | `hujansensor/{deviceId}/state` |
| `willRetain` | `true` |
| `willQoS` | `0` |
| `willMessage` | `{"v":1,"deviceId":"{id}","status":"offline"}` |

Karena retained, subscriber baru langsung menerima status offline terakhir tanpa harus menunggu. Tanpa LWT, web tidak akan pernah tahu bahwa perangkat sudah mati.

### A.8 Deteksi offline di sisi web

Perangkat dianggap **offline** jika salah satu terpenuhi:

1. Pesan `state` retained dengan `status == "offline"` diterima.
2. `Date.now() - lastSeen > 90_000` milidetik.
3. Koneksi WebSocket ke broker putus (berbeda dengan status perangkat).

Aturan 3 sengaja dipisahkan agar pengguna tidak salah paham. Koneksi web terputus tidak berarti perangkat mati, jadi banner menampilkan `Koneksi broker terputus`, bukan `Perangkat offline`.

Ambang 90 detik dipilih karena interval `state` adalah 5 detik. Memberi 18x lipat toleransi menutupi paket hilang dan jitter broker publik tanpa membuat notifikasi offline terlambat.

---

## Bagian B - API Prakiraan Cuaca BMKG

### B.1 Endpoint

```
GET https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode_wilayah_tingkat_iv}
```

Contoh:

```
GET https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=31.71.03.1001
```

| Sifat | Nilai |
|---|---|
| Metode | `GET` |
| Autentikasi | tidak ada |
| CORS | `Access-Control-Allow-Origin: *` (terverifikasi 2026-10-08) |
| Format | `application/json; charset=utf-8` |
| Batas akses | **60 permintaan per menit per IP** |
| Pemutakhiran | 2 kali sehari |
| Cakupan | 3 hari, 8 data per hari (per 3 jam) |

Karena CORS terbuka, permintaan dilakukan **langsung dari browser**. Tidak perlu proxy di Vercel.

### B.2 Syarat penggunaan yang mengikat

Sumber: portal Data Prakiraan Cuaca BMKG.

> Wajib untuk mencantumkan BMKG (Badan Meteorologi, Klimatologi, dan Geofisika) sebagai sumber data dan menampilkannya pada aplikasi/sistem Anda.

Implementasi diwajibkan oleh FR-21 di `PRD.md`:

- Teks `Sumber: BMKG` tampil permanen di tab Cuaca.
- Atribusi `Sumber data: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)` di footer.
- Jangan menghapus atau menyamarkan atribusi saat mengekspor data.

### B.3 Sumber kode `adm4`

Kode wilayah administrasi tingkat IV mengacu pada **Keputusan Menteri Dalam Negeri Nomor 100.1.1-6117 Tahun 2022**.

```
31.71.03.1001
 |  |   |    |
 |  |   |    +- kode kelurahan/desa
 |  |   +------ kode kecamatan
 |  +---------- kode kot/kab
 +------------- kode provinsi
```

Contoh yang terverifikasi:

| adm4 | Provinsi | Kot/Kab | Kecamatan | Desa |
|---|---|---|---|---|
| `31.71.03.1001` | DKI Jakarta | Kota Adm. Jakarta Pusat | Kemayoran | Kemayoran |
| `32.75.01.1001` | Jawa Barat | Kota Bekasi | Bekasi Timur | Bekasijaya |
| `51.71.01.1001` | Bali | Kota Denpasar | Denpasar Selatan | Serangan |
| `15.71.01.1001` | Jambi | Kota Jambi | Telanaipura | Simpang IV Sipin |

### B.4 Endpoint master wilayah TIDAK tersedia

Endpoint berikut semuanya mengembalikan **404** (diverifikasi 2026-10-08):

```
/publik/master/region
/publik/master/region?adm1=31
/publik/master/region?type=provinsi
/publik/master/wilayah?provinsi=31
/publik/master/wilayah?adm1=31
/publik/master/provinsi
/publik/master/wilayah
/publik/master/region/31
```

Konsekuensinya, aplikasi **tidak bisa membuat cascade dropdown Provinsi - Kota - Kecamatan - Desa** dari API BMKG. Solusi yang dipakai:

1. Pengguna memasukkan kode `adm4` langsung.
2. Nama lengkap lokasi **dibaca dari field `lokasi` pada response** yang berhasil, bukan dari endpoint terpisah.
3. Hasil fetch yang berhasil menyimpan `lokasi` sebagai entitas `Wilayah` di `ERD.md`.

Alternatif bila nanti diperlukan: dataset BPS, atau `apiindonesia.id` (butuh API key).

### B.5 Bentuk response

```json
{
  "lokasi": {
    "adm1": "31", "adm2": "31.71", "adm3": "31.71.03", "adm4": "31.71.03.1001",
    "provinsi": "DKI Jakarta", "kotkab": "Kota Adm. Jakarta Pusat",
    "kecamatan": "Kemayoran", "desa": "Kemayoran",
    "lon": 106.8453837867, "lat": -6.1647214778, "timezone": "Asia/Jakarta"
  },
  "data": [
    {
      "lokasi": { "...": "identik, plus field type": "adm4" },
      "cuaca": [
        [ { "slot pertama" }, { "slot kedua" } ],
        [ { "hari ke-2" } ],
        [ { "hari ke-3" } ]
      ]
    }
  ]
}
```

| Bagian | Bentuk | Catatan |
|---|---|---|
| `lokasi` | objek | Ada di dua tempat, isinya sama |
| `data` | array | Umumnya 1 entri, **iterasi dinamis, jangan hardcode** |
| `data[].cuaca` | array of array | Luarnya hari, dalamnya slot 3 jam |
| `data[].cuaca[][]` | array of objek | Satu slot prakiraan |

### B.6 Field satu slot prakiraan

Contoh nyata (terverifikasi 2026-10-08):

```json
{
  "datetime": "2026-10-08T06:00:00Z",
  "utc_datetime": "2026-10-08 06:00:00",
  "local_datetime": "2026-10-08 13:00:00",
  "analysis_date": "2026-10-08T00:00:00",
  "time_index": "12-13",
  "weather": 2,
  "weather_desc": "Cerah Berawan",
  "weather_desc_en": "Partly Cloudy",
  "t": 32,
  "hu": 55,
  "tcc": 88,
  "tp": 0.1,
  "ws": 11.1,
  "wd": "NW",
  "wd_to": "SE",
  "wd_deg": 348,
  "vs": null,
  "vs_text": null,
  "image": "https://api-apps.bmkg.go.id/storage/icon/cuaca/cerah berawan-am.svg"
}
```

| Field | Tipe | Null | Arti |
|---|---|---|---|
| `local_datetime` | string | tidak | **Waktu lokal, format `YYYY-MM-DD HH:mm:ss`** |
| `utc_datetime` | string | tidak | Waktu UTC |
| `datetime` | string | tidak | ISO 8601 UTC |
| `analysis_date` | string | tidak | Waktu produksi data |
| `time_index` | string | tidak | Rentang jam, contoh `12-13` |
| `weather` | int | tidak | Kode numerik, **tidak stabil** |
| `weather_desc` | string | tidak | **Sumber kebenaran** kondisi cuaca |
| `weather_desc_en` | string | tidak | Versi Inggris |
| `t` | number | tidak | Suhu udara derajat Celsius |
| `hu` | number | tidak | Kelembapan udara persen |
| `tcc` | number | tidak | Tutupan awan persen |
| `tp` | number | **ya** | Curah hujan, satuan mm |
| `ws` | number | **ya** | Kecepatan angin km/jam |
| `wd` | string | **ya** | Arah angin asal, contoh `NW` |
| `wd_to` | string | **ya** | Arah angin tujuan, contoh `SE` |
| `wd_deg` | number | **ya** | Arah angin derajat |
| `vs` | number | **ya** | Jarak pandang, sering null |
| `vs_text` | string | **ya** | Jarak pandang terformat, sering null |
| `image` | string | **ya** | URL ikon SVG, **mengandung spasi** |

---

### B.7 Empat jebakan terverifikasi

Semua hal di bawah diuji langsung terhadap API pada 2026-10-08. Lewati satu saja dan halaman Cuaca akan rusak.

#### Jebakan 1 - Jangan konversi waktu UTC sendiri

Field `timezone` pada `lokasi` **berbeda per wilayah**:

```
31.71.01.1001  ->  Asia/Jakarta
51.71.01.1001  ->  Asia/Makassar
```

Pada response lain, `timezone` kadang berbentuk `+0700`, bukan nama zona. Menghitung sendiri `UTC + 7` akan salah untuk Bali, Sulawesi, dan Maluku.

**Aturan: gunakan `local_datetime` apa adanya.** Field ini sudah dikonversi ke waktu Indonesia oleh BMKG.

#### Jebakan 2 - URL ikon mengandung spasi

```
https://api-apps.bmkg.go.id/storage/icon/cuaca/cerah berawan-am.svg
```

Spasi di tengah URL membuat `<img src>` gagal dimuat. Perbaiki dengan:

```ts
const safeUrl = new URL(raw).toString();   // spasi jadi %20
// atau
const safeUrl = raw.replace(/ /g, '%20');
```

Pasangan `weather_desc` dan `image` teramati mengandung spasi, contoh `cerah berawan`, `hujan ringan`.

#### Jebakan 3 - Kode `weather` tidak stabil

Kode numerik yang sama tidak selalu berarti deskripsi yang sama. Hasil pengamatan:

| `weather` | `weather_desc` teramati |
|---|---|
| 0 | Cerah |
| 1 | Cerah |
| 2 | Cerah Berawan |
| 3 | Berawan |
| 10 | Udara Kabur |
| 61 | Hujan Ringan |

Karena itu **jangan membuat pemetaan sendiri dari `weather` ke ikon atau label**. Pakai `weather_desc` sebagai sumber kebenaran, dan untuk penanda hujan gunakan:

```ts
const berpotensiHujan =
  (tp != null && tp > 0) ||
  /hujan|petir|guntur/i.test(weather_desc);
```

#### Jebakan 4 - Beberapa kode `adm4` tidak valid

Permintaan dengan kode yang tidak ada mengembalikan 404, bukan objek kosong. Beberapa kode yang perlu diverifikasi terlebih dahulu. Tangani `404` sebagai "lokasi tidak ditemukan", tampilkan pesan yang jelas, dan jangan anggap sebagai kegagalan jaringan.

### B.8 Strategi cache

| Aturan | Nilai |
|---|---|
| TTL | 3 jam |
| Kunci | `hujan.bmkg.cache.{adm4}` |
| Stempel | `ts` waktu fetch, disimpan terpisah dari data |
| Saat kedaluwarsa | fetch ulang, tampilkan data lama saat menunggu dengan penanda `Data prakiraan sebelumnya` |
| Saat fetch gagal dan ada cache | tampilkan cache + badge `Tidak dapat memperbarui data` |
| Saat fetch gagal dan tidak ada cache | layar kosong dengan tombol `Coba lagi` |

Dengan TTL 3 jam, pemakaian maksimum adalah **20 request per jam per pengguna**, jauh di bawah batas 60 per menit. Perkiraan harian sekitar 480 request, masih aman untuk beberapa pengguna berbagi IP (misalnya jaringan kantor atau kampus).

### B.9 Penanganan error

| Kode | Arti | Tindakan pengguna |
|---|---|---|
| 200 | Berhasil | Simpan cache, render |
| 404 | Kode `adm4` tidak dikenal | Sarankan memeriksa kembali kode |
| 429 | Rate limit tercapai | Tunggu 60 detik, jangan retry otomatis |
| 5xx | Gangguan di sisi BMKG | Pakai cache, tampilkan `Data prakiraan sebelumnya` |
| Error jaringan | Offline atau CORS ditolak | Tampilkan `Koneksi bermasalah`, tombol `Coba lagi` |
| Parse error | Response bukan JSON valid | Perlakukan sebagai kegagalan |

Jangan melakukan retry otomatis yang agresif. Endpoint ini berbagi rate limit per IP, dan retry malah membuat pelanggaran berkelanjutan.

---

## Bagian C - Telegram Bot API

### C.1 Endpoint

```
POST https://api.telegram.org/bot{TOKEN}/sendMessage
Content-Type: application/json
```

Permintaan dilakukan **dari ESP32**, bukan dari browser. Token bot tidak pernah berada di frontend.

### C.2 Body permintaan

```json
{
  "chat_id": "123456789",
  "text": "Hujan terdeteksi\nJemuran Utama - 14:32 WIB\n\nBasah: 78% (analog 612)\nSuhu: 27.4 C - Lembap: 91%\n\nSegera ambil jemuran.",
  "parse_mode": "HTML",
  "disable_notification": false
}
```

| Field | Tipe | Keterangan |
|---|---|---|
| `chat_id` | string atau int | ID pengguna atau grup |
| `text` | string | Maksimal 4096 karakter |
| `parse_mode` | string | `HTML` dipilih daripada Markdown agar lebih toleran terhadap karakter khusus |
| `disable_notification` | bool | `false` agar pesan berdering |

### C.3 Keamanan konten

Karena `parse_mode: HTML`, teks yang disisipkan harus di-escape agar pesan tidak gagal dikirim:

```html
&  ->  &amp;
<  ->  &lt;
>  ->  &gt;
```

Lakukan escape pada semua nilai yang berasal dari perangkat atau input pengguna, termasuk nama perangkat.

### C.4 Aturan cooldown

| Transisi | Cooldown | Alasan |
|---|---|---|
| Kering ke Hujan | 10 menit | Mencegah spam akibat sensor bolak-balik |
| Hujan ke Kering (durasi < 5 menit) | tidak kirim | Bukan hujan sungguhan |
| Hujan ke Kering (durasi >= 5 menit) | 30 menit | Balasan konfirmasi, lebih jarang |
| Offline >= 5 menit ke Online | 30 menit | Menandai pemulihan |

Simpan waktu pengiriman terakhir di RTC atau LittleFS agar cooldown bertahan setelah reboot.

### C.5 Tanggapan

| Status | Arti | Penanganan |
|---|---|---|
| 200, `ok: true` | Terkirim | Catat waktu kirim terakhir |
| 400 | Chat ID salah atau format pesan invalid | Hentikan percobaan, log ke serial |
| 401 | Token salah | Hentikan pengiriman, jangan ulangi |
| 429 | Terlalu sering | Hormati `retry_after` dari response |
| Timeout | Gangguan jaringan | Coba ulang sekali setelah 5 detik, lalu hentikan |

Jangan memblokir loop utama firmware selama request HTTP. Kirim di tugas terpisah atau beri timeout 5 detik.

---

## Bagian D - Perubahan Kontrak dan Versi

| Tingkat | Contoh | Tindakan |
|---|---|---|
| Minor | Menambah field opsional | Aman, web mengabaikan field tak dikenal |
| Mayor | Menambah field wajib | Naikkan `v`, buat web menerima dua versi sementara |
| Merusak | Menghapus atau mengubah tipe field | Naikkan `v` dan perbarui firmware bersamaan dengan web |

Aturan wajib:

1. **Web harus menolak `v` yang tidak dikenal**, bukan menebak-nebak bentuknya.
2. **Field yang dihapus tidak dihapus dari web dalam satu rilis.** Tandai deprecated dulu.
3. **`env` dan `power` selalu boleh null.** Menambahkan sensor baru tidak boleh membuat payload lama gagal divalidasi.
4. **Setiap payload diverifikasi sebelum masuk store** sesuai `ERD.md` bagian 8.
