# Rencana Kerja dan Manajemen Task: Backend & Frontend

Dokumen ini berfungsi sebagai peta jalan teknis (Roadmap & Backlog) dan panduan pembagian kerja antara pengembangan Backend (Golang, Database, Engine AI) dan Web Frontend (React, UI/UX, Visualisasi AI).

Tujuan dokumen ini adalah menjaga struktur pengembangan tetap rapi, memungkinkan Backend Engineer fokus penuh pada server dan logika data, serta mempermudah pendelegasian atau implementasi antarmuka frontend ketika fitur baru (seperti AI dan otomasi) ditambahkan.

---

## 1. Pembagian Peran dan Alur Kerja

* **Fokus Backend Engineer**:
  * Mengembangkan logika server, routing API, dan WebSocket hub di Golang.
  * Manajemen schema database MySQL dan optimasi in-memory cache Redis.
  * Pemrosesan data telemetri ESP32 dan listener MQTT.
  * Penyediaan endpoint analitik dan model kecerdasan buatan (AI) untuk prediksi hujan dan rekomendasi jemuran.
* **Fokus Frontend / UI Implementer**:
  * Konsumsi REST API dan WebSocket dari Backend.
  * Penyajian data dan visualisasi interaktif (grafik, status perangkat, peta cuaca).
  * Pembuatan komponen antarmuka untuk fitur AI (kartu rekomendasi, indikator probabilitas, asisten prediksi).
  * Pengalaman pengguna (responsivitas mobile, tema gelap/terang, PWA).

---

## 2. Standar Kontrak API (API Contract First)

Sebelum sebuah fitur dibuat di frontend, Backend Engineer menentukan kontrak data (Request & Response) terlebih dahulu. Dengan pola ini:
1. Backend dapat menguji endpoint secara independen menggunakan cURL atau Postman.
2. Frontend dapat langsung dibuat menggunakan mock data sementara backend menyempurnakan kalkulasi atau model AI.

---

## 3. Daftar Task Backend (Fokus Utama Backend Engineer)

### Fase 1: Fondasi Autentikasi dan Multi-User [SELESAI]
* [x] **BE-01: Skema Database User**: Pembuatan model `User` dengan kolom `id`, `username`, `name`, `password_hash`.
* [x] **BE-02: Isolasi Data Perangkat**: Menambahkan foreign key `user_id` pada model `Device`, memastikan query `GET /api/devices` terisolasi per pengguna.
* [x] **BE-03: Endpoint Autentikasi**:
  * `POST /api/auth/register` (hashing bcrypt, username unik minimal 3 karakter).
  * `POST /api/auth/login` (verifikasi kredensial dan penerbitan token HMAC-SHA256).
  * `GET /api/auth/me` (inspeksi profil pengguna aktif dari Bearer token).
* [x] **BE-04: Migrasi Skema Otomatis**: Integrasi `AutoMigrate` pada database MySQL aaPanel dan seeding demo user.

### Fase 2: Fitur Kecerdasan Buatan (AI Engine & Analytics) [PRIORITAS TINGGI]
* [ ] **BE-05: Endpoint Prediksi Hujan AI (`POST /api/ai/predict-rain`)**:
  * Menganalisis tren penurunan nilai ADC sensor hujan, kenaikan kelembapan udara (`hum`), dan perubahan suhu (`tempC`) dalam 30 menit terakhir.
  * Output: Probabilitas hujan dalam rentang 15-60 menit ke depan (`probabilityPct`, `estimatedRainInMinutes`, `confidenceLevel`).
* [ ] **BE-06: Endpoint Rekomendasi Jemuran AI (`GET /api/ai/drying-advice`)**:
  * Mengombinasikan data BMKG (prakiraan cuaca kecamatan) dengan telemetri aktual ESP32.
  * Output: Rekomendasi status (`aman_jemur`, `waspada_angkat`, `bahaya_hujan`), estimasi waktu kering pakaian dalam jam, dan ringkasan teks saran (contoh: "Cuaca terik dan angin stabil. Waktu optimal jemur hingga pukul 14:00").
* [ ] **BE-07: Penyimpanan Riwayat Prediksi AI**:
  * Membuat tabel `ai_predictions` di MySQL untuk mencatat akurasi model terhadap peristiwa aktual `rain_start`.
* [ ] **BE-08: Background Worker Evaluasi Cuaca**:
  * Cron internal Golang (setiap 10 menit) untuk mengevaluasi kondisi semua perangkat aktif dan mengirim sinyal peringatan dini ke WebSocket jika mendeteksi anomali cuaca ekstrem.

### Fase 3: Optimasi Performa, Monitoring & Keamanan [PRIORITAS SEDANG]
* [ ] **BE-09: Redis Caching Telemetri Realtime**:
  * Menyimpan 100 pembacaan telemetri terakhir tiap perangkat di Redis list untuk mengurangi frekuensi query disk MySQL.
* [ ] **BE-10: Rate Limiting API**:
  * Menerapkan middleware rate limiter pada endpoint autentikasi dan telemetri (misal: 60 request per menit per IP).
* [ ] **BE-11: Integrasi Notifikasi Bot Telegram / Webhook Eksternal**:
  * Opsi bagi pengguna untuk memasukkan Telegram Chat ID agar server langsung mengirim peringatan darurat saat jemuran ditarik otomatis.
* [ ] **BE-12: Unit Testing & Benchmark Golang**:
  * Menulis unit test untuk `handlers/auth.go`, `handlers/api.go`, dan kalkulasi threshold hujan.

---

## 4. Daftar Task Frontend (Tampilan & Pengalaman Pengguna)

### Fase 1: Landing Page, Halaman Auth & Tata Letak Dasar [SELESAI]
* [x] **FE-01: Landing Page Responsif**: Hero banner modern, simulator interaktif sensor, penjelasan fitur, dan optimasi mobile tanpa horizontal overflow.
* [x] **FE-02: Halaman Khusus Login & Registrasi**: Antarmuka mandiri (bukan modal popup), input username, toggle password, checkbox "Ingat Saya", dan tombol demo instan.
* [x] **FE-03: Isolasi Cache Browser**: Penyimpanan lokal terisolasi berdasarkan `userId` (`hujan.devices.${userId}`).
* [x] **FE-04: Transisi Branding WebSocket**: Penyesuaian label antarmuka dari MQTT ke Server Cloud Realtime.

### Fase 2: Implementasi Antarmuka Fitur AI [PRIORITAS TINGGI]
* [ ] **FE-05: Komponen Widget Prediksi Hujan AI**:
  * Menampilkan kartu status prediksi kecerdasan buatan pada tab Dashboard.
  * Indikator visual radial atau progress bar: Probabilitas Hujan (contoh: 78% Potensi Gerimis dalam 25 Menit).
  * Badge tingkat keyakinan model (Tinggi, Sedang, Rendah).
* [ ] **FE-06: Kartu Asisten Rekomendasi Jemuran**:
  * Menampilkan saran cerdas: Apakah aman menjemur pakaian sekarang?
  * Estimasi waktu pakaian kering dan jam rekomendasi untuk mengangkat jemuran sebelum hujan turun.
* [ ] **FE-07: Visualisasi Riwayat Akurasi AI**:
  * Menampilkan log komparasi pada tab Riwayat: Waktu prediksi AI vs waktu sensor mendeteksi hujan sebenarnya.

### Fase 3: Peningkatan Analitik Data & Pengaturan [PRIORITAS SEDANG]
* [ ] **FE-08: Fitur Ekspor Data Telemetri**:
  * Tombol unduh riwayat telemetri dalam format file CSV atau Excel untuk keperluan analisis mandiri atau laporan penelitian.
* [ ] **FE-09: Filter Riwayat Lanjutan**:
  * Pemilihan rentang waktu kustom (1 hari, 7 hari, 30 hari, atau rentang tanggal kustom) menggunakan datepicker.
* [ ] **FE-10: Pengaturan Notifikasi Suara**:
  * Opsi memilih nada dering alarm saat hujan terdeteksi (sirine, lonceng, atau suara tetesan air).
* [ ] **FE-11: Manajemen Token Integrasi Telegram**:
  * Input form pada menu Kelola Perangkat untuk menghubungkan Bot Telegram pribadi pengguna.

---

## 5. Rincian Spesifikasi Integrasi Fitur AI (Kontrak Antarmuka)

Bagian ini dirancang agar Backend Engineer dapat langsung mengimplementasikan endpoint di Golang tanpa perlu khawatir format JSON berbeda dengan yang diharapkan oleh Frontend.

### A. Endpoint Prediksi Hujan AI

* **Metode & URL**: `POST /api/ai/predict-rain`
* **Header**: `Authorization: Bearer <token>`, `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "deviceId": "hs-8f3a1c9d2b70",
    "lookbackMinutes": 30
  }
  ```
* **Response Body (200 OK)**:
  ```json
  {
    "status": "success",
    "deviceId": "hs-8f3a1c9d2b70",
    "analyzedAt": "2026-10-09T09:50:00Z",
    "prediction": {
      "willRain": true,
      "probabilityPct": 82,
      "estimatedMinutesUntilRain": 20,
      "confidenceLevel": "high",
      "trendFactors": {
        "humidityDeltaPct": "+14%",
        "tempDeltaC": "-1.8C",
        "adcVariance": "unstable"
      },
      "summary": "Peningkatan kelembapan udara drastis terdeteksi. Potensi hujan tinggi dalam 20 menit ke depan."
    }
  }
  ```

### B. Endpoint Rekomendasi Jemuran AI

* **Metode & URL**: `GET /api/ai/drying-advice?deviceId=hs-8f3a1c9d2b70`
* **Header**: `Authorization: Bearer <token>`
* **Response Body (200 OK)**:
  ```json
  {
    "status": "success",
    "deviceId": "hs-8f3a1c9d2b70",
    "advice": {
      "recommendation": "waspada_angkat",
      "dryingScore": 45,
      "estimatedDryHours": 3.5,
      "bestDryingWindow": "Pukul 08:00 - 11:30",
      "bmkgWeatherDesc": "Hujan Ringan",
      "actionMessage": "Segera angkat jemuran tebal atau pantau motor servo otomatis. Cuaca diprediksi berawan tebal menuju gerimis."
    }
  }
  ```

---

## 6. Prosedur Serah Terima Fitur (Handoff Flow)

Bila Backend Engineer telah menyelesaikan sebuah endpoint:
1. Catat endpoint baru pada `docs/API.md` beserta contoh payload.
2. Ubah status task di bagian `3. Daftar Task Backend` dari `[ ]` menjadi `[x]`.
3. Sampaikan kepada asisten AI atau pengembang frontend: *"Endpoint BE-05 (/api/ai/predict-rain) sudah siap di backend, tolong buatkan komponen UI FE-05 di frontend sesuai kontrak di docs/TASKS.md."*
4. Frontend akan langsung dibangun sesuai kontrak tanpa ada kebingungan atau deviasi data.
