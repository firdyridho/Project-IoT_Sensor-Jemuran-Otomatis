# Portal Manajemen Task: Backend & Frontend

Dokumentasi task pada repositori ini dipisahkan secara independen ke dalam dua berkas kerja khusus agar pengembangan terfokus dan terstruktur:

---

## 1. Task Khusus Backend Engineer
* **Dokumen Rujukan**: [docs/BACKEND_TASKS.md](BACKEND_TASKS.md)
* **Lingkup Kerja**:
  * Golang 1.22+, GORM, Gin Framework, MySQL 5.7, Redis Cache.
  * Endpoint AI Prediksi Hujan (`POST /api/ai/predict-rain`).
  * Endpoint AI Rekomendasi Jemuran Cerdas (`GET /api/ai/drying-advice`).
  * Realtime WebSocket Hub & MQTT Ingestion ESP32.
  * Keamanan, isolasi data per akun, dan background workers di VPS.

---

## 2. Task Khusus Frontend / UI Developer
* **Dokumen Rujukan**: [docs/FRONTEND_TASKS.md](FRONTEND_TASKS.md)
* **Lingkup Kerja**:
  * React 19, TypeScript, Vite, Tailwind CSS v4.
  * Widget Tampilan Prediksi Hujan AI (`AIPredictionCard.tsx`).
  * Kartu Asisten Rekomendasi Jemuran AI (`DryingAdviceCard.tsx`).
  * Visualisasi riwayat telemetri, responsivitas mobile, PWA, dan sistem tema.

---

## 3. Alur Komunikasi & Serah Terima Fitur

1. **Backend First**: Backend Engineer membuat logika server dan menguji endpoint di Golang.
2. **Handoff Prompt**: Setelah endpoint backend aktif, Backend Engineer cukup menyampaikan:
   > *"Endpoint BE-XX di backend sudah selesai diuji. Tolong buatkan komponen antarmukanya FE-XX di frontend sesuai spesifikasi di docs/FRONTEND_TASKS.md."*
3. **Frontend Implementation**: Asisten AI atau frontend engineer akan langsung membangun antarmuka pengguna tanpa mengubah atau mengganggu kode backend.
