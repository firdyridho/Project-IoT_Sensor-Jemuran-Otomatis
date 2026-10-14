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

* [x] **BE-15: Integrasi Hardware ESP32 Custom & Realtime Dynamic Online Tracking**:
  * **Tujuan**: Menghubungkan prototipe fisik ESP32 (Layar OLED SSD1306, Driver Stepper A4988, Sensor Hujan FC-37, dan Sensor Cahaya LDR) serta memperbaiki kalkulasi status online/offline agar benar-benar realtime.
  * **Implementasi**:
    * Handler `handleCustomData` di `mqtt/subscriber.go` untuk menerima format JSON `+/data` dari ESP32.
    * Hook `MotorCommandHandler` di `handlers/motor.go` untuk mengirim string perintah `tarik` dan `dorong` ke topik `{device_id}/control`.
    * Penyesuaian ambang batas deteksi online menjadi 15 detik pada backend dan antarmuka web, serta inisialisasi default perangkat baru ke status offline.
    * Konfigurasi MQTT Last Will and Testament (LWT) pada firmware mikrokontroler agar pemutusan daya/koneksi terdeteksi seketika.
  * **Status**: Selesai diimplementasikan dan terverifikasi.

---

### Fase 5: Riwayat AI, Ekspor Telemetri & Fleksibilitas Simulator [SELESAI]

* [x] **BE-16: Riwayat Log Prediksi AI & Evaluasi Akurasi (REQ-BE-03)**:
  * **Tujuan**: Menyediakan data riwayat keandalan model AI dan perbandingan otomatis dengan sensor fisik lapangan.
  * **Endpoint**: `GET /api/ai/predictions/history?deviceId={id}&limit=50`
  * **Implementasi**:
    * Handler `GetAIPredictionsHistory` di `handlers/ai.go`.
    * Membaca riwayat dari tabel `ai_predictions` dan memvalidasi apakah telemetri hujan (`wet=true` atau `pct>=60`) terjadi dalam rentang 60 menit setelah prediksi dibuat.
    * Menghasilkan metrik `accuracyRatePct`, `actualRainOccurred`, dan `accuracyStatus` ("tepat" atau "meleset").
  * **Status**: Selesai diimplementasikan dan lulus pengujian `TestGetAIPredictionsHistory`.

* [x] **BE-17: Endpoint Streaming Ekspor Telemetri CSV (REQ-BE-04)**:
  * **Tujuan**: Memungkinkan pengunduhan rekaman telemetri berkas CSV langsung dari database VPS.
  * **Endpoint**: `GET /api/telemetry/export?deviceId={id}&startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}&limit=1000`
  * **Implementasi**:
    * Handler `ExportTelemetryCSV` di `handlers/api.go`.
    * Mengalirkan respons berkas `Content-Type: text/csv` dengan baris terformat `timestamp,raw_adc,wet_pct,is_wet,temp_c,hum_pct,vbat,rssi`.
  * **Status**: Selesai diimplementasikan dan lulus pengujian `TestExportTelemetryCSV`.

* [x] **BE-18: Ekstensi 4 Kondisi Cuaca Simulator (REQ-BE-05)**:
  * **Tujuan**: Menyelaraskan injeksi virtual cuaca dengan kondisi cerah, mendung, hujan, dan badai.
  * **Endpoint**: `POST /api/simulator/weather`
  * **Implementasi**:
    * Penambahan kondisi `mendung` di `handlers/simulator.go` (kelembapan 85%, awan tebal, `wet: false`, motor mode siaga `extended`).
    * Mempertahankan backward compatibility untuk kondisi `gerimis`.
  * **Status**: Selesai diimplementasikan dan lulus pengujian `TestSimulatorWeatherMendung`.

---

### Fase 6: Preferensi Akun, Keamanan Profil, Pembersihan Riwayat & Web Push PWA [SELESAI]

* [x] **BE-19: Sinkronisasi Pengaturan Akun & Preferensi Cloud (REQ-BE-06)**:
  * **Tujuan**: Menyimpan konfigurasi tema visual (`light`/`dark`), nada dering alarm (`sirine`/`bell`/`hujan`), volume suara, dan mute audio efek cuaca di server agar tersinkronisasi antar perangkat pengguna.
  * **Endpoint**: `GET /api/user/settings` & `PUT /api/user/settings`
  * **Implementasi**:
    * Model tabel database `models.UserSettings` (`user_settings`).
    * Handler `GetUserSettings` dan `UpdateUserSettings` di `handlers/auth.go`.
  * **Status**: Selesai dan lulus pengujian `TestUserSettingsSync`.

* [x] **BE-20: Pembersihan Riwayat Telemetri & Log Event (REQ-BE-07)**:
  * **Tujuan**: Memungkinkan pengguna membersihkan data riwayat telemetri atau log peristiwa perangkat tanpa menghapus pendaftaran unit perangkat itu sendiri.
  * **Endpoint**: `DELETE /api/devices/:id/telemetry` & `DELETE /api/devices/:id/events`
  * **Implementasi**:
    * Handler `ClearTelemetry` dan `ClearEvents` di `handlers/api.go`.
    * Mendukung filter rentang waktu opsional via query `?before={unix_ms}`.
    * Pembersihan otomatis cache Redis telemetri (`database.ClearTelemetryCache`).
  * **Status**: Selesai dan lulus pengujian `TestClearTelemetryAndEvents`.

* [x] **BE-21: Pembaruan Profil & Keamanan Pengguna (REQ-BE-08)**:
  * **Tujuan**: Menyediakan antarmuka pergantian nama lengkap akun dan pergantian kata sandi yang aman.
  * **Endpoint**: `PUT /api/auth/profile` & `PUT /api/auth/password`
  * **Implementasi**:
    * Handler `UpdateProfile` dan `UpdatePassword` di `handlers/auth.go`.
    * Verifikasi kata sandi lama menggunakan Bcrypt dan enkripsi kata sandi baru min 6 karakter.
  * **Status**: Selesai dan lulus pengujian `TestUpdateProfileAndPassword`.

* [x] **BE-22: Dukungan Web Push Notification PWA VAPID (REQ-BE-09)**:
  * **Tujuan**: Mengirimkan notifikasi darurat langsung ke peramban ponsel / PWA pengguna bahkan saat website sedang tidak dibuka di layar.
  * **Endpoint**: `GET /api/notifications/vapid-key` & `POST /api/notifications/subscribe`
  * **Implementasi**:
    * Handler `GetVapidPublicKey` dan `SubscribeWebPush` di `handlers/webpush.go`.
    * Model tabel database `models.WebPushSubscription` (`web_push_subscriptions`).
    * Integrasi broadcast otomatis `SendWebPushAlert` di `mqtt/subscriber.go` saat event `rain_start` terdeteksi.
  * **Status**: Selesai dan lulus pengujian `TestWebPushEndpoints`.

---

### Fase 7: Pembersihan Web Push & Audit Legal Konsen [BACKLOG]

* [ ] **BE-23: Endpoint Unsubscribe Web Push Notification (REQ-BE-10)**:
  * **Tujuan**: Memungkinkan peramban menghapus data langganan Web Push dari tabel `web_push_subscriptions` saat pengguna menonaktifkan notifikasi di antarmuka frontend.
  * **Endpoint**: `POST /api/notifications/unsubscribe` atau `DELETE /api/notifications/subscribe`
  * **Payload**: `{ "endpoint": "https://fcm.googleapis.com/..." }`
  * **Status**: Menunggu Pengerjaan oleh Backend Engineer.

* [ ] **BE-24: Kolom Audit Persetujuan Ketentuan Layanan & Privasi (REQ-BE-11)**:
  * **Tujuan**: Menyimpan bukti waktu persetujuan pengguna terhadap Ketentuan Layanan & Kebijakan Privasi Rintik (REQ-FE-10).
  * **Implementasi**: Menambahkan field `terms_accepted_at` (nullable time.Time) pada model `models.User` yang otomatis terisi `time.Now()` saat `POST /api/auth/register`.
  * **Status**: Menunggu Pengerjaan oleh Backend Engineer.

---

## 3. Alur Serah Terima ke Frontend (Handoff)

Bila Anda telah selesai membuat salah satu endpoint backend:
1. Uji endpoint secara lokal atau di staging dengan cURL / Postman.
2. Centang task di atas dari `[ ]` menjadi `[x]`.
3. Sampaikan kepada asisten AI atau developer frontend:
   > *"Endpoint BE-19 s/d BE-22 (/api/user/settings, /api/auth/profile, /api/auth/password, DELETE /api/devices/:id/telemetry, /api/notifications/vapid-key) sudah aktif di backend. Tolong buatkan tampilan antarmuka di frontend sesuai kontrak di docs/FRONTEND_REQUESTS.md."*

