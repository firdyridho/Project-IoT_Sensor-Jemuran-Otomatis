# API - Kontrak Integrasi dan Spesifikasi Endpoint

| Atribut | Keterangan |
| :--- | :--- |
| **Nama Sistem** | HujanPantau API & Realtime Gateway |
| **Versi Dokumen** | 2.0 (Kontrak Terpadu REST, WebSocket & MQTT) |
| **Status** | Aktif / Produksi & Staging |
| **Tanggal Pembaruan** | 2026-10-13 |
| **Dokumen Terkait** | [`PRD.md`](./PRD.md) / [`ERD.md`](./ERD.md) / [`API_CONTRACT_AGREEMENT.md`](./API_CONTRACT_AGREEMENT.md) |

---

## 1. Lingkungan Endpoint dan Base URL

| Lingkungan | Protokol HTTP Base URL | Protokol WebSocket URL | Broker MQTT VPS |
| :--- | :--- | :--- | :--- |
| **Staging** | `https://staging-43-133-136-149.sslip.io` | `wss://staging-43-133-136-149.sslip.io/ws` | `43.133.136.149:1883` |
| **Produksi** | `https://43-133-136-149.sslip.io` | `wss://43-133-136-149.sslip.io/ws` | `43.133.136.149:1883` |
| **Lokal (Dev)** | `http://localhost:8080` | `ws://localhost:8080/ws` | `127.0.0.1:1883` |

---

## 2. Bagian A - Private MQTT Broker (Hardware & Daemon)

Broker MQTT berjalan secara privat pada server VPS Tencent Cloud (Singapura) untuk mengeliminasi ketergantungan pada server publik gratis.

### A.1 Parameter Koneksi Perangkat Keras
* **Host Broker**: `43.133.136.149`
* **Port TCP**: `1883` (Plaintext untuk mikrokontroler ESP32)
* **Port WebSockets**: `9001` (Opsional gateway WebSocket)
* **Keepalive**: `5 detik` (Agar pemutusan koneksi terdeteksi instan)
* **QoS**: `0` atau `1`
* **LWT (Last Will and Testament)**:
  * Topik: `hujansensor/{deviceId}/state`
  * Payload: `{"v":1,"deviceId":"{deviceId}","status":"offline"}`
  * Retained: `true`

### A.2 Struktur Topik MQTT

| Pola Topik | Arah Aliran Data | Format Payload | Deskripsi Fungsi |
| :--- | :--- | :--- | :--- |
| `hujansensor/{deviceId}/telemetry` | ESP32 ke Backend | JSON Standar | Pengiriman data sensor analog reguler setiap 2 detik. |
| `hujansensor/{deviceId}/state` | ESP32 ke Backend | JSON Standar | Pengumuman status online saat boot dan LWT saat putus. |
| `hujansensor/{deviceId}/event` | ESP32 ke Backend | JSON Standar | Peristiwa transisi mendadak (`rain_start`, `rain_stop`). |
| `hujansensor/{deviceId}/cmd` | Backend ke ESP32 | `{"cmd":"tarik"}` | Perintah kontrol motor arah ke dalam area teduh. |
| `{deviceId}/data` | ESP32 ke Backend | JSON Ringkas | Format data firmware kustom ADC dan status jemuran. |
| `{deviceId}/control` | Backend ke ESP32 | Teks Mentah | Perintah string langsung (`tarik` atau `dorong`). |

### A.3 Contoh Payload Telemetri Standar (`telemetry`)
```json
{
  "v": 1,
  "deviceId": "hs-24e1796dc9a1",
  "ts": 1791782340572,
  "raw": 4095,
  "pct": 0,
  "wet": false,
  "tempC": 28.5,
  "hum": 68.0,
  "vbat": 4.10,
  "rssi": -65
}
```

---

## 3. Bagian B - REST API Endpoints

Seluruh tanggapan sukses menggunakan kode HTTP standar (200 OK, 201 Created). Tanggapan kesalahan selalu mengembalikan objek JSON berstruktur `{ "error": "Pesan deskripsi kesalahan" }`.

### B.1 Sistem dan Pemantauan
* **GET `/health`**
  * Keterangan: Memeriksa ketersediaan dan versi layanan backend.
  * Autentikasi: Publik (tanpa token).
  * Respon `200 OK`:
    ```json
    {
      "app": "HujanPantau-Backend",
      "status": "healthy",
      "version": "1.0.0"
    }
    ```

### B.2 Autentikasi Pengguna
* **POST `/api/auth/register`**
  * Keterangan: Mendaftarkan akun baru pemilik jemuran.
  * Request Body:
    ```json
    {
      "username": "budi_santoso",
      "name": "Budi Santoso",
      "password": "passwordAman123"
    }
    ```
  * Respon `201 Created`:
    ```json
    {
      "message": "Pendaftaran berhasil",
      "user": {
        "id": "usr-1763308800",
        "username": "budi_santoso",
        "name": "Budi Santoso"
      }
    }
    ```

* **POST `/api/auth/login`**
  * Keterangan: Autentikasi akun dan penerbitan bearer token sesi.
  * Request Body:
    ```json
    {
      "username": "budi_santoso",
      "password": "passwordAman123"
    }
    ```
  * Respon `200 OK`:
    ```json
    {
      "token": "usr-1763308800:1763395200:signature_hash",
      "user": {
        "id": "usr-1763308800",
        "username": "budi_santoso",
        "name": "Budi Santoso"
      }
    }
    ```

* **GET `/api/auth/me`**
  * Keterangan: Mengambil data profil sesi pengguna yang sedang aktif.
  * Header: `Authorization: Bearer <token>`
  * Respon `200 OK`: Data entitas user.

### B.3 Manajemen Perangkat
* **GET `/api/devices`**
  * Keterangan: Mengambil daftar perangkat yang terdaftar untuk akun aktif.
  * Parameter Query: `userId` (opsional bila header Bearer disertakan).
  * Respon `200 OK`:
    ```json
    [
      {
        "deviceId": "hs-24e1796dc9a1",
        "userId": "usr-demo-admin",
        "name": "Jemuran ESP32 Utama",
        "brokerUrl": "wss://43-133-136-149.sslip.io/ws",
        "lokasiAdm4": "31.71.03.1001",
        "ambangPct": 60,
        "status": "online",
        "motorPosition": "extended",
        "motorStatus": "idle",
        "motorLastMovedAt": "2026-10-12T13:30:00Z",
        "telegramChatId": "7642668349",
        "lastSeenAt": "2026-10-12T13:30:02Z",
        "createdAt": "2026-10-09T16:39:23Z",
        "updatedAt": "2026-10-12T13:30:02Z"
      }
    ]
    ```

* **POST `/api/devices`**
  * Keterangan: Mendaftarkan perangkat jemuran baru.
  * Request Body:
    ```json
    {
      "deviceId": "hs-abcdef123456",
      "name": "Jemuran Halaman Depan",
      "lokasiAdm4": "32.73.01.1001",
      "ambangPct": 65,
      "telegramChatId": "7642668349"
    }
    ```
  * Respon `201 Created`: Objek perangkat terdaftar.

* **DELETE `/api/devices/:id`**
  * Keterangan: Menghapus perangkat beserta seluruh riwayat telemetri dan log terkait.
  * Respon `200 OK`:
    ```json
    {
      "message": "Perangkat dan riwayat berhasil dihapus"
    }
    ```

### B.4 Kontrol Motor Aktuator Jemuran
* **GET `/api/devices/:id/motor`**
  * Keterangan: Mengambil posisi dan status motor aktuator perangkat.
  * Respon `200 OK`:
    ```json
    {
      "deviceId": "hs-24e1796dc9a1",
      "position": "extended",
      "status": "idle",
      "lastMovedTs": 1791782340572
    }
    ```

* **POST `/api/devices/:id/motor/command`**
  * Keterangan: Mengirim perintah manual gerak motor (menarik ke dalam atau mendorong ke luar).
  * Request Body:
    ```json
    {
      "action": "retract"
    }
    ```
    *Nilai `action`: `retract` (menarik ke tempat teduh) atau `extend` (mendorong ke luar untuk menjemur).*
  * Respon `200 OK`:
    ```json
    {
      "message": "Perintah motor berhasil dikirim",
      "action": "retract",
      "position": "sheltered"
    }
    ```

### B.5 Riwayat Telemetri dan Ekspor Data
* **GET `/api/devices/:id/telemetry`**
  * Keterangan: Mengambil deret waktu telemetri sensor untuk grafik dashboard.
  * Parameter Query:
    * `range`: `5m`, `1h`, `24h`, atau `7d` (default: `1h`).
  * Respon `200 OK`: Array objek pembacaan telemetri (`raw`, `pct`, `wet`, `tempC`, `hum`, `vbat`, `rssi`).

* **GET `/api/telemetry/export`**
  * Keterangan: Mengunduh riwayat telemetri dalam format berkas CSV.
  * Parameter Query: `deviceId` (wajib), `limit` (opsional, default 5000).
  * Respon `200 OK`: File stream `Content-Type: text/csv`.

### B.6 Kecerdasan Buatan (AI Engine & Prediction)
* **POST `/api/ai/predict-rain`**
  * Keterangan: Menganalisis tren penurunan suhu, kenaikan kelembapan, dan fluktuasi ADC untuk memprediksi potensi hujan.
  * Request Body:
    ```json
    {
      "deviceId": "hs-24e1796dc9a1",
      "lookbackMinutes": 30
    }
    ```
  * Respon `200 OK`:
    ```json
    {
      "status": "success",
      "deviceId": "hs-24e1796dc9a1",
      "analyzedAt": "2026-10-12T13:30:00Z",
      "prediction": {
        "willRain": true,
        "probabilityPct": 85,
        "estimatedMinutesUntilRain": 18,
        "confidenceLevel": "tinggi",
        "trendFactors": {
          "humidityDelta": "+14.2% dalam 30m",
          "tempDelta": "-2.1 C dalam 30m",
          "adcTrend": "penurunan nilai resistansi terdeteksi"
        },
        "summary": "Lonjakan kelembapan udara disertai penurunan suhu mengindikasikan awan konvektif tebal."
      }
    }
    ```

* **GET `/api/ai/drying-advice`**
  * Keterangan: Memberikan rekomendasi cerdas kondisi penjemuran pakaian berdasarkan sensor dan prakiraan BMKG.
  * Parameter Query: `deviceId` (wajib).
  * Respon `200 OK`:
    ```json
    {
      "status": "success",
      "deviceId": "hs-24e1796dc9a1",
      "advice": {
        "recommendation": "aman_jemur",
        "dryingScore": 88,
        "estimatedDryHours": 2.5,
        "bestDryingWindow": "08:30 - 13:00 WIB",
        "bmkgWeatherDesc": "Cerah Berawan",
        "actionMessage": "Kondisi sangat baik untuk menjemur pakaian tebal."
      }
    }
    ```

* **GET `/api/ai/predictions/history`**
  * Keterangan: Mengambil riwayat catatan prediksi AI beserta skor akurasi masa lampau.
  * Parameter Query: `deviceId` (wajib), `limit` (default: 20).

### B.7 Simulator Cuaca (Testing & Demonstrasi)
* **POST `/api/simulator/weather`**
  * Keterangan: Menginjeksikan kondisi cuaca buatan ke server untuk pengujian tanpa harus menunggu hujan riil.
  * Request Body:
    ```json
    {
      "deviceId": "hs-24e1796dc9a1",
      "condition": "hujan"
    }
    ```
    *Pilihan `condition`: `cerah`, `mendung`, `gerimis`, `hujan`, `badai`.*
  * Respon `200 OK`: Mengembalikan data simulasi yang langsung disiarkan ke WebSocket.

---

## 4. Bagian C - Saluran Realtime WebSocket (`/ws`)

Klien frontend menghubungkan WebSocket ke endpoint `/ws` untuk menerima siaran realtime dari server.

### C.1 Format Selubung Pesan (Message Envelope)
Setiap pesan yang dikirimkan oleh server dibungkus dalam struktur standar:
```json
{
  "type": "telemetry",
  "payload": { ... }
}
```

### C.2 Daftar Jenis Event (`type`)
1. **`telemetry`**: Paket pembacaan sensor berkala dari ESP32.
2. **`state`**: Status perangkat (`online` atau `offline`).
3. **`motor`**: Pembaruan posisi fisik motor (`position: "sheltered" | "extended"`).
4. **`event`**: Kejadian transisi (`type: "rain_start" | "rain_stop"`).
5. **`forecast_alert`**: Peringatan hujan mendadak hasil deteksi mesin AI.

### C.3 Aturan Filtrasi Wajib di Sisi Frontend
Karena WebSocket menyiarkan data ke seluruh peramban yang terhubung, **frontend wajib memfilter ID perangkat sebelum memperbarui state UI**:
```typescript
if (payload.deviceId && currentActiveDeviceId && payload.deviceId !== currentActiveDeviceId) {
  return; // Abaikan data dari perangkat lain
}
```

---

## 5. Bagian D - Integrasi Eksternal BMKG Open Data

Frontend mengambil data cuaca resmi langsung dari Open Data BMKG Indonesia menggunakan kode wilayah kelurahan (ADM4).

* **URL Endpoint**:
  `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kodeAdm4}`
* **Contoh Pemanggilan**:
  `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=31.71.03.1001`
* **Format Data Output**:
  Array prakiraan cuaca 3 harian dengan slot waktu per 3 jam, mencakup parameter suhu (`t`), kelembapan (`hu`), kecepatan angin (`ws`), arah angin (`wd`), dan deskripsi cuaca (`weather_desc`).
