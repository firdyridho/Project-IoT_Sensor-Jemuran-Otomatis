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

### Fase 2: Fitur Kecerdasan Buatan (AI Engine & Analytics) [PRIORITAS TINGGI]

* [ ] **BE-05: Endpoint Prediksi Hujan AI (`POST /api/ai/predict-rain`)**:
  * **Tujuan**: Memprediksi potensi hujan dalam 15-60 menit ke depan sebelum tetesan air pertama menyentuh plat sensor.
  * **Input Data**: 30 menit riwayat telemetri terakhir (kelembapan udara `hum`, suhu `tempC`, dan fluktuasi nilai ADC sensor FC-37).
  * **Algoritma**: Analisis laju perubahan (gradient rate of change):
    * Laju kenaikan kelembapan udara > +10% dalam 15 menit.
    * Laju penurunan suhu udara > -1.5°C dalam 15 menit.
    * Nilai ADC sensor yang mulai bergeser turun dari kondisi kering (3800-4095).
  * **Payload Request**:
    ```json
    {
      "deviceId": "hs-8f3a1c9d2b70",
      "lookbackMinutes": 30
    }
    ```
  * **Payload Response (200 OK)**:
    ```json
    {
      "status": "success",
      "deviceId": "hs-8f3a1c9d2b70",
      "analyzedAt": "2026-10-09T10:00:00Z",
      "prediction": {
        "willRain": true,
        "probabilityPct": 85,
        "estimatedMinutesUntilRain": 20,
        "confidenceLevel": "high",
        "trendFactors": {
          "humidityDelta": "+15%",
          "tempDelta": "-2.1C",
          "adcTrend": "falling"
        },
        "summary": "Kelembapan naik tajam dan suhu turun drastis. Potensi hujan tinggi dalam 20 menit ke depan."
      }
    }
    ```

* [ ] **BE-06: Endpoint Rekomendasi Jemuran AI (`GET /api/ai/drying-advice`)**:
  * **Tujuan**: Memberi rekomendasi apakah aman menjemur pakaian, jam jemur terbaik, dan estimasi waktu kering pakaian.
  * **Input Data**: Cuaca BMKG kecamatan + suhu & kelembapan sensor lapangan.
  * **Parameter Query**: `deviceId=hs-8f3a1c9d2b70`
  * **Payload Response (200 OK)**:
    ```json
    {
      "status": "success",
      "deviceId": "hs-8f3a1c9d2b70",
      "advice": {
        "recommendation": "aman_jemur",
        "dryingScore": 88,
        "estimatedDryHours": 2.5,
        "bestDryingWindow": "Pukul 08:00 - 13:30 WIB",
        "bmkgWeatherDesc": "Cerah Berawan",
        "actionMessage": "Kondisi panas optimal dan angin cukup. Waktu tepat untuk menjemur pakaian tebal."
      }
    }
    ```

* [ ] **BE-07: Tabel Database Log Prediksi AI (`ai_predictions`)**:
  * Membuat model `models.AIPrediction` untuk mencatat tiap prediksi yang dikeluarkan:
    * `id` (uint, PK)
    * `device_id` (varchar 64, index)
    * `probability_pct` (int)
    * `predicted_rain` (bool)
    * `actual_rain_occurred` (bool, default null)
    * `accuracy_score` (float)
    * `created_at` (datetime)
  * Berguna untuk evaluasi akurasi model machine learning / thresholding.

* [ ] **BE-08: Background Worker Peringatan Cuaca Ekstrem**:
  * Cron internal Golang (`time.Ticker` setiap 5-10 menit).
  * Memeriksa seluruh perangkat online: jika probabilitas hujan > 80%, otomatis broadcast event `rain_forecast_alert` ke client WebSocket.

---

### Fase 3: Optimasi Performa, Monitoring & Keamanan [PRIORITAS SEDANG]

* [ ] **BE-09: Redis Caching Telemetri Realtime**:
  * Menggunakan Redis List (`LPUSH` dan `LTRIM 0 99`) untuk menyimpan 100 data telemetri terkini per device.
  * Meringankan query disk MySQL saat pengguna membuka dashboard.
* [ ] **BE-10: Rate Limiting & Proteksi Brute-Force**:
  * Middleware Gin untuk membatasi endpoint `/api/auth/login` (maksimal 5 percobaan gagal per IP per 5 menit).
  * Rate limit umum 120 request/menit untuk endpoint lainnya.
* [ ] **BE-11: Integrasi Telegram Bot Webhook**:
  * Service worker untuk mem-push notifikasi darurat ke akun Telegram pengguna saat jemuran ditarik otomatis.
* [ ] **BE-12: Unit Testing & CI Verification**:
  * Test suite Go untuk `auth_test.go` dan `api_test.go` yang otomatis dijalankan pada GitHub Actions.

---

## 3. Alur Serah Terima ke Frontend (Handoff)

Bila Anda telah selesai membuat salah satu endpoint backend:
1. Uji endpoint secara lokal atau di staging dengan cURL / Postman.
2. Centang task di atas dari `[ ]` menjadi `[x]`.
3. Sampaikan kepada asisten AI atau developer frontend:
   > *"Endpoint BE-05 (/api/ai/predict-rain) sudah aktif di backend. Tolong buatkan tampilan antarmuka FE-05 di frontend sesuai kontrak di docs/FRONTEND_TASKS.md."*
