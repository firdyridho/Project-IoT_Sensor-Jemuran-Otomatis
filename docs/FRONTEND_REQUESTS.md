# Kotak Masuk Permintaan ke Frontend (Frontend Requests Inbox)

Dokumen ini adalah media komunikasi resmi dari **Backend Engineer** kepada **Frontend Developer**.

Jika backend telah menyelesaikan endpoint baru, algoritma baru, atau WebSocket event baru yang membutuhkan antarmuka pengguna (UI/UX) di website, tuliskan permintaan tersebut di berkas ini.

---

## Panduan Penggunaan untuk Backend Engineer

> **PERINGATAN SINKRONISASI (SOP ANTI-TIMPA)**:
> Sebelum menulis permintaan baru dan sesaat sebelum melakukan push:
> 1. Wajib jalankan `git pull origin staging` terlebih dahulu.
> 2. Periksa apakah Frontend baru saja merilis perubahan tampilan atau request baru di `BACKEND_REQUESTS.md`.
> 3. Jangan mengandalkan hasil pull sesi sebelumnya. Selalu pull tepat sebelum menulis dan tepat sebelum push!

### Langkah Menulis Permintaan:
1. Jalankan `git pull origin staging`.
2. Tambahkan permintaan baru pada bagian **Daftar Permintaan Aktif** di bawah menggunakan format standar:
   ```markdown
   * [ ] **REQ-FE-XX: [Nama Komponen / Fitur UI]**
     * Tanggal Diminta: YYYY-MM-DD
     * Diminta Oleh: Backend Engineer
     * Endpoint Backend yang Tersedia: [Contoh: POST /api/ai/predict-rain]
     * Spesifikasi Tampilan yang Diinginkan: [Jelaskan elemen UI apa saja yang perlu ditampilkan]
     * Dokumen Rujukan: [Contoh: FRONTEND_TASKS.md bagian FE-05]
     * Status: Siap Dikerjakan oleh Frontend
   ```
3. Lakukan `git add docs/FRONTEND_REQUESTS.md`, commit, lalu jalankan `git pull origin staging` sekali lagi sebelum `git push origin staging`.

---

## Panduan untuk Frontend Developer

1. Periksa berkas ini untuk melihat komponen UI baru apa saja yang siap dibangun berdasarkan API yang sudah aktif.
2. Bangun komponen di React/TypeScript sesuai kontrak data yang disediakan.
3. Setelah komponen UI selesai diuji di browser:
   * Ubah status menjadi `[x] SELESAI`.
   * Pindahkan atau centang di [FRONTEND_TASKS.md](FRONTEND_TASKS.md).

---

## Daftar Permintaan Aktif (Inbox)

*Saat ini tidak ada permintaan aktif yang tertunda.*

---

## Riwayat Permintaan Selesai (Archive)

* [x] **REQ-FE-01: Pembuatan Komponen Widget Prediksi Hujan AI (`AIPredictionCard.tsx`)**
  * Tanggal Diminta: 2026-10-09
  * Tanggal Selesai: 2026-10-09
  * Diselesaikan Oleh: Frontend Developer
  * Endpoint Backend Terintegrasi: `POST /api/ai/predict-rain`
  * Komponen: `frontend/src/components/Dashboard/AIPredictionCard.tsx`
  * Spesifikasi Terpenuhi:
    * Gauge lingkaran probabilitas hujan interaktif.
    * Estimasi menit menuju hujan / kondisi stabil.
    * Badge keyakinan (Tinggi, Sedang, Rendah).
    * Ringkasan tren delta kelembapan, delta suhu, dan ADC sensor.
    * Tombol refresh analisis AI terhubung ke backend & fallback lokal.
  * Status: [x] SELESAI & Terpasang di Dashboard

* [x] **REQ-FE-02: Pembuatan Kartu Rekomendasi Jemuran Cerdas AI (`DryingAdviceCard.tsx`)**
  * Tanggal Diminta: 2026-10-09
  * Tanggal Selesai: 2026-10-09
  * Diselesaikan Oleh: Frontend Developer
  * Endpoint Backend Terintegrasi: `GET /api/ai/drying-advice?deviceId={ID}`
  * Komponen: `frontend/src/components/Dashboard/DryingAdviceCard.tsx`
  * Spesifikasi Terpenuhi:
    * Badge status utama: "AMAN JEMUR", "WASPADA JEMUR", atau "ANGKAT SEGERA".
    * Circular gauge indikator Skor Jemur (0-100).
    * Estimasi jam pakaian kering (misal: ~2.5 jam).
    * Rentang jam jemur optimal (misal: 08:30 - 14:00 WIB).
    * Teks saran cerdas berdasarkan data mikroklimat sensor & BMKG.
  * Status: [x] SELESAI & Terpasang di Dashboard

