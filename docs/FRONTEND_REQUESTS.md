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

* [ ] **REQ-FE-01: Pembuatan Komponen Widget Prediksi Hujan AI (`AIPredictionCard.tsx`)**
  * Tanggal Diminta: 2026-10-09
  * Diminta Oleh: Backend Engineer
  * Endpoint Backend yang Tersedia: `POST /api/ai/predict-rain` (Status: Aktif & Teruji)
  * Spesifikasi Tampilan yang Diinginkan:
    * Gauge / Progress Bar Lingkaran: Probabilitas Hujan (contoh: 85% Potensi Hujan).
    * Estimasi Waktu: "Diprediksi mulai gerimis dalam ~20 menit".
    * Badge Keyakinan: Hijau (Tinggi), Kuning (Sedang), Abu-abu (Rendah).
    * Ringkasan Faktor: Nilai kelembapan yang melonjak dan penurunan suhu.
    * Tombol manual "Refresh Analisis AI" dengan status loading.
  * Dokumen Rujukan: [FRONTEND_TASKS.md](FRONTEND_TASKS.md) (Task FE-05).
  * Status: Menunggu Implementasi UI Frontend.

* [ ] **REQ-FE-02: Pembuatan Kartu Rekomendasi Jemuran Cerdas AI (`DryingAdviceCard.tsx`)**
  * Tanggal Diminta: 2026-10-09
  * Diminta Oleh: Backend Engineer
  * Endpoint Backend yang Tersedia: `GET /api/ai/drying-advice?deviceId={ID}` (Status: Aktif & Teruji)
  * Spesifikasi Tampilan yang Diinginkan:
    * Status Utama: Badge besar "AMAN JEMUR" (hijau), "WASPADA JEMUR" (kuning), atau "ANGKAT SEGERA" (merah).
    * Indikator Skor Pengeringan: "Skor Jemur: 88/100".
    * Estimasi Jam Kering: "Estimasi pakaian kering dalam ~2.5 jam".
    * Rentang Jam Optimal: "Waktu Jemur Optimal: 08:30 - 14:00 WIB".
    * Teks Saran Cerdas: Ringkasan ramah pengguna berdasarkan kondisi lapangan.
  * Dokumen Rujukan: [FRONTEND_TASKS.md](FRONTEND_TASKS.md) (Task FE-06).
  * Status: Menunggu Implementasi UI Frontend.

---

## Riwayat Permintaan Selesai (Archive)

*Belum ada permintaan di arsip.*
