# Daftar Task & Roadmap: Backend (Golang, Database & AI Engine)

Dokumen ini adalah panduan kerja khusus **Backend Engineer**. Seluruh arsitektur server, skema database, WebSocket/MQTT listener, serta implementasi algoritma kecerdasan buatan (AI) dikelola dan dipantau melalui dokumen ini.

---

## 1. Lingkup Tanggung Jawab Backend

* **Teknologi**: Golang 1.22+, GORM, Gin Web Framework, MySQL 5.7, Redis Cache.
* **Server**: Tencent Cloud Lighthouse VPS (Linux Ubuntu AMD64, aaPanel).
* **Fokus Kerja**:
  1. Keamanan dan integritas data multi-user.
  2. Latensi pemrosesan data sensor sub-detik (Realtime WebSocket).
  3. Pembuatan API analitik & prediksi cerdas (AI Inference).
  4. Efisiensi sumber daya VPS (< 30 MB RAM per instance).

---

## 2. Status & Backlog Task Backend

### Fase 1: Fondasi Autentikasi & Multi-User [SELESAI]
* [x] **BE-01: Skema Database User**:
  * Model `models.User` dengan kolom `id`, `username`, `name`, `password_hash`, `created_at`, `updated_at`.
  * Index unik pada kolom `username` (VARCHAR 64).
* [x] **BE-02: Isolasi Data Perangkat Multi-User**:
  * Menambahkan field `user_id` pada model `models.Device`.
  * Endpoint `GET /api/devices` menyaring perangkat berdasarkan `userId`: `db.Where("user_id = ?", userId)`.
  * Menolak akses atau penghapusan perangkat lintas user.
* [x] **BE-03: Endpoint Autentikasi**:
  * `POST /api/auth/register` (Hashing kata sandi menggunakan bcrypt, validasi username min 3 karakter).
  * `POST /api/auth/login` (Verifikasi username & kata sandi, penerbitan signature token HMAC-SHA256).
  * `GET /api/auth/me` (Validasi bearer token dan mengembalikan profil aktif).
* [x] **BE-04: Migrasi Skema & Seeding**:
  * Integrasi `AutoMigrate` pada database MySQL aaPanel (`hujan_iot_staging` dan `hujan_iot_prod`).
  * Seeding default demo user: username `admin` / kata sandi `admin123`.
* [x] **BE-04b: Migrasi Endpoint Broker Internal & Folder IoT**:
  * Mengalihkan broker default perangkat ke VPS WebSocket `wss://43-133-136-149.sslip.io/ws` dan TCP local `127.0.0.1:1883`.
  * Membuat direktori `iot/` berisi firmware ESP32 (`iot/hujan_esp32.ino`), template konfigurasi (`iot/config.h.example`), dan panduan skematik hardware (`iot/README.md`).

---

### Fase 2: Fitur Kecerdasan Buatan (AI Engine & Analytics) [SELESAI]

* [x] **BE-05: Endpoint Prediksi Hujan AI (`POST /api/ai/predict-rain`)**:
  * **Tujuan**: Memprediksi potensi hujan dalam 15-60 menit ke depan sebelum tetesan air pertama menyentuh plat sensor.
  * **Input Data**: 30 menit riwayat telemetri terakhir (kelembapan udara `hum`, suhu `tempC`, dan fluktuasi nilai ADC sensor FC-37).
  * **Algoritma**: Analisis laju perubahan (gradient rate of change):
    * Laju kenaikan kelembapan udara > +10% dalam 15 menit (+35% probabilitas).
    * Laju penurunan suhu udara > -1.5°C dalam 15 menit (+25% probabilitas).
    * Nilai ADC sensor yang mulai bergeser turun dari kondisi kering (+20% probabilitas).
  * **Status**: Selesai diimplementasikan di `handlers/ai.go` dan lulus unit testing.

* [x] **BE-06: Endpoint Rekomendasi Jemuran AI (`GET /api/ai/drying-advice`)**:
  * **Tujuan**: Memberi rekomendasi apakah aman menjemur pakaian, jam jemur terbaik, dan estimasi waktu kering pakaian.
  * **Input Data**: Sensor suhu & kelembapan lapangan + evaluasi status basah/hujan.
  * **Status**: Selesai diimplementasikan di `handlers/ai.go` dengan kalkulasi Drying Score (0–100), estimasi jam kering pakaian, dan rekomendasi status (`aman_jemur`, `waspada_jemur`, `angkat_segera`).

* [x] **BE-07: Tabel Database Log Prediksi AI (`ai_predictions`)**:
  * Membuat model `models.AIPrediction` untuk mencatat tiap prediksi yang dikeluarkan:
    * `id` (uint, PK)
    * `device_id` (varchar 64, index)
    * `probability_pct` (int)
    * `predicted_rain` (bool)
    * `estimated_minutes` (int)
    * `confidence_level` (varchar 32)
    * `created_at` (datetime)
  * **Status**: Selesai ditambahkan ke `models/models.go` dan terdaftar pada `AutoMigrate` database.

* [x] **BE-08: Background Worker Peringatan Cuaca Ekstrem**:
  * Cron internal Golang (`time.Ticker` setiap 3 menit di `handlers.StartWeatherAlertWorker()`).
  * Memeriksa seluruh perangkat online: jika fluktuasi kelembapan tajam terdeteksi (> 12% dan suhu anjlok > 1.8°C), otomatis broadcast event `rain_forecast_alert` ke client WebSocket.
  * **Status**: Aktif berjalan di background thread saat server start.

---

### Fase 3: Optimasi Performa, Monitoring & Keamanan [SELESAI]

* [x] **BE-09: Redis Caching Telemetri Realtime**:
  * Menggunakan Redis List (`LPUSH` dan `LTRIM 0 99` di `database.PushTelemetryList`) untuk menyimpan 100 data telemetri terkini per device.
  * Menghemat query disk MySQL saat pengguna membuka dashboard atau saat telemetri masuk dalam frekuensi tinggi.
  * **Status**: Terintegrasi pada ingestion HTTP REST dan subscriber MQTT.

* [x] **BE-10: Rate Limiting & Proteksi Brute-Force**:
  * Middleware Gin `RateLimiterMiddleware()` untuk membatasi request umum (120 req/menit per IP).
  * Middleware Gin `LoginBruteForceMiddleware()` untuk membatasi endpoint `/api/auth/login` (maksimal 5 percobaan gagal per IP per 5 menit).
  * **Status**: Aktif di `handlers/middleware.go` dan terpasang pada route Gin di `main.go`.

* [x] **BE-11: Integrasi Telegram Bot Webhook & Event Dispatch**:
  * Service worker untuk mem-push notifikasi darurat ke akun Telegram pengguna saat event `rain_start` atau `HUJAN_TERDETEKSI` masuk dari ESP32.
  * Dilengkapi rate limit cooldown 10 menit agar tidak membanjiri chat pengguna.
  * **Status**: Terintegrasi di `mqtt/subscriber.go` dan endpoint `POST /api/telegram/test`.

* [x] **BE-12: Unit Testing & CI Verification**:
  * Test suite Go untuk `auth_test.go` dan `api_test.go` mencakup pengujian registrasi, login, token HMAC-SHA256, CRUD device, endpoint prediksi AI, dan rekomendasi jemuran.
  * Terintegrasi pada pipeline GitHub Actions (`.github/workflows/deploy.yml`).
  * **Status**: 100% PASS pada eksekusi `go test -v ./...`.

---

### Fase 4: Integrasi Otomasi Motor Kanopi & Simulator Cuaca [SELESAI]

* [x] **BE-13: Status & Kendali Motor DC Rel Jemuran (REQ-BE-01)**:
  * **Tujuan**: Sinkronisasi status posisi fisik kanopi jemuran (`sheltered` vs `extended`) dan eksekusi perintah motor dari kartu antarmuka frontend (`ClotheslineMotorCard.tsx`).
  * **Endpoint Aktif**:
    * `GET /api/devices/:id/motor` -> Mengembalikan status `{ position, status, lastMovedTs }`.
    * `POST /api/devices/:id/motor/command` -> Menerima `{ action: "retract" | "extend" }` dan memicu broadcast WebSocket realtime serta update DB.
  * **Status**: Selesai diimplementasikan di `handlers/motor.go`, sinkronisasi MQTT state di `mqtt/subscriber.go`, dan lulus pengujian `TestMotorEndpoints`.

* [x] **BE-14: Endpoint Simulator Cuaca Virtual (REQ-BE-02)**:
  * **Tujuan**: Menyediakan injeksi telemetri virtual tanpa memerlukan perangkat fisik ESP32 agar tim frontend/QA dapat menguji mode cuaca (Cerah, Gerimis, Hujan, Badai).
  * **Endpoint Aktif**:
    * `POST /api/simulator/weather` -> Menerima `{ deviceId, condition: "cerah" | "gerimis" | "hujan" | "badai" }`.
    * Menginjeksi telemetri ke database, Redis list cache, dan broadcast realtime event ke WebSocket Hub.
  * **Status**: Selesai diimplementasikan di `handlers/simulator.go` dan lulus pengujian `TestSimulatorWeatherEndpoint`.

---

## 3. Alur Serah Terima ke Frontend (Handoff)

Bila Anda telah selesai membuat salah satu endpoint backend:
1. Uji endpoint secara lokal atau di staging dengan cURL / Postman.
2. Centang task di atas dari `[ ]` menjadi `[x]`.
3. Sampaikan kepada asisten AI atau developer frontend:
   > *"Endpoint BE-05 (/api/ai/predict-rain) sudah aktif di backend. Tolong buatkan tampilan antarmuka FE-05 di frontend sesuai kontrak di docs/FRONTEND_TASKS.md."*
