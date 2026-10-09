# Kotak Masuk Permintaan ke Backend (Backend Requests Inbox)

Dokumen ini adalah media komunikasi resmi dari **Frontend Developer** kepada **Backend Engineer**. 

Jika frontend membutuhkan endpoint baru, modifikasi parameter data, atau fungsi database tambahan, tuliskan permintaan tersebut di berkas ini. Backend Engineer tidak akan terganggu dan status tugas yang sudah selesai di `BACKEND_TASKS.md` tidak akan tertimpa.

---

## Panduan Penggunaan untuk Frontend Developer

1. Lakukan `git pull origin staging` sebelum menambahkan permintaan baru.
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
3. Commit dan push berkas ini ke branch staging.

---

## Panduan untuk Backend Engineer

1. Periksa berkas ini secara berkala saat memulai sesi kerja.
2. Jika permintaan telah selesai diimplementasikan di Golang dan lulus pengujian:
   * Ubah status menjadi `[x] SELESAI`.
   * Pindahkan atau referensikan ke [BACKEND_TASKS.md](BACKEND_TASKS.md) sebagai catatan fitur permanen.
   * Beritahukan Frontend Developer bahwa endpoint telah aktif.

---

## Daftar Permintaan Aktif (Inbox)

*(Saat ini kotak masuk kosong. Seluruh endpoint backend yang dibutuhkan telah aktif dan tercatat di [BACKEND_TASKS.md](BACKEND_TASKS.md).)*

---

## Riwayat Permintaan Selesai (Archive)

*Belum ada permintaan di arsip.*
