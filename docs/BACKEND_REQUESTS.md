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

*Saat ini tidak ada permintaan aktif yang tertunda.*

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

