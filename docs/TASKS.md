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

## Aturan Kolaborasi Git & SOP Anti-Timpa (Wajib Ditaati)

Untuk menghindari kasus di mana developer melakukan pull saat lawan belum selesai, lalu saat sudah selesai lupa pull kembali dan langsung push sehingga menimpa pekerjaan rekan, patuhi aturan berikut:

### 1. Wajib `git pull` SEBELUM Menulis di Berkas Request
* Jangan pernah menulis permintaan baru di `BACKEND_REQUESTS.md` atau `FRONTEND_REQUESTS.md` sebelum melakukan:
  ```bash
  git pull origin staging
  ```
* Tujuannya agar Anda selalu membaca versi paling akhir dari berkas request dan tidak membuat permintaan yang sudah usang atau duplikat.

### 2. Wajib Cek Perubahan Lawan SEBELUM Melakukan Push
* **Khusus Frontend**: Sebelum melakukan push (baik kode maupun request), periksa apakah Backend baru saja merilis perubahan endpoint, skema database, atau payload baru. Selalu sinkronkan dengan perubahan backend agar frontend tidak berjalan di atas API lama.
* **Khusus Backend**: Sebelum melakukan push, periksa apakah Frontend sedang membutuhkan data darurat di `BACKEND_REQUESTS.md`.

### 3. Siklus Aman Push (Golden Push Cycle)
Gunakan urutan perintah berikut setiap kali hendak mengirimkan pekerjaan ke remote:

```bash
# Langkah 1: Tarik perubahan rekan terlebih dahulu
git pull origin staging

# Langkah 2: Tambahkan dan commit perubahan Anda
git add <nama_berkas>
git commit -m "deskripsi perubahan yang jelas"

# Langkah 3: Tarik sekali lagi sesaat sebelum push (memastikan tidak ada commit lawan yang baru masuk)
git pull origin staging

# Langkah 4: Push ke remote dengan aman
git push origin staging
```

### 4. Jangan Mengubah Berkas Task Milik Rekan
* Frontend tidak boleh mengutak-atik isi [BACKEND_TASKS.md](BACKEND_TASKS.md).
* Backend tidak boleh mengutak-atik isi [FRONTEND_TASKS.md](FRONTEND_TASKS.md).
* Komunikasi penambahan fitur baru HANYA dilakukan melalui berkas `*_REQUESTS.md` masing-masing.

### 5. Aturan Ketat Branching: Wajib Push ke `staging` Saja
* Seluruh pekerjaan harian, perbaikan bug, penambahan fitur backend/frontend, serta pembaruan task **HANYA boleh di-push ke branch `staging`**.
* **DILARANG auto-push atau auto-merge ke branch `main`**.
* Branch `main` adalah branch produksi (Production) dan hanya boleh diperbarui ketika fitur di `staging` sudah benar-benar stabil, teruji, dan disetujui secara eksplisit oleh pemilik proyek.