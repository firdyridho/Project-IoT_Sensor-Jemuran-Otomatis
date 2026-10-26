# Kotak Masuk Permintaan ke Backend (Backend Requests Inbox)

Dokumen ini adalah media komunikasi resmi dari **Frontend Developer** kepada **Backend Engineer**. 

Jika frontend membutuhkan endpoint baru, modifikasi parameter data, atau fungsi database tambahan, tuliskan permintaan tersebut di berkas ini. Backend Engineer tidak akan terganggu dan status tugas yang sudah selesai di `BACKEND_TASKS.md` tidak akan tertimpa.

---

## Panduan Penggunaan untuk Frontend Developer

> **PERINGATAN SINKRONISASI (SOP ANTI-TIMPA)**:
> Sebelum menulis permintaan baru dan sesaat sebelum melakukan push:
> 1. Wajib jalankan `git pull origin staging` terlebih dahulu.
> 2. Periksa apakah Backend baru saja merilis perubahan endpoint, model data, atau logika server baru agar permintaan yang diajukan tidak tumpang tindih.
> 3. Jangan mengandalkan hasil pull tadi pagi atau kemarin. Tarik perubahan terkini tepat sebelum menulis dan tepat sebelum push!

### Langkah Menulis Permintaan:
1. Jalankan `git pull origin staging`.
2. Tambahkan permintaan baru pada bagian **Daftar Permintaan Aktif** di bawah menggunakan format standar:
   ```markdown
   * [ ] **REQ-BE-XX: [Judul Permintaan Singkat]**
     * Tanggal Diminta: YYYY-MM-DD
     * Diminta Oleh: Frontend Team
     * Latar Belakang / Kebutuhan UI: [Jelaskan komponen apa yang butuh data ini]
     * Usulan Endpoint: [Contoh: GET /api/telemetry/export]
     * Format Request / Response yang Diharapkan: [Contoh JSON]
     * Status: Menunggu Dikerjakan
   ```
3. Lakukan `git add docs/BACKEND_REQUESTS.md`, commit, lalu jalankan `git pull origin staging` sekali lagi sebelum `git push origin staging`.

---

## Panduan untuk Backend Engineer

1. Periksa berkas ini secara berkala saat memulai sesi kerja.
2. Jika permintaan telah selesai diimplementasikan di Golang dan lulus pengujian:
   * Ubah status menjadi `[x] SELESAI`.
   * Pindahkan atau referensikan ke [BACKEND_TASKS.md](BACKEND_TASKS.md) sebagai catatan fitur permanen.
   * Beritahukan Frontend Developer bahwa endpoint telah aktif.

---

## Daftar Permintaan Aktif (Inbox)

*Saat ini seluruh permintaan aktif telah selesai diimplementasikan.*

---

## Riwayat Permintaan Selesai (Archive)

* [x] **REQ-BE-12: Parsing `motor_status` ("moving" / "idle") dan Posisi Dinamis ("menarik" / "mendorong") dari ESP32 MQTT Topic `+/data` serta Penyiaran Realtime via WebSocket**
  * Tanggal Diminta: 2026-10-26
  * Tanggal Selesai: 2026-10-26
  * Diminta Oleh: Frontend Team
  * Diselesaikan Oleh: Backend Engineer
  * Implementasi:
    1. Menambahkan field `MotorStatus string \`json:"motor_status"\`` pada struct `handleCustomData` di `backend/mqtt/subscriber.go`.
    2. Mendukung pembacaan status gerak motor (`"moving"` vs `"idle"`) serta posisi dinamis (`"menarik"` dan `"mendorong"`).
    3. Menyiarkan status motor ke WebSocket `/ws` (`"motor"`) dan memperbarui kolom `motor_status` di database MySQL & in-memory cache.
  * Status: [x] SELESAI

* [x] **REQ-BE-10: Endpoint Unsubscribe Web Push Notification (`POST /api/notifications/unsubscribe` atau `DELETE /api/notifications/subscribe`)**
  * Tanggal Diminta: 2026-10-14
  * Tanggal Selesai: 2026-10-14
  * Diselesaikan Oleh: Backend Engineer
  * Komponen & Berkas Terkait:
    * `backend/handlers/webpush.go` (handler `UnsubscribeWebPush`)
    * `backend/main.go` (rute `POST /notifications/unsubscribe`, `DELETE /notifications/subscribe`, `DELETE /notifications/unsubscribe`)
    * `backend/user_settings_test.go` (`TestWebPushUnsubscribe`)
  * Spesifikasi yang Terpenuhi:
    1. Menyediakan endpoint penghapusan push subscription melalui `POST /api/notifications/unsubscribe`, `DELETE /api/notifications/subscribe`, dan `DELETE /api/notifications/unsubscribe`.
    2. Mendukung pembacaan `endpoint` dari JSON body `{ "endpoint": "..." }`, format bersarang `{ "subscription": { "endpoint": "..." } }`, maupun query parameter `?endpoint=...`.
    3. Menghapus record langganan di database sehingga worker backend tidak lagi mengirimkan pesan push ke client yang telah mencabut izin.
  * Status: [x] SELESAI

* [x] **REQ-BE-11: Kolom & Endpoint Pencatatan Audit Persetujuan Ketentuan Layanan & Privasi (`terms_accepted_at`)**
  * Tanggal Diminta: 2026-10-14
  * Tanggal Selesai: 2026-10-14
  * Diselesaikan Oleh: Backend Engineer
  * Komponen & Berkas Terkait:
    * `backend/models/models.go` (kolom `TermsAcceptedAt *time.Time` pada `models.User`)
    * `backend/handlers/auth.go` (handler `Register` & `AcceptTerms`)
    * `backend/main.go` (rute `POST /api/user/accept-terms`)
    * `backend/user_settings_test.go` (`TestTermsAuditAcceptance`)
  * Spesifikasi yang Terpenuhi:
    1. Menambahkan kolom `terms_accepted_at` (nullable datetime) pada tabel `users`.
    2. Pada saat pendaftaran pengguna (`POST /api/auth/register`), `TermsAcceptedAt` otomatis diisi dengan timestamp saat ini (`time.Now()`), serta memvalidasi jika field `termsAccepted` dikirim `false` maka pendaftaran ditolak (400 Bad Request).
    3. Menyediakan endpoint `POST /api/user/accept-terms` terproteksi JWT untuk mencatat audit persetujuan ulang bagi akun pengguna.
  * Status: [x] SELESAI

* [x] **REQ-BE-06: Endpoint Sinkronisasi Pengaturan Akun & Preferensi Cloud (`GET /api/user/settings` & `PUT /api/user/settings`)**
  * Tanggal Diminta: 2026-10-13
  * Tanggal Selesai: 2026-10-13
  * Diminta Oleh: Frontend Team
  * Diselesaikan Oleh: Backend Engineer
  * Implementasi:
    * Endpoint `GET /api/user/settings` dan `PUT /api/user/settings` di `handlers/auth.go`.
    * Model tabel database `models.UserSettings` (`user_settings`) dengan kolom `user_id`, `tema`, `alarm_sound`, `alarm_volume`, `weather_audio_muted`, dan `updated_at`.
    * Autentikasi berbasis token Bearer dengan fallback default settings jika user baru pertama kali mengambil data.
  * Status: [x] SELESAI (Tercatat di BACKEND_TASKS.md sebagai BE-19).

* [x] **REQ-BE-07: Endpoint Pembersihan Riwayat Telemetri & Log Event Tertentu (`DELETE /api/devices/:id/telemetry` & `DELETE /api/devices/:id/events`)**
  * Tanggal Diminta: 2026-10-13
  * Tanggal Selesai: 2026-10-13
  * Diminta Oleh: Frontend Team
  * Diselesaikan Oleh: Backend Engineer
  * Implementasi:
    * Endpoint `DELETE /api/devices/:id/telemetry` dan `DELETE /api/devices/:id/events` di `handlers/api.go`.
    * Mendukung filter rentang waktu opsional via query `?before={unix_ms}`.
    * Mengosongkan cache Redis telemetri secara otomatis (`database.ClearTelemetryCache`) agar data cache tidak stale.
    * Mengembalikan jumlah baris yang dibersihkan (`rowsAffected`).
  * Status: [x] SELESAI (Tercatat di BACKEND_TASKS.md sebagai BE-20).

* [x] **REQ-BE-08: Endpoint Pembaruan Profil & Keamanan Pengguna (`PUT /api/auth/profile` & `PUT /api/auth/password`)**
  * Tanggal Diminta: 2026-10-13
  * Tanggal Selesai: 2026-10-13
  * Diminta Oleh: Frontend Team
  * Diselesaikan Oleh: Backend Engineer
  * Implementasi:
    * Endpoint `PUT /api/auth/profile` untuk memperbarui nama lengkap pengguna di tabel `users`.
    * Endpoint `PUT /api/auth/password` untuk mengubah kata sandi dengan verifikasi `oldPassword` via bcrypt dan hashing aman kata sandi baru.
  * Status: [x] SELESAI (Tercatat di BACKEND_TASKS.md sebagai BE-21).

* [x] **REQ-BE-09: Dukungan Web Push Notification PWA VAPID (`GET /api/notifications/vapid-key` & `POST /api/notifications/subscribe`)**
  * Tanggal Diminta: 2026-10-13
  * Tanggal Selesai: 2026-10-13
  * Diminta Oleh: Frontend Team
  * Diselesaikan Oleh: Backend Engineer
  * Implementasi:
    * Endpoint `GET /api/notifications/vapid-key` untuk mengembalikan Public VAPID Key server.
    * Endpoint `POST /api/notifications/subscribe` untuk menyimpan langganan token Web Push ke tabel `web_push_subscriptions`.
    * Fungsi `SendWebPushAlert` di `handlers/webpush.go` yang otomatis dipanggil saat mendeteksi event hujan (`rain_start`) untuk membunyikan push alert di ponsel pengguna.
  * Status: [x] SELESAI (Tercatat di BACKEND_TASKS.md sebagai BE-22).

* [x] **REQ-BE-03: Endpoint Riwayat Log Prediksi AI & Evaluasi Akurasi (`GET /api/ai/predictions/history`)**
  * Tanggal Diminta: 2026-10-09
  * Tanggal Selesai: 2026-10-12
  * Diminta Oleh: Frontend Team
  * Implementasi:
    * Endpoint `GET /api/ai/predictions/history?deviceId={id}&limit=50` di `handlers/ai.go`.
    * Membaca riwayat `ai_predictions` dan membandingkannya dengan data telemetri sensor fisik 60 menit pasca-prediksi.
    * Mengembalikan evaluasi `accuracyRatePct`, `actualRainOccurred`, dan `accuracyStatus` ("tepat" atau "meleset").
  * Status: Selesai (Tercatat di [BACKEND_TASKS.md](BACKEND_TASKS.md) sebagai BE-16).

* [x] **REQ-BE-04: Endpoint Ekspor Data Riwayat Telemetri CSV (`GET /api/telemetry/export`)**
  * Tanggal Diminta: 2026-10-09
  * Tanggal Selesai: 2026-10-12
  * Diminta Oleh: Frontend Team
  * Implementasi:
    * Endpoint `GET /api/telemetry/export?deviceId={id}&startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}&format=csv` di `handlers/api.go`.
    * Mengalirkan file CSV dengan header attachment (`Content-Type: text/csv`) berisi kolom `timestamp,raw_adc,wet_pct,is_wet,temp_c,hum_pct,vbat,rssi`.
  * Status: Selesai (Tercatat di [BACKEND_TASKS.md](BACKEND_TASKS.md) sebagai BE-17).

* [x] **REQ-BE-05: Penyesuaian Simulator & Klasifikasi 4 Kondisi Cuaca (`POST /api/simulator/weather`)**
  * Tanggal Diminta: 2026-10-09
  * Tanggal Selesai: 2026-10-12
  * Diminta Oleh: Frontend Team
  * Implementasi:
    * Dukungan kondisi cuaca `mendung` di `handlers/simulator.go` (kelembapan 85%, awan tebal, `wet: false`, motor posisi siaga `extended`).
    * Dukungan kondisi `cerah`, `mendung`, `hujan`, `badai`, dan backward compatibility `gerimis`.
  * Status: Selesai (Tercatat di [BACKEND_TASKS.md](BACKEND_TASKS.md) sebagai BE-18).

* [x] **REQ-BE-01: API & MQTT Status/Kontrol Motor DC Jemuran (Otomasi Kanopi Atap)**
  * Tanggal Diminta: 2026-10-09
  * Tanggal Selesai: 2026-10-09
  * Diminta Oleh: Frontend Team
  * Implementasi:
    * Endpoint `GET /api/devices/:id/motor` (Mengembalikan `position`, `status`, dan `lastMovedTs`).
    * Endpoint `POST /api/devices/:id/motor/command` (Payload `{"action":"retract"|"extend"}`).
    * Sinkronisasi objek `motor` pada MQTT state message di `mqtt/subscriber.go`.
    * Broadcast event `motor` ke seluruh klien WebSocket secara realtime.
  * Status: Selesai (Tercatat di [BACKEND_TASKS.md](BACKEND_TASKS.md) sebagai BE-13).

* [x] **REQ-BE-02: Endpoint Injeksi Telemetri Simulasi Cuaca (Demo Mode Hub)**
  * Tanggal Diminta: 2026-10-09
  * Tanggal Selesai: 2026-10-09
  * Diminta Oleh: Frontend Team
  * Implementasi:
    * Endpoint `POST /api/simulator/weather` dengan payload `{ "deviceId": "...", "condition": "cerah" | "gerimis" | "hujan" | "badai" }`.
    * Menginjeksi data analog ADC, suhu, kelembapan, persentase basah, status motor, dan event darurat ke database, Redis list cache, dan siaran realtime WebSocket.
  * Status: Selesai (Tercatat di [BACKEND_TASKS.md](BACKEND_TASKS.md) sebagai BE-14).

