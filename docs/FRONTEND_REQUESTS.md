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

* [ ] **REQ-FE-13: Antarmuka Unggah Nada Dering Alarm Kustom (Custom Audio Upload) & Caching Audio Offline**
  * Tanggal Diminta: 2026-10-14
  * Diminta Oleh: Backend Engineer (sesuai arahan Project Owner)
  * Endpoint Backend yang Tersedia:
    * `POST /api/user/custom-alarm` (Multipart `audio`, max 5MB, format `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.webm`)
    * `PUT /api/user/profile` (Mendukung `customAlarmUrl: string` dan `alarmTone: "custom"`)
    * `GET /uploads/tones/:filename` (Static file serving dari filesystem VPS dengan HTTP cache & byte-range streaming)
  * Alasan Arsitektur Penyimpanan:
    * **Disimpan di Filesystem VPS (`uploads/tones/`)**, BUKAN di database BLOB. Hal ini sesuai standar clean code & high performance untuk mencegah bloat database, fragmentasi tabel, lonjakan RAM server, dan kelambatan backup. Database hanya menyimpan URL ringkas (`user.customAlarmUrl`).
  * Spesifikasi Tampilan & UX yang Diinginkan:
    1. **Tab Preferensi Pengaturan (`SettingsView.tsx`)**:
       * Tambahkan pilihan nada dering baru: *"Nada Dering Kustom (Unggah Sendiri)"* (`value: "custom"`).
       * Tombol / Area Dropzone *"Unggah Audio (.mp3, .wav, .ogg, max 5MB)"*.
       * Validasi ukuran file di sisi client (maksimal 5MB) sebelum request dikirim.
       * Indikator progress/loading unggah yang estetik.
       * Pemutar audio preview instan (Play/Pause) untuk menguji nada dering kustom yang telah diunggah.
    2. **Pemutaran Alarm Persisten (`audioAlarm.ts` & `PersistentRainAlarmModal.tsx`)**:
       * Jika user memilih nada kustom, putar file audio dari `customAlarmUrl` secara berulang (*looping = true*) saat alarm hujan terpicu.
       * **Offline Resilience**: Simpan buffer audio kustom ke IndexedDB / Cache Storage agar alarm tetap berbunyi keras meski koneksi internet terputus saat badai hujan deras.
  * Dokumen Rujukan: [API_CONTRACT_AGREEMENT.md](API_CONTRACT_AGREEMENT.md), [PRD.md](PRD.md)
  * Status: Siap Dikerjakan oleh Frontend

---

* [x] **REQ-FE-07: Peningkatan Responsivitas Mobile (Mobile-First Layout) pada Header Dashboard, Navigasi Tab, dan Komponen Fitur**
  * Tanggal Diminta: 2026-10-13
  * Tanggal Selesai: 2026-10-14
  * Diminta Oleh: Backend Engineer (sesuai arahan Project Owner)
  * Diselesaikan Oleh: Frontend Developer
  * Komponen & Berkas Terkait:
    * `frontend/src/components/Layout/Header.tsx`
    * `frontend/src/components/Dashboard/TelemetryGrid.tsx`
    * `frontend/src/components/Layout/BottomNav.tsx`
    * `frontend/src/App.tsx`
  * Spesifikasi Desain & Tampilan yang Terpenuhi:
    1. **Responsive Header Layout**: Header mobile (< 640px) beralih ke 2 baris (Baris 1 untuk Logo, nama perangkat truncate `max-w-[140px] sm:max-w-none`, tema & aksi; Baris 2 untuk chip status broker online/offline & ID perangkat).
    2. **Mobile-First Dashboard Cards**: Kartu telemetri utama beralih ke layout `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. Padding kontainer utama disesuaikan: `px-3 py-3` di mobile, `px-6 py-6` di tablet/desktop.
    3. **Navigasi Tab Mobile yang Halus**: Dock bottom navigation dengan safe area inset, target sentuh min-h-11, dan responsif.
  * Dokumen Rujukan: [PRD.md](PRD.md) Bagian 3 (User Interface), [FRONTEND_REQUESTS.md](FRONTEND_REQUESTS.md)
  * Status: [x] SELESAI

---

* [x] **REQ-FE-08: Redesain Splash Screen agar Lebih Clean, Elegan, dan Minimalis Modern**
  * Tanggal Diminta: 2026-10-13
  * Tanggal Selesai: 2026-10-14
  * Diminta Oleh: Backend Engineer (sesuai arahan Project Owner)
  * Diselesaikan Oleh: Frontend Developer
  * Komponen & Berkas Terkait:
    * `frontend/src/components/Common/SplashScreen.tsx`
  * Spesifikasi Desain & Tampilan yang Terpenuhi:
    1. **Visual Simpel & Elegan**: Menggunakan logo resmi `/favicon.svg?v=2` dengan animasi bernapas lembut (subtle breathing pulse). Tipografi `R I N T I K` dengan font-heading dan tracking proporsional serta sub-label *"IoT Jemuran Otomatis & Presisi Cuaca"*.
    2. **Minimalist Loading Bar**: Garis progres 2px dengan gradien cyan ke indigo (`from-cyan-400 to-indigo-500`) berjalan mulus 0% -> 100%.
    3. **Transisi Halus**: Efek transisi *fade-out* + *scale-up* (`opacity-0 scale-105 duration-700 ease-out`).
    4. **Dukungan Tema**: Mendukung tema Dark (`#070b14`) dan Light (`#f8fafc`) secara adaptif.
  * Dokumen Rujukan: [PRD.md](PRD.md)
  * Status: [x] SELESAI

---

* [x] **REQ-FE-09: Integrasi Notifikasi Realtime PWA & Browser Push Notification (Web Push API + VAPID)**
  * Tanggal Diminta: 2026-10-13
  * Tanggal Selesai: 2026-10-14
  * Diminta Oleh: Backend Engineer
  * Diselesaikan Oleh: Frontend Developer
  * Komponen & Berkas Terkait:
    * `frontend/public/sw.js` (event listener `push` dan `notificationclick`)
    * `frontend/src/services/webpush.ts` (layanan `WebPushService` pendaftaran PushManager & API backend)
    * `frontend/src/components/Perangkat/DeviceView.tsx` (kartu saklar izin & trigger push uji coba)
    * `frontend/src/components/Layout/Header.tsx` & `frontend/src/App.tsx` (lonceng notifikasi & aktivasi langsung)
  * Spesifikasi Implementasi yang Terpenuhi:
    1. **Tombol Aktivasi Notifikasi (User Gesture Trigger)**: Ikon lonceng di Header dan panel kendali notifikasi di tab Perangkat menyediakan pemicu eksplisit tanpa memicu popup browser secara agresif saat initial load.
    2. **Permintaan Izin & Registrasi Service Worker**: Integrasi penuh Web Push API via `WebPushService.subscribe()`, mengambil VAPID Public Key dari backend (`/api/notifications/vapid-public-key`), mengonversi ke `Uint8Array`, dan mendaftarkan push subscription ke endpoint `/api/notifications/subscribe`.
    3. **File Service Worker (`frontend/public/sw.js`)**: Dilengkapi listener event `push` dengan judul, isi pesan, badge, ikon `/favicon.svg?v=2`, getaran `[200, 100, 200]`, dan listener `notificationclick` yang memfokuskan atau membuka tab aplikasi.
    4. **In-App Toast Fallback**: Tetap aktif menampilkan toast WebSocket saat tab terbuka aktif di latar depan.
  * Dokumen Rujukan: [BACKEND_REQUESTS.md](BACKEND_REQUESTS.md), [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
  * Status: [x] SELESAI

---

* [x] **REQ-FE-10: Pembuatan Halaman / Modal Ketentuan Layanan (Terms of Service) dan Kebijakan Privasi (Privacy Policy)**
  * Tanggal Diminta: 2026-10-13
  * Tanggal Selesai: 2026-10-14
  * Diminta Oleh: Backend Engineer (sesuai arahan Project Owner)
  * Diselesaikan Oleh: Frontend Developer
  * Komponen & Berkas Terkait:
    * `frontend/src/components/Common/LegalModal.tsx` (modal dialog interaktif dengan tab switcher)
    * `frontend/src/components/Legal/LegalView.tsx` (halaman mandiri untuk `/terms` dan `/privacy`)
    * `frontend/src/components/Landing/LandingPage.tsx` (tautan footer legal & modal trigger)
    * `frontend/src/components/Auth/AuthPage.tsx` (klausul persetujuan pendaftaran & modal trigger)
    * `frontend/src/App.tsx` (rute `/terms`, `/privacy`, dan pendaftaran ke `isValidAppRoute`)
  * Spesifikasi Desain & Tampilan yang Terpenuhi:
    1. **Format Akses & Navigasi**: Dapat diakses sebagai rute mandiri (`/terms` dan `/privacy`) serta modal dialog dengan tab switcher antara *"Ketentuan Layanan"* dan *"Kebijakan Privasi"*. Didukung tombol kembali ke landing/dashboard dan cetak dokumen.
    2. **Konten Ketentuan Layanan (Terms of Service)**: Meliputi ruang lingkup telemetri ESP32 & kanopi otomatis, batasan tanggung jawab (disclaimer cuaca ekstrem), keamanan akun & ID ESP32, serta pedoman penggunaan wajar (fair use).
    3. **Konten Kebijakan Privasi (Privacy Policy)**: Menjelaskan jenis data yang dikumpulkan (kredensial, analog sensor, RSSI, push token), tujuan pengolahan data, arsitektur multi-tenancy yang aman, dan hak pengguna (ekspor CSV & penghapusan riwayat/akun).
    4. **Estetika Dual-Mode**: Tipografi rapi bernuansa artikel/prose dengan hierarki jelas, badge versi dokumen v1.2, serta adaptasi tema gelap/terang konsisten.
  * Dokumen Rujukan: [PRD.md](PRD.md), [FRONTEND_REQUESTS.md](FRONTEND_REQUESTS.md)
  * Status: [x] SELESAI

---

* [x] **REQ-FE-11: Implementasi Skeleton Loading (Shimmer Animation) untuk Status Loading Data (Cuaca, Telemetri, Grafik, & Riwayat)**
  * Tanggal Diminta: 2026-10-13
  * Tanggal Selesai: 2026-10-14
  * Diminta Oleh: Backend Engineer (sesuai arahan Project Owner)
  * Diselesaikan Oleh: Frontend Developer
  * Komponen & Berkas Terkait:
    * `frontend/src/components/Common/Skeleton.tsx` (utilitas Skeleton, SkeletonQuickWeatherCard, SkeletonWeatherView, SkeletonTable, SkeletonChart, SkeletonDeviceCard)
    * `frontend/src/index.css` (animasi `@keyframes shimmer` dan utilitas `.animate-shimmer`)
    * `frontend/src/components/Dashboard/QuickWeatherCard.tsx`
    * `frontend/src/components/Cuaca/WeatherView.tsx`
    * `frontend/src/components/Grafik/RealtimeChart.tsx`
    * `frontend/src/components/Riwayat/AIAccuracyView.tsx`
  * Spesifikasi Desain & Tampilan yang Terpenuhi:
    1. **Komponen Reusable Skeleton**: Menyediakan efek kilau animasi shimmer halus (`animate-shimmer`) berbasis gradien linier CSS, mendukung tema Dark (`bg-slate-800/80` ke `bg-slate-700/50`) dan Light (`bg-slate-200/80` ke `bg-white/60`) dengan sudut membulat elegan (`rounded-xl` / `rounded-lg`).
    2. **Pencegahan Cumulative Layout Shift (Zero CLS)**: Struktur dan rasio tinggi/lebar skeleton identik dengan komponen aslinya (kartu cuaca, grafik kurva, baris tabel, dan analitik metrik), menjaga stabilitas visual tanpa lonjakan layout.
    3. **Transisi Konten Halus**: Penggantian skeleton ke konten nyata berjalan mulus dengan animasi fade-in opasitas.
  * Dokumen Rujukan: [PRD.md](PRD.md), [FRONTEND_REQUESTS.md](FRONTEND_REQUESTS.md)
  * Status: [x] SELESAI

---

* [x] **REQ-FE-12: Halaman Pengaturan (Settings), Keamanan Akun & Password Strength Meter, Integrasi Telegram, dan Looping Alarm Hujan**
  * Tanggal Diminta: 2026-10-14
  * Tanggal Selesai: 2026-10-14
  * Diminta Oleh: Backend Engineer (sesuai arahan Project Owner)
  * Diselesaikan Oleh: Frontend Developer
  * Komponen & Berkas Terkait:
    * `frontend/src/components/Settings/SettingsView.tsx` (antarmuka Pengaturan Terpadu: Profil, Kata Sandi, Telegram, Preferensi)
    * `frontend/src/components/Settings/PasswordStrengthMeter.tsx` (bar indikator kekuatan sandi & checklist aturan)
    * `frontend/src/components/Alert/PersistentRainAlarmModal.tsx` (modal HUD darurat hujan persisten dengan tombol matikan alarm raksasa)
    * `frontend/src/utils/audioAlarm.ts` (layanan Web Audio synthesizer looping 4 nada dering & sinkronisasi multi-tab)
    * `frontend/public/sw.js` (aksi push notification `dismiss` & `open` serta broadcast ke client)
    * `frontend/src/components/Perangkat/DeviceView.tsx` (pemindahan konfigurasi Telegram & alarm ke menu Pengaturan)
    * `frontend/src/components/Layout/Header.tsx` & `frontend/src/components/Layout/Sidebar.tsx` (tombol pintas pengaturan akun)
    * `frontend/src/App.tsx` (rute `/settings`, pemicu audio looping persisten saat sensor basah, & modal alarm HUD)
  * Spesifikasi Desain & Tampilan yang Terpenuhi:
    1. **Halaman Pengaturan Terpadu (Unified Settings)**:
       * **Tab Profil & Akun**: Form ubah nama lengkap & username dengan validasi realtime. Terintegrasi `PUT /api/user/profile` dan pembaruan otomatis token sesi di `localStorage`.
       * **Tab Keamanan Kata Sandi**: Form sandi saat ini, baru, dan konfirmasi. Dilengkapi `PasswordStrengthMeter.tsx` dengan bar warna (Merah, Kuning, Hijau) dan checklist aturan ketat (min 8 karakter, kombinasi huruf & angka). Mengonsumsi `PUT /api/user/password`.
       * **Tab Integrasi Telegram**: Tautan 1-klik otomatis ke bot `https://t.me/<bot_username>?start=pair_user_<userId>`, input manual Chat ID, dan tombol uji coba kirim pesan via `POST /api/user/test-telegram`. Kolom Telegram di kartu perangkat dihapus dan dialihkan ke pengaturan akun.
       * **Tab Preferensi Alarm & Tampilan**: Pilihan 4 nada dering (`Emergency Siren`, `Digital Phone Ring`, `Tactical Radar Alert`, `High Pitch Chime`), preview audio instan, slider volume, toggle switch dering terus-menerus, dan pemilih tema sinkron ke cloud.
    2. **Alarm Darurat Hujan Persisten & Looping Audio**:
       * Saat sensor mendeteksi hujan (`rain_start` atau `wet: true`), audio nada dering berputar berulang-ulang (*looping = true*) tanpa henti.
       * Tampilan modal HUD darurat berdenyut dengan tombol mencolok *"MATIKAN ALARM"* yang mematikan audio seketika di seluruh tab yang sedang terbuka via `BroadcastChannel` dan Web Worker message listener.
       * Service worker `sw.js` diperkaya aksi `action: 'dismiss'` (Matikan Alarm) dan `action: 'open'` (Buka Aplikasi).
  * Dokumen Rujukan: [PRD.md](PRD.md), [BACKEND_REQUESTS.md](BACKEND_REQUESTS.md), [FRONTEND_REQUESTS.md](FRONTEND_REQUESTS.md)
  * Status: [x] SELESAI

---

## Riwayat Permintaan Selesai (Archive)

* [x] **REQ-FE-06: Perbaikan Logika Status Potensi Hujan BMKG (Sinkronisasi Badge Hujan vs Ilustrasi & Deskripsi Cuaca)**
  * Tanggal Diminta: 2026-10-13
  * Tanggal Selesai: 2026-10-13
  * Diselesaikan Oleh: Frontend Developer
  * Komponen & Berkas Terkait:
    * `frontend/src/types/bmkg.ts` (fungsi pembantu `berpotensiHujan` & `getCurrentBmkgSlot`)
    * `frontend/src/components/Cuaca/WeatherView.tsx` (komponen `BmkgWeatherIcon` dengan fallback dinamis Lucide)
    * `frontend/src/components/Dashboard/QuickWeatherCard.tsx` (pilihan slot waktu nyata terdekat & ikon dinamis)
    * `frontend/src/App.tsx` (evaluasi `bmkgSlotNow` berbasis `getCurrentBmkgSlot`)
  * Spesifikasi yang Terpenuhi:
    1. Fungsi `berpotensiHujan` dikoreksi dengan menjadikan `weather_desc` sebagai sumber kebenaran utama (*ground truth*). Residu numerik `tp` kecil (0.01 - 0.4 mm) pada kondisi "Cerah" atau "Berawan" tidak lagi memicu potensi hujan palsu.
    2. Komponen `BmkgWeatherIcon` dibuat dengan fallback cerdas ke ikon Lucide dinamis (`Sun`, `CloudSun`, `Cloud`, `CloudRain`, `CloudLightning`, `CloudDrizzle`) ketika CDN BMKG gagal atau memicu event `onError`.
    3. Penentuan slot cuaca terdekat (`getCurrentBmkgSlot`) mencocokkan waktu lokal perangkat saat ini, sehingga tidak lagi terjebak pada slot 00:00 tengah malam.
  * Status: [x] SELESAI


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

