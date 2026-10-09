# Portal Manajemen Task & Permintaan Fitur (Backend & Frontend)

Dokumentasi kerja pada repositori ini mengadopsi sistem pemisahan berkas mandiri (Inbox & Task Roadmap) guna mencegah konflik Git saat banyak developer atau asisten AI bekerja bersamaan.

---

## Struktur 4 Berkas Manajemen Kerja

| Berkas | Pemilik / Penanggung Jawab | Fungsi & Kegunaan |
|---|---|---|
| [BACKEND_TASKS.md](BACKEND_TASKS.md) | **Backend Engineer** | Daftar fitur resmi, arsitektur server, dan histori task selesai `[x]` di sisi backend. |
| [BACKEND_REQUESTS.md](BACKEND_REQUESTS.md) | **Frontend Developer (Penulis)**<br/>Backend Engineer (Penerima) | **Kotak Masuk (Inbox)**: Frontend meminta endpoint baru atau penyesuaian query tanpa mengganggu berkas task backend. |
| [FRONTEND_TASKS.md](FRONTEND_TASKS.md) | **Frontend Developer** | Daftar komponen UI resmi, perbaikan layout, dan histori task selesai `[x]` di sisi web. |
| [FRONTEND_REQUESTS.md](FRONTEND_REQUESTS.md) | **Backend Engineer (Penulis)**<br/>Frontend Developer (Penerima) | **Kotak Masuk (Inbox)**: Backend meminta pembuatan widget/komponen antarmuka baru setelah endpoint backend siap. |

---

## Alur Kerja Dua Arah (Workflow Inbox -> Done)

### Skenario 1: Frontend Membutuhkan Endpoint / Data Baru
1. Frontend Developer membuka [BACKEND_REQUESTS.md](BACKEND_REQUESTS.md).
2. Tuliskan deskripsi endpoint atau data yang dibutuhkan di bagian **Daftar Permintaan Aktif**.
3. Backend Engineer membaca permintaan, membangun endpoint di Golang, dan mengujinya.
4. Setelah aktif, Backend Engineer menandai selesai dan mencatatnya ke [BACKEND_TASKS.md](BACKEND_TASKS.md).

### Skenario 2: Backend Telah Menyelesaikan Fitur Baru dan Butuh UI
1. Backend Engineer membuka [FRONTEND_REQUESTS.md](FRONTEND_REQUESTS.md).
2. Tuliskan endpoint yang sudah aktif beserta spesifikasi tampilan yang diharapkan.
3. Frontend Developer membaca permintaan dan membangun komponen React/Tailwind sesuai panduan.
4. Setelah UI aktif di dashboard, Frontend Developer menandai selesai dan mencatatnya ke [FRONTEND_TASKS.md](FRONTEND_TASKS.md).

---

## Aturan Kolaborasi Git

1. **Selalu Tarik Perubahan Terkini**:
   Biasakan menjalankan perintah berikut sebelum mulai bekerja atau menuliskan permintaan baru:
   ```bash
   git pull origin staging
   ```
2. **Jangan Mengubah Berkas Task Milik Rekan**:
   Frontend tidak perlu mengubah isi `BACKEND_TASKS.md`. Cukup gunakan `BACKEND_REQUESTS.md`. Demikian pula sebaliknya.