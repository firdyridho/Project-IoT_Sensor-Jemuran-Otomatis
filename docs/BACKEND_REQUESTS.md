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

* [ ] **REQ-BE-01: API & MQTT Status/Kontrol Motor DC Jemuran (Otomasi Kanopi Atap)**
  * Tanggal Diminta: 2026-10-09
  * Diminta Oleh: Frontend Team
  * Latar Belakang / Kebutuhan UI: Frontend telah memiliki kartu antarmuka `ClotheslineMotorCard.tsx` yang menampilkan posisi rel jemuran (di bawah atap kanopi vs di luar ruangan) dan status Motor DC (L298N) saat hujan terdeteksi. Dibutuhkan sinkronisasi data aktual dari firmware ESP32 dan backend.
  * Usulan Endpoint:
    * `GET /api/devices/:id/motor` -> mengembalikan `{ "position": "sheltered" | "extended", "status": "idle" | "moving", "lastMovedTs": 1775702400000 }`
    * (Opsional v2) `POST /api/devices/:id/motor/command` dengan payload `{"action": "retract" | "extend"}`
  * Format Telemetri Tambahan di MQTT `state`:
    * Menambahkan field objek `motor` pada payload state telemetri MQTT `hujansensor/{id}/state`.
  * Status: Menunggu Dikerjakan

* [ ] **REQ-BE-02: Endpoint Injeksi Telemetri Simulasi Cuaca (Demo Mode Hub)**
  * Tanggal Diminta: 2026-10-09
  * Diminta Oleh: Frontend Team
  * Latar Belakang / Kebutuhan UI: Frontend kini memiliki Chip Bar Demo (Cerah, Gerimis, Hujan, Badai) untuk pengujian efek audio, petir halilintar, dan pergerakan jemuran. Jika backend menyediakan endpoint injeksi telemetri virtual ke broker WebSocket staging, tim QA dapat melakukan pengujian otomatis tanpa hardware ESP32 fisik.
  * Usulan Endpoint: `POST /api/simulator/weather` dengan payload `{ "deviceId": "hs-xxx", "condition": "cerah" | "gerimis" | "hujan" | "badai" }`
  * Status: Menunggu Dikerjakan

---

## Riwayat Permintaan Selesai (Archive)

*Belum ada permintaan di arsip.*
