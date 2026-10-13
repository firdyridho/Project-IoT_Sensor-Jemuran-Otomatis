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

## Daftar Permintaan Aktif (Inbox)

* [ ] **REQ-FE-06: Perbaikan Logika Status Potensi Hujan BMKG (Sinkronisasi Badge Hujan vs Ilustrasi & Deskripsi Cuaca)**
  * Tanggal Diminta: 2026-10-13
  * Diminta Oleh: Backend Engineer
  * Prioritas: Tinggi (Inkonsistensi Data & Tampilan Antarmuka)
  * Berkas Terkait:
    * `frontend/src/types/bmkg.ts` (fungsi pembantu `berpotensiHujan`)
    * `frontend/src/components/Cuaca/WeatherView.tsx` (kartu slot cuaca, badge header, dan rendering gambar/ikon)
    * `frontend/src/components/Dashboard/QuickWeatherCard.tsx` (kartu cuaca ringkas di dashboard)
    * `frontend/src/App.tsx` (evaluasi `bmkgSlotNow` dan `realCondition`)
  * Deskripsi Masalah:
    1. Anomali Evaluasi Curah Hujan (`slot.tp > 0`):
       Pada `frontend/src/types/bmkg.ts`, fungsi `berpotensiHujan(slot)` dievaluasi dengan:
       `(slot.tp != null && slot.tp > 0) || /hujan|petir|guntur/i.test(slot.weather_desc)`.
       Pada server API BMKG, parameter `tp` (Total Precipitation) sering kali berisi residu numerik kecil (seperti 0.01 mm atau 0.1 mm) meskipun klasifikasi cuaca resmi (`weather_desc`) adalah "Cerah" atau "Cerah Berawan". Hal ini menyebabkan fungsi mengembalikan `true` dan memunculkan badge `Hujan`.
    2. Paradoks Tampilan Kartu:
       Pada `WeatherView.tsx`, kartu slot menampilkan badge `Hujan` pada header, namun ilustrasi di bawahnya menampilkan gambar matahari/awan cerah (`cerah-am.svg` / `cerah berawan-am.svg`) dan teks bertuliskan "Cerah Berawan" atau "Cerah".
    3. Fallback Ikon Statis:
       Jika berkas gambar dari CDN BMKG gagal dimuat atau URL bernilai null, komponen `WeatherView.tsx` secara statis menampilkan `<CloudSun className="w-8 h-8 text-cyan-500" />` (ikon matahari & awan) tanpa memeriksa apakah slot tersebut sebenarnya adalah hujan atau petir.
  * Spesifikasi Teknis yang Diinginkan:
    1. Koreksi Fungsi `berpotensiHujan` di `frontend/src/types/bmkg.ts`:
       Jadikan `slot.weather_desc` sebagai sumber kebenaran utama (*ground truth*). Kondisi "Cerah", "Cerah Berawan", atau "Berawan" tidak boleh memicu potensi hujan hanya karena nilai jejak `tp` desimal kecil.
       Rekomendasi implementasi:
       ```ts
       export const berpotensiHujan = (slot: Slot): boolean => {
         if (!slot) return false;
         const desc = slot.weather_desc?.toLowerCase() || '';
         if (/hujan|petir|guntur|badai|gerimis/i.test(desc)) return true;
         if (/cerah|berawan|kabut|asap/i.test(desc)) return false;
         return slot.tp != null && slot.tp >= 0.5;
       };
       ```
    2. Sinkronisasi Tampilan Kartu pada `WeatherView.tsx`:
       Pastikan badge status selaras dengan `weather_desc`. Jangan tampilkan badge `Hujan` jika teks deskripsi menyatakan `Cerah` atau `Cerah Berawan`.
    3. Pemetaan Ikon Cadangan Dinamis (*Dynamic Fallback Icon*):
       Di `WeatherView.tsx` dan `QuickWeatherCard.tsx`, sediakan pemetaan ikon Lucide dinamis berdasarkan `weather_desc` atau kode cuaca (`Sun` untuk cerah, `CloudSun` untuk cerah berawan, `Cloud` untuk berawan, `CloudRain` untuk hujan, `CloudLightning` untuk petir/badai) agar ketika gambar SVG tidak tersedia atau gagal dimuat via `onError`, tampilan ilustrasi tetap sesuai dengan kondisi cuaca sebenarnya.
    4. Penyelarasan Slot Cuaca Terkini pada `App.tsx`:
       Pastikan penentuan slot cuaca saat ini (`bmkgSlotNow`) mencocokkan waktu lokal perangkat saat ini, bukan selalu mengambil index slot pertama (`cuaca[0][0]` / jam 00:00 tengah malam), sehingga kondisi mikroklimat dashboard tetap akurat.
  * Status: Siap Dikerjakan oleh Frontend Developer

---

## Riwayat Permintaan Selesai (Archive)

* [x] **REQ-FE-05: Implementasi Client-Side Routing (React Router) untuk Navigasi Halaman & Deep Linking**
  * Tanggal Diminta: 2026-10-13
  * Tanggal Selesai: 2026-10-13
  * Diselesaikan Oleh: Frontend Developer
  * Komponen Terkait: `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/components/Common/NotFoundView.tsx`
  * Spesifikasi yang Terpenuhi:
    1. Mengintegrasikan `react-router-dom` dengan `<BrowserRouter>` pada level root aplikasi.
    2. Mendefinisikan struktur URL: `/` atau `/dashboard` (Dashboard), `/cuaca` (Prakiraan BMKG), `/grafik` (Grafik Realtime), `/riwayat` (Riwayat & Log), `/perangkat` (Kelola Perangkat), `/auth` atau `/login` (Login), `/register` (Registrasi), dan `*` (Halaman 404 Not Found).
    3. Mendukung deep linking langsung ke halaman tanpa redirect ke dashboard. Konfigurasi `vercel.json` SPA rewrite (`/(.*) -> /index.html`) memastikan tidak ada 404 dari web server.
    4. Menyinkronkan rute aktif dengan status visual link pada `Sidebar.tsx`, `Header.tsx`, dan `BottomNav.tsx`.
    5. Mendukung riwayat navigasi browser (tombol Back dan Forward) secara mulus.
    6. Membuat komponen `NotFoundView.tsx` untuk rute wildcard `*` dengan desain glassmorphism modern bertema dinamis (Dark & Light Mode) serta tombol kembali cepat ke Dashboard atau Halaman Sebelumnya.
  * Status: [x] SELESAI

* [x] **REQ-FE-03: Penyesuaian Ambang Batas Watchdog Offline Realtime (6 Detik) & Validasi Status Awal**
  * Tanggal Diminta: 2026-10-12
  * Tanggal Selesai: 2026-10-12
  * Diselesaikan Oleh: Frontend Developer
  * Endpoint Backend yang Tersedia: `GET /api/devices`, `GET /api/devices/:id`, WebSocket `/ws` (event `state` & `telemetry`)
  * Spesifikasi Perubahan yang Terpenuhi:
    1. Di `App.tsx`, batas toleransi watchdog `isDeviceOffline` diturunkan menjadi 6 detik (`Date.now() - lastSeenTs > 6000`), selaras dengan interval telemetri ESP32 (2 detik) dan keepalive (5 detik).
    2. Saat pengguna pertama kali membuka website atau beralih perangkat (`handleSelectDevice`), validasi awal memastikan perangkat tidak berstatus online jika status dari backend `offline` atau data terakhir `> 6000ms`.
  * Status: [x] SELESAI

* [x] **REQ-FE-04: [CRITICAL BUG] Filter Telemetri & State Berdasarkan Device ID Aktif di `App.tsx`**
  * Tanggal Diminta: 2026-10-12
  * Tanggal Selesai: 2026-10-12
  * Diselesaikan Oleh: Frontend Developer
  * Lokasi Berkas Frontend: `frontend/src/App.tsx` (fungsi `handleIngestTelemetry`, `handleIngestState`, `handleIngestEvent`, dan `handleSelectDevice`)
  * Spesifikasi Perubahan yang Terpenuhi:
    1. Di `handleIngestTelemetry`: Ditambahkan filter `if (telemetry.deviceId && currentDeviceId && telemetry.deviceId !== currentDeviceId) return;`.
    2. Di `handleIngestState`: Ditambahkan filter `if (state.deviceId && currentDeviceId && state.deviceId !== currentDeviceId) return;`.
    3. Di `handleIngestEvent`: Ditambahkan filter `if (ev.deviceId && currentDeviceId && ev.deviceId !== currentDeviceId) return;`.
    4. Di `handleSelectDevice(deviceId)`: `lastSeenTs`, `latestState`, `readings`, dan `events` di-reset spesifik untuk perangkat yang dipilih.
  * Status: [x] SELESAI (Bug multi-tenancy terselesaikan)

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

