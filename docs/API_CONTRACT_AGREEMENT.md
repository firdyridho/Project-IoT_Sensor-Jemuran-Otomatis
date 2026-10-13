# Frontend & Backend API Contract Agreement

| Atribut | Keterangan |
| :--- | :--- |
| **Dokumen** | Perjanjian Kontrak Antarmuka Komunikasi Data (API & WebSocket) |
| **Pihak Terikat** | Backend Engineering Team & Frontend Engineering Team |
| **Versi Kontrak** | 1.0 (Mengikat & Berlaku untuk Produksi dan Staging) |
| **Tanggal Kesepakatan**| 2026-10-13 |
| **Dokumen Terkait** | [`PRD.md`](./PRD.md) / [`ERD.md`](./ERD.md) / [`API.md`](./API.md) / [`TASKS.md`](./TASKS.md) |

---

## 1. Latar Belakang dan Tujuan Kesepakatan

Dokumen ini disusun sebagai perjanjian teknis resmi (*Service Level Agreement & Interface Contract*) antara tim **Backend Engineer** dan **Frontend Developer** pada repositori `Project-IoT_Sensor-Jemuran-Otomatis`. 

Tujuan perjanjian ini adalah:
1. Memastikan konsistensi penamaan properti JSON, struktur payload, tipe data, dan format waktu di seluruh lapisan aplikasi.
2. Mencegah terjadinya inkonsistensi status perangkat keras, interferensi antar-perangkat (*data bleed*), dan bug multi-tenancy.
3. Menetapkan batasan tanggung jawab yang jelas antar-tim sesuai prosedur kerja standar (SOP).

---

## 2. Batas Tanggung Jawab Tim (Boundary Agreement)

### 2.1 Tanggung Jawab Backend Engineer
* Mengelola keandalan server VPS Linux (Tencent Cloud), database MySQL 5.7, cache Redis, dan private MQTT Mosquitto broker.
* Menyediakan endpoint REST API, siaran WebSocket realtime, dan modul kecerdasan buatan (AI Engine).
* Mengelola sinkronisasi logika firmware mikrokontroler ESP32 dengan backend.
* **Larangan**: Backend Engineer dilarang mengubah berkas kode pada direktori `frontend/`. Seluruh kebutuhan komponen visual dan tampilan harus diajukan melalui `docs/FRONTEND_REQUESTS.md`.

### 2.2 Tanggung Jawab Frontend Developer
* Membangun antarmuka pengguna (UI/UX) berbasis React 19, TypeScript, dan Tailwind CSS v4.
* Mengelola manajemen state peramban, filtrasi data per-perangkat aktif, dan penyimpanan lokal (*LocalStorage*).
* Mengimplementasikan visualisasi grafik, audio alert, dan pemanggilan API cuaca terbuka BMKG.
* **Larangan**: Frontend Developer dilarang mengubah struktur database, port jaringan server, atau logika firmware ESP32 tanpa koordinasi resmi melalui `docs/BACKEND_REQUESTS.md`.

---

## 3. Konvensi Format Data dan Standar Serialisasi

### 3.1 Penamaan Kunci JSON
* Seluruh kunci properti JSON pada antarmuka REST API dan WebSocket **wajib menggunakan format `camelCase`**.
* Contoh valid: `deviceId`, `lastSeenAt`, `motorPosition`, `tempC`, `hum`, `ambangPct`.
* Penggunaan `snake_case` (contoh: `device_id`) hanya diizinkan secara internal pada kolom database relasional MySQL.

### 3.2 Representasi Waktu dan Timestamp
1. **Model Entitas dan Riwayat Database**: Menggunakan string standar ISO 8601 UTC dengan akhiran `Z` (contoh: `2026-10-12T13:30:00Z`).
2. **Deret Waktu Realtime dan Telemetri Sensor**: Menggunakan integer Unix Epoch dalam satuan milidetik (`ts`, contoh: `1791782340572`).

### 3.3 Format Respon Kesalahan Standar (Error Handling)
Setiap tanggapan error HTTP (4xx dan 5xx) wajib mengembalikan objek JSON dengan struktur seragam:
```json
{
  "error": "Pesan deskripsi kesalahan dalam Bahasa Indonesia"
}
```

Daftar kode status HTTP yang disepakati:
* `200 OK`: Permintaan berhasil diproses.
* `201 Created`: Entitas baru (pengguna atau perangkat) berhasil dibuat.
* `400 Bad Request`: Payload JSON tidak valid atau parameter wajib tidak disertakan.
* `401 Unauthorized`: Token sesi tidak valid, kedaluwarsa, atau tidak disertakan.
* `404 Not Found`: Data perangkat atau rekaman tidak ditemukan di database.
* `409 Conflict`: Username atau deviceId sudah terdaftar sebelumnya.
* `429 Too Many Requests`: Batas laju pemanggilan API terlampaui (rate limit).
* `500 Internal Server Error`: Terjadi kegagalan pemrosesan pada internal server.

---

## 4. Kontrak Saluran Realtime WebSocket (`/ws`)

### 4.1 Selubung Pesan (Envelope Format)
Setiap pesan siaran dari backend ke frontend dibungkus dalam selubung baku:
```json
{
  "type": "telemetry" | "state" | "motor" | "event" | "forecast_alert",
  "payload": { ... }
}
```

### 4.2 Skema Payload Berdasarkan Tipe Event

#### A. Tipe `telemetry`
```typescript
interface TelemetryPayload {
  v: number;               // Selalu 1
  deviceId: string;        // ID perangkat pengirim (contoh: hs-24e1796dc9a1)
  ts: number;              // Epoch milidetik waktu pengukuran
  raw: number;             // Nilai analog ADC sensor hujan (0 - 4095)
  pct: number;             // Persentase kebasahan terhitung (0 - 100)
  wet: boolean;            // Status logika kebasahan
  tempC: number | null;    // Temperatur udara Celsius
  hum: number | null;      // Kelembapan udara persen
  vbat: number | null;     // Voltase baterai perangkat
  rssi: number | null;     // Kekuatan sinyal WiFi dalam dBm
}
```

#### B. Tipe `state`
```typescript
interface StatePayload {
  v: number;
  deviceId: string;
  status: "online" | "offline";
  fw?: string;
  uptimeS?: number;
  motor?: {
    position: "sheltered" | "extended";
    status: "idle" | "moving";
    lastMovedTs: number;
  };
}
```

#### C. Tipe `motor`
```typescript
interface MotorPayload {
  deviceId: string;
  position: "sheltered" | "extended";
  status: "idle" | "moving";
  lastMovedTs: number;
}
```

### 4.3 Klausul Kritis: Aturan Filtrasi Multi-Tenancy di Sisi Frontend
Karena koneksi WebSocket bertindak sebagai saluran siaran (*broadcast hub*) yang meneruskan paket dari seluruh mikrokontroler aktif di VPS, **Frontend terikat perjanjian untuk memvalidasi ID perangkat sebelum memperbarui state UI**:
```typescript
// ATURAN KONTRAK: Wajib dieksekusi di seluruh listener WebSocket frontend
if (payload.deviceId && activeDeviceId && payload.deviceId !== activeDeviceId) {
  return; // DILARANG memperbarui state jika ID tidak cocok dengan perangkat aktif
}
```
Pelanggaran terhadap klausul ini menyebabkan status perangkat asing atau fiktif ikut-ikutan berubah menjadi online (*data bleed*).

---

## 5. Kontrak Watchdog Status Offline dan Online

Untuk menjamin sinkronisasi visual yang akurat antara kondisi fisik perangkat dan antarmuka web:
1. **Ambang Batas Staleness**: Disepakati seragam sebesar **6 Detik** (ESP32 mengirim data setiap 2 detik dan keepalive broker diset 5 detik).
2. **Kondisi Offline**: Perangkat wajib ditandai sebagai **Offline** di sisi UI jika:
   * Nilai `lastSeenTs === 0` atau belum pernah menerima telemetri.
   * Paket status terakhir yang diterima memiliki nilai `status === "offline"`.
   * Selisih waktu sekarang dengan transmisi terakhir melebihi 6 detik (`Date.now() - lastSeenTs > 6000`).
3. **Inisialisasi Halaman & Beralih Perangkat**: Saat pengguna memuat halaman pertama kali atau memilih perangkat lain di dropdown header, frontend wajib membaca status riil dari backend. Jika status di backend adalah `offline`, UI tidak boleh menampilkan status online semu.

---

## 6. Kontrak State Machine Aktuator Motor Jemuran

### 6.1 Nilai Posisi dan Status yang Valid
* **Posisi Fisik (`position`)**:
  * `sheltered`: Jemuran berada di dalam area beratap / terlindung dari hujan.
  * `extended`: Jemuran berada di luar area beratap untuk menjemur pakaian.
* **Status Dinamika (`status`)**:
  * `idle`: Motor sedang diam dan berada pada posisi stabil.
  * `moving`: Motor sedang dalam proses pergerakan fisik.

### 6.2 Perintah Kontrol Manual (`POST /api/devices/:id/motor/command`)
* Parameter `action`:
  * `retract`: Menarik jemuran masuk ke posisi `sheltered`.
  * `extend`: Mendorong jemuran keluar ke posisi `extended`.
* **Idempotensi**: Pengiriman perintah `retract` saat jemuran sudah berada di posisi `sheltered` harus direspons sukses tanpa memicu pergerakan fisik berlebih.

---

## 7. Kontrak Autentikasi dan Pengelolaan Sesi

1. **Header Autentikasi**: Seluruh pemanggilan endpoint privat wajib menyertakan header `Authorization: Bearer <token>`.
2. **Penanganan Token Kedaluwarsa (HTTP 401)**:
   * Frontend wajib menangkap respon `401 Unauthorized`.
   * Frontend wajib menghapus kunci `rintik_session` dari LocalStorage dan mengarahkan tampilan ke halaman login tanpa menimbulkan crash aplikasi.

---

## 8. Prosedur Perubahan Kontrak (Change Protocol)

1. Perubahan properti data, penambahan endpoint baru, atau modifikasi logika status wajib diajukan melalui:
   * Dari Frontend ke Backend: [docs/BACKEND_REQUESTS.md](BACKEND_REQUESTS.md)
   * Dari Backend ke Frontend: [docs/FRONTEND_REQUESTS.md](FRONTEND_REQUESTS.md)
2. Setiap perubahan yang disepakati harus diperbarui pada dokumen ini ([docs/API_CONTRACT_AGREEMENT.md](API_CONTRACT_AGREEMENT.md)) sebelum kode diimplementasikan ke branch produksi (`main`).

---

## 9. Lembar Pengesahan Perjanjian

| Perwakilan Tim | Peran | Status Persetujuan |
| :--- | :--- | :--- |
| **Backend Engineering Team** | Arsitektur Server, Database & IoT | [x] DISETUJUI & DITERAPKAN |
| **Frontend Engineering Team** | Arsitektur SPA UI/UX & Client State | [x] DISETUJUI & DITERAPKAN |
