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

* [ ] **REQ-BE-06: Endpoint Sinkronisasi Pengaturan Akun & Preferensi Cloud (`GET /api/user/settings` & `PUT /api/user/settings`)**
  * Tanggal Diminta: 2026-10-13
  * Diminta Oleh: Frontend Team
  * Latar Belakang / Kebutuhan UI: Komponen `DeviceView.tsx` (FE-10) dan `Header.tsx` memiliki konfigurasi pilihan nada dering alarm (`sirine`, `bell`, `hujan`), volume audio alarm (0-100), preferensi tema visual (`light`, `dark`, `system`), dan status audio efek cuaca yang saat ini hanya tersimpan di `localStorage` peramban lokal. Jika pengguna membuka aplikasi di ponsel atau perangkat lain, preferensi ini tidak tersinkronisasi. Frontend membutuhkan endpoint penyimpanan pengaturan berbasis akun user yang aktif.
  * Usulan Endpoint: `GET /api/user/settings` dan `PUT /api/user/settings` (memerlukan Header `Authorization: Bearer <token>`).
  * Format Request / Response yang Diharapkan:
    ```json
    // Request PUT /api/user/settings
    {
      "tema": "dark",
      "alarmSound": "sirine",
      "alarmVolume": 75,
      "weatherAudioMuted": false
    }

    // Response GET / PUT (200 OK)
    {
      "userId": "usr-xxx",
      "tema": "dark",
      "alarmSound": "sirine",
      "alarmVolume": 75,
      "weatherAudioMuted": false,
      "updatedAt": "2026-10-13T09:30:00Z"
    }
    ```
  * Status: Menunggu Dikerjakan

* [ ] **REQ-BE-07: Endpoint Pembersihan Riwayat Telemetri & Log Event Tertentu (`DELETE /api/devices/:id/telemetry` & `DELETE /api/devices/:id/events`)**
  * Tanggal Diminta: 2026-10-13
  * Diminta Oleh: Frontend Team
  * Latar Belakang / Kebutuhan UI: Pada tab Riwayat (`HistoryView.tsx`), terdapat tombol aksi pembersihan log event (`onClearEvents`). Saat ini aksi tersebut hanya membersihkan array `localStorage` lokal di browser. Pengguna memerlukan kemampuan untuk membersihkan rekaman data telemetri historis atau log peristiwa pada database server VPS aaPanel tanpa harus menghapus unit perangkatnya secara keseluruhan (`DELETE /api/devices/:id`).
  * Usulan Endpoint:
    * `DELETE /api/devices/:id/telemetry` (Menghapus data pembacaan telemetri untuk device tertentu, dengan opsi query rentang waktu `?before={ts}` atau semua).
    * `DELETE /api/devices/:id/events` (Menghapus data log peristiwa untuk device tertentu).
  * Format Request / Response yang Diharapkan:
    ```json
    // Response DELETE (200 OK)
    {
      "message": "Riwayat data perangkat berhasil dibersihkan",
      "deviceId": "hs-xxx",
      "rowsAffected": 42
    }
    ```
  * Status: Menunggu Dikerjakan

* [ ] **REQ-BE-08: Endpoint Pembaruan Profil & Keamanan Pengguna (`PUT /api/auth/profile` & `PUT /api/auth/password`)**
  * Tanggal Diminta: 2026-10-13
  * Diminta Oleh: Frontend Team
  * Latar Belakang / Kebutuhan UI: Frontend telah menyediakan identitas akun pengguna di header dan pengaturan. Namun pengguna belum memiliki antarmuka API untuk mengganti nama lengkap profil tampilan atau mengubah kata sandi akun setelah registrasi.
  * Usulan Endpoint:
    * `PUT /api/auth/profile` (Memperbarui nama lengkap: payload `{"name": "Nama Baru"}`).
    * `PUT /api/auth/password` (Mengubah kata sandi: payload `{"oldPassword": "...", "newPassword": "..."}`).
  * Format Request / Response yang Diharapkan:
    ```json
    // Response PUT (200 OK)
    {
      "status": "success",
      "message": "Profil berhasil diperbarui",
      "user": { "id": "usr-1", "username": "budi", "name": "Budi Santoso" }
    }
    ```
  * Status: Menunggu Dikerjakan

* [ ] **REQ-BE-09: Dukungan Web Push Notification PWA VAPID (`GET /api/notifications/vapid-key` & `POST /api/notifications/subscribe`)**
  * Tanggal Diminta: 2026-10-13
  * Diminta Oleh: Frontend Team
  * Latar Belakang / Kebutuhan UI: Di perangkat mobile PWA, ketika browser ditutup atau layar HP terkunci, `Notification API` biasa tidak dapat bersuara jika halaman web tidak sedang terbuka di layar. Agar PWA dapat menerima push alert darurat saat jemuran ditarik otomatis (sebagai pendamping bot Telegram), backend perlu mengirimkan Web Push melalui Service Worker `sw.js`.
  * Usulan Endpoint:
    * `GET /api/notifications/vapid-key` (Mengembalikan public VAPID key server).
    * `POST /api/notifications/subscribe` (Menyimpan subscription object dari browser klien).
  * Format Request:
    ```json
    {
      "deviceId": "hs-xxx",
      "subscription": {
        "endpoint": "https://fcm.googleapis.com/fcm/send/...",
        "keys": { "p256dh": "...", "auth": "..." }
      }
    }
    ```
  * Status: Menunggu Dikerjakan

---

## Riwayat Permintaan Selesai (Archive)

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

