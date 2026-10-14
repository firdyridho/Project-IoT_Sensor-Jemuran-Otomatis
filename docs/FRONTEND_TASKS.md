# Daftar Task & Roadmap: Frontend (React, UI/UX & Tampilan AI)

Dokumen ini adalah panduan kerja khusus **Frontend & UI/UX Implementation**. Seluruh tata letak halaman, komponen interaktif, visualisasi grafik, dan antarmuka fitur kecerdasan buatan (AI) dipantau melalui dokumen ini.

---

## 1. Lingkup Tanggung Jawab Frontend

* **Teknologi**: React 19, TypeScript 5.7, Vite 6, Tailwind CSS v4, Lucide Icons.
* **Platform**: Single Page Application (SPA), Progressive Web App (PWA).
* **Fokus Kerja**:
  1. Desain visual modern (glassmorphism, tema gelap/terang, tipografi Google Fonts).
  2. Responsivitas penuh lintas ukuran layar (ponsel 320px+ hingga layar desktop lebar).
  3. Integrasi data realtime WebSocket dari backend tanpa polling berlebihan.
  4. Penyajian data analitik dan rekomendasi AI yang mudah dipahami pengguna awam.

---

## 2. Status & Backlog Task Frontend

### Fase 1: Landing Page, Halaman Auth & Navigasi Dasar [SELESAI]
* [x] **FE-01: Landing Page Super Responsif**:
  * Hero section dengan tipografi dinamis dan call-to-action jelas.
  * Kartu simulasi sensor interaktif (toggle status kering vs basah).
  * Penjelasan fitur dan arsitektur tanpa masalah layout meluap pada layar HP.
* [x] **FE-02: Halaman Khusus Login & Registrasi**:
  * Halaman mandiri (bukan popup) yang responsif di mobile dan desktop.
  * Input username, toggle lihat kata sandi, checkbox "Ingat Saya".
  * Tombol 1-klik "Coba Mode Demo" untuk evaluasi cepat.
* [x] **FE-03: Isolasi Cache Browser**:
  * Penyimpanan perangkat tersimpan per akun pengguna: `hujan.devices.${userId}`.
* [x] **FE-04: Transisi Branding WebSocket**:
  * Pembaruan status koneksi dari MQTT ke `Server Cloud Realtime (WebSocket)`.
* [x] **FE-04b: Simplifikasi Manajemen Perangkat**:
  * Menghapus input manual URL broker Mosquitto dan kode ADM4 pada formulir tambah/edit perangkat fisik.
  * Menambahkan slider sensitivitas ambang hujan (persentase) langsung saat mendaftarkan perangkat.
* [x] **FE-04c: Fitur 1-Klik Deteksi Lokasi GPS Cuaca BMKG**:
  * Menggunakan `navigator.geolocation` browser untuk menghitung jarak terdekat ke preset wilayah BMKG.
  * Menampilkan banner konfirmasi wilayah terdeteksi.
* [x] **FE-04d: Desain Visual Dashboard Cuaca Realistis Mobile-First**:
  * Background cuaca fotorealistik: Cerah, Gerimis, Hujan, Badai.
  * Ilustrasi Cuaca 3D Skeuomorfik: Bola matahari 3D glossy, awan 3D puffy bervolume, dan tetesan air 3D cyan/sky-blue mengilap.
  * Header Jam Digital Realtime & 4-Day Forecast pill cards row.
  * Penyesuaian kontras dinamis: Frosted glass hangat pada cuaca cerah dan frosted glass gelap pada cuaca hujan/badai.
* [x] **FE-04e: Navigasi Vertikal Collapse Pane Desktop, Logo Favicon Mobile & Tema Cerah Bersih**:
  * Mengganti hamburger menu mobile dengan logo favicon aplikasi (navigasi halaman mobile difokuskan lewat bottom bar footer).
  * Desktop sidebar Vertical Tabs mode Chrome Collapse Pane (Compact mode: ikon saja, Expanded mode: nama halaman + status).
  * Penyelarasan warna background dan border sidebar desktop agar 100% identik dengan warna footer mobile di seluruh kondisi cuaca.
  * Desain tema cerah tipe clean & minimalis: menghilangkan warna silau/berlebih dan patch gelap yang kontras tajam, memastikan semua teks, kartu, dan ikon terbaca dengan jelas dan nyaman di mata.
* [x] **FE-04f: Ikon Vektor Panel Manual, Penyesuaian Transparansi Awan Sidebar & Harmonisasi Ikon Motor DC**:
  * Mengganti seluruh emoticon pada judul Panel Kendali Tombol Manual (kontrol dan daya) dengan ikon vektor Lucide (SlidersHorizontal dan Zap).
  * Menerapkan transparansi halus (opacity ~85% + backdrop-blur) pada sidebar desktop dan kartu perangkat agar efek awan latar belakang terlihat samar tanpa mengurangi keterbacaan ikon dan menu.
  * Menyelaraskan warna ikon dan badge "Motor DC: Siaga di Luar (Idle)" pada kondisi cerah agar identik dengan tema kondisi mendung (`bg-blue-500/20 text-blue-400` dan badge amber).
* [x] **FE-04g: Optimasi Responsif Mobile Slider Rel Jemuran, Header Sensor ADC & Status Offline Merah**:
  * Memindahkan info panjang rel ke bawah toggle bar agar bersih dan luas.
  * Menyederhanakan label menjadi "Area Teduh" dan "Area Terbuka", memperbesar ikon di mobile dengan label teks ringkas terpusat di bawahnya.
  * Memperbaiki translasi toggle bar slider: di mobile tidak terpotong (pas di dalam rel) dan di desktop bergeser sempurna hingga ujung kanan tanpa kelebihan atau kekurangan.
  * Mengatur tata letak Motor DC dan Sensor Kebasahan Fisik (ADC) pada mobile menjadi full-width, meletakkan badge status setelah deskripsi teks tanpa membagi dua kolom yang sempit.
  * Menyelaraskan transparansi glassmorphism header & footer (mobile & desktop) agar identik dengan sidebar desktop.
  * Memberi warna merah pada teks dan ikon "Perangkat Tidak Aktif" saat status perangkat IoT offline.
* [x] **FE-04h: Pop-up SweetAlert2 di Desktop, Top Push Banner di Mobile, Lenis Smooth Scroll & Custom Scrollbar Cuaca/Tema**:
  * Mendesain ulang feedback notifikasi/pop-up: di desktop muncul di tengah layar bergaya SweetAlert2 dengan ring animasi ikonik, tombol konfirmasi OK, dan backdrop modal; di mobile muncul di bagian atas seperti push notification banner.
  * Memastikan kartu pop-up 100% solid (tidak transparan) dengan skema warna yang dinamis mengikuti kondisi cuaca di dashboard atau tema yang dipilih user di halaman lain.
  * Mengintegrasikan library Lenis untuk animasi scrolling halaman web yang halus dan buttery-smooth.
  * Menerapkan custom scrollbar CSS yang warnanya otomatis beradaptasi dengan kondisi cuaca pada dashboard (Cerah, Mendung, Hujan, Badai) serta tema light/dark pada halaman lainnya.
* [x] **FE-04i: Layout Mobile Panel Manual Bersih, Animasi Count-Up Persentase saat Scroll, Modal Close Kiri Atas & Elevasi Gradient UI**:
  * Pada mobile view kartu Motor Jemuran, judul Panel Kendali Tombol Manual dibuat full-width dan badge KONTROL MANUAL diturunkan ke bawahnya agar bersih dan tidak terbagi 2 kolom sempit.
  * Menambahkan hook animasi angka gerak (count-up dari 0 ke target) dengan IntersectionObserver saat di-scroll pada widget persentase Prediksi Hujan Cerdas AI, Skor Rekomendasi Jemuran AI (0-100), dan Sensor Kebasahan Fisik ADC (%).
  * Memodifikasi pop-up modal SweetAlert2 di desktop agar tombol "Mengerti / OK" dihilangkan dan tombol close silang (X) diletakkan di sudut kiri atas.
  * Mempercantik antarmuka dan layout halaman Grafik Realtime, Perkiraan BMKG, Riwayat & Log Event, dan Kelola Perangkat dengan aksen gradient modern, glowing status pills, efek hover interaktif, dan visual estetis yang user friendly serta tidak monoton.
* [x] **FE-04j: Pembersihan Chip Demo Dashboard, Retensi Login Akun Demo, Tombol Audio di Header, Status Offline Merah & Garis Waktu Pop-up Presisi**:
  * Menghapus card/chip bar simulasi cuaca demo pada tab Dashboard sehingga dashboard 100% didorong oleh sensor fisik IoT dan data cuaca BMKG lokal.
  * Mempertahankan tombol 1-klik "Coba Mode Demo" pada Landing Page dan Auth Page agar evaluator tetap dapat menguji dashboard secara instan tanpa perlu mendaftar akun baru.
  * Memastikan tema dashboard otomatis bertransisi mulus ke tema Mendung, Hujan, dan Badai (latar fotorealistik, tetesan air kaca, kilatan petir, awan bergerak) saat sensor basah atau BMKG mendeteksi hujan/badai.
  * Memindahkan kontrol audio efek cuaca ke Header bar sesuai kondisi cuaca (Cerah, Mendung, Hujan, Badai).
  * Menandai status perangkat IoT yang offline dengan warna merah kontras (teks, ikon, dot berdenyut) pada desktop sidebar dan header.
  * Memperbaiki garis waktu countdown 3 detik pada pop-up alert SweetAlert2 desktop dan push banner mobile agar 100% presisi dan fit dengan radius rounded border kartu tanpa bocor.
  * Memastikan integritas backend tetap utuh 100% dan memvalidasi kelulusan build TypeScript & Vite.
* [x] **FE-04k: Filter Multi-Tenancy Perangkat Realtime & Penyesuaian Watchdog Offline 6 Detik**:
  * Mengisolasi penerimaan telemetri, state, dan event WebSocket di `App.tsx` agar hanya memproses payload milik perangkat yang sedang aktif (`activeDevice.deviceId`), mencegah data dari perangkat lain mencemari grafik atau status online perangkat non-aktif.
  * Mereset timestamp `lastSeenTs`, `latestState`, `readings`, dan `events` secara bersih saat beralih perangkat (`handleSelectDevice`).
  * Menyesuaikan toleransi watchdog offline menjadi 6 detik (`Date.now() - lastSeenTs > 6000`) dan memvalidasi status awal dari API backend (`dev.status === 'offline'`).

---

### Fase 2: Implementasi Antarmuka Fitur AI [PRIORITAS TINGGI]

* [x] **FE-05: Komponen Widget Prediksi Hujan AI (`AIPredictionCard.tsx`)**:
  * **Lokasi**: Ditampilkan pada tab Dashboard di bawah status jemuran utama.
  * **Sumber Data**: Endpoint backend `POST /api/ai/predict-rain`.
  * **Desain UI**:
    * Gauge / Progress Bar Lingkaran: Probabilitas Hujan (contoh: `85% Potensi Hujan`).
    * Countdown / Estimasi Waktu: "Diprediksi mulai gerimis dalam ~20 menit".
    * Badge Keyakinan: Hijau (Tinggi), Kuning (Sedang), Abu-abu (Rendah).
    * Ringkasan Faktor: Nilai kelembapan yang melonjak dan penurunan suhu.
  * **Interaksi**: Tombol "Refresh Analisis AI" dengan status loading animasi shimmer.

* [x] **FE-06: Kartu Asisten Rekomendasi Jemuran AI (`DryingAdviceCard.tsx`)**:
  * **Lokasi**: Ditampilkan pada tab Dashboard atau tab Cuaca.
  * **Sumber Data**: Endpoint backend `GET /api/ai/drying-advice`.
  * **Desain UI**:
    * Status Utama: Badge besar "AMAN JEMUR" (hijau) atau "ANGKAT SEGERA" (merah/oranye).
    * Indikator Waktu Kering: "Estimasi pakaian kering dalam ~2.5 jam".
    * Rentang Jam Optimal: "Jemur optimal: 08:00 - 13:30 WIB".
    * Teks Saran Cerdas: Format alert yang ringkas dan ramah pengguna.

* [x] **FE-07: Tab Riwayat Log Akurasi AI (`AIAccuracyView.tsx`)**:
  * **Lokasi**: Sub-tab di dalam menu Riwayat Event.
  * **Tujuan**: Menampilkan tabel akurasi prediksi model:
    * Kolom: Waktu Prediksi | Probabilitas Diberikan | Status Sensor Fisik | Akurasi (Tepat / Meleset).
    * Memberikan transparansi kepada pengguna mengenai keandalan sistem cerdas.

---

### Fase 3: Analitik Data, Pengaturan & Integrasi [SELESAI]

* [x] **FE-08: Fitur Ekspor Data Riwayat (CSV & Excel)**:
  * Tombol "Ekspor Data" pada tab Grafik dan tab Riwayat.
  * Menghasilkan file `.csv` langsung di browser yang berisi timestamp, nilai ADC, kelembapan, suhu, dan tegangan baterai.
* [x] **FE-09: Filter Rentang Tanggal Lanjutan (Datepicker)**:
  * Memungkinkan pengguna memilih rentang tanggal spesifik (misal: 1 Oktober - 5 Oktober) untuk melihat riwayat telemetri lama dari database VPS.
* [x] **FE-10: Pengaturan Nada Dering Alarm Hujan**:
  * Opsi memilih suara alert ketika sensor mendeteksi hujan (pilihan: Nada Sirine Ringan, Bell Ding, atau Suara Hujan).
  * Pengaturan volume audio dan tombol preview suara di menu Kelola Perangkat.
* [x] **FE-11: Form Integrasi Bot Telegram**:
  * Input Chat ID Telegram pada tab Kelola Perangkat agar pengguna menerima pesan bot instan saat jemuran tertutup otomatis.

---

### Fase 4: Routing, Deep Linking & Halaman 404 [SELESAI]

* [x] **FE-12: Implementasi Client-Side Routing & Halaman 404 (REQ-FE-05)**:
  * Integrasi pustaka `react-router-dom` dengan `<BrowserRouter>` pada level root aplikasi.
  * Deep linking langsung ke `/dashboard`, `/cuaca`, `/grafik`, `/riwayat`, `/perangkat`, `/auth`, `/login`, dan `/register`.
  * Sinkronisasi navigasi URL dengan `Sidebar.tsx`, `Header.tsx`, dan `BottomNav.tsx` serta dukungan tombol Back/Forward browser.
  * Halaman 404 Not Found (`NotFoundView.tsx`) dengan desain modern, tema adaptif (Dark & Light Mode), pesan informatif, dan tombol cepat kembali ke Dashboard.
* [x] **FE-13: Perbaikan Logika Status Potensi Hujan BMKG & Dynamic Fallback Icon (REQ-FE-06)**:
  * Koreksi fungsi `berpotensiHujan` di `bmkg.ts` dengan memprioritaskan teks kondisi cuaca BMKG (`weather_desc`) sebagai *ground truth* untuk mengeliminasi anomali residu desimal precipitation `tp`.
  * Pembuatan komponen `BmkgWeatherIcon` di `WeatherView.tsx` dan `QuickWeatherCard.tsx` dengan fallback ikon Lucide dinamis (`Sun`, `CloudSun`, `Cloud`, `CloudRain`, `CloudLightning`, `CloudDrizzle`) ketika gambar SVG BMKG tidak termuat.
  * Implementasi helper `getCurrentBmkgSlot` untuk menyelaraskan slot cuaca BMKG secara dinamis sesuai waktu jam lokal pengguna di `WeatherView.tsx`, `QuickWeatherCard.tsx`, dan `App.tsx`.

### Fase 5: Mobile-First Polish, Push Notification, Legal Terms & Skeleton Loading [SELESAI]

* [x] **FE-14: Peningkatan Responsivitas Mobile (Mobile-First Layout) (REQ-FE-07)**:
  * Layout responsif 2 baris pada Header untuk layar kecil (< 640px) dan 1 baris pada layar besar, menghindari benturan ikon dengan judul perangkat yang di-truncate secara elegan.
  * Target sentuh tombol minimal 44x44px (`min-h-11 min-w-11`) untuk kenyamanan jari pada perangkat smartphone.
  * Grid telemetri adaptif `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` pada `TelemetryGrid.tsx`.
  * Padding kontainer utama mobile diperhalus menjadi `px-3 py-3 sm:px-6 sm:py-6` di `App.tsx` agar ruang layar sempit termanfaatkan optimal tanpa overflow horizontal.
* [x] **FE-15: Redesain Splash Screen Minimalis Modern (REQ-FE-08)**:
  * Redesain `SplashScreen.tsx` menggunakan logo resmi `/favicon.svg?v=2` dengan animasi *breathing pulse* lembut.
  * Tipografi `R I N T I K` berkarakter modern dengan font Outfit 900 tracking proporsional.
  * Garis indikator loading ultra-ramping 2px bergradien cyan-indigo (`from-cyan-400 to-indigo-500`) 0% -> 100%.
  * Transisi keluar halus *fade-out* + *scale-up* (`opacity-0 scale-105 duration-700 ease-out`) dengan adaptasi tema gelap (`#070b14`) dan terang (`#f8fafc`).
* [x] **FE-16: Integrasi Web Push Notification VAPID & PWA Service Worker (REQ-FE-09)**:
  * Implementasi modul service `frontend/src/services/webpush.ts` untuk mengelola izin browser, fetching VAPID Public Key dari backend, konversi `Uint8Array`, dan registrasi push subscription ke `/api/notifications/subscribe`.
  * Penambahan listener event `push` dan `notificationclick` pada `frontend/public/sw.js` dengan vibrasi `[200, 100, 200]`, badge, dan ikon Rintik.
  * Penambahan kartu kendali izin notifikasi dan tombol pengujian langsung (Test Push) pada tab Kelola Perangkat (`DeviceView.tsx`), serta integrasi trigger cepat pada lonceng Header.
* [x] **FE-17: Pembuatan Halaman & Modal Ketentuan Layanan serta Kebijakan Privasi (REQ-FE-10)**:
  * Komponen modal interaktif `LegalModal.tsx` dengan tab switcher antara Ketentuan Layanan (*Terms of Service*) dan Kebijakan Privasi (*Privacy Policy*).
  * Halaman mandiri `LegalView.tsx` yang dapat diakses langsung melalui deep link rute `/terms` dan `/privacy`.
  * Pendaftaran rute `/terms` dan `/privacy` ke dalam `isValidAppRoute` di `App.tsx` untuk mencegah pemicuan halaman 404.
  * Integrasi tautan legal pada footer `LandingPage.tsx` dan klausul persetujuan pendaftaran di `AuthPage.tsx`.
* [x] **FE-18: Implementasi Skeleton Loading Shimmer Zero-CLS (REQ-FE-11)**:
  * Utilitas reusable `Skeleton.tsx` dengan varian siap pakai: `SkeletonQuickWeatherCard`, `SkeletonWeatherView`, `SkeletonTable`, `SkeletonChart`, dan `SkeletonDeviceCard`.
  * Definisi keyframe `@keyframes shimmer` dan utilitas `.animate-shimmer` di `frontend/src/index.css`.
  * Penerapan skeleton pada `QuickWeatherCard.tsx`, `WeatherView.tsx`, `RealtimeChart.tsx`, dan `AIAccuracyView.tsx` untuk mengeliminasi lonjakan tata letak (Zero Cumulative Layout Shift).
* [x] **FE-19: Halaman Pengaturan (Settings), Keamanan Akun & Password Strength Meter, Integrasi Telegram, & Looping Alarm Hujan (REQ-FE-12)**:
  * Pembuatan komponen `SettingsView.tsx` dengan 4 tab terpadu: Profil & Akun, Keamanan Kata Sandi, Integrasi Telegram, dan Preferensi Alarm & Tampilan.
  * Pembuatan komponen `PasswordStrengthMeter.tsx` dengan bar warna (Merah/Kuning/Hijau) dan checklist validasi aturan ketat (min 8 karakter, kombinasi huruf & angka).
  * Pembuatan modul synthesizer Web Audio `audioAlarm.ts` dengan 4 nada dering unik (`Emergency Siren`, `Digital Phone Ring`, `Tactical Radar Alert`, `High Pitch Chime`), preview audio, dan mekanisme looping alarm darurat persisten.
  * Pembuatan modal HUD darurat `PersistentRainAlarmModal.tsx` dengan visual berdenyut dan tombol *"MATIKAN ALARM"* raksasa dengan sinkronisasi penutupan multi-tab via `BroadcastChannel` dan storage event.
  * Pembaruan listener service worker `sw.js` dengan aksi notifikasi `dismiss` (Matikan Alarm) dan `open` (Buka Aplikasi).
  * Pembersihan input Telegram dan nada dering dari kartu perangkat (`DeviceView.tsx`) agar perangkat ESP32 khusus untuk telemetri hardware.
* [x] **FE-20: Unggah Audio Alarm Kustom & Caching Audio Offline (REQ-FE-13)**:
  * Penambahan opsi nada dering `custom` (*"Nada Dering Kustom (Unggah Sendiri)"*) pada `audioAlarm.ts` dan antarmuka Pengaturan Preferensi `SettingsView.tsx`.
  * Pembuatan Dropzone interaktif dan tombol unggah berkas audio (`.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.webm`) dengan validasi batas ukuran sisi klien maksimal 5MB dan progress bar animasi.
  * Integrasi endpoint multipart form `POST /api/user/custom-alarm` dan penyimpanan preferensi URL ke `PUT /api/user/profile`.
  * Implementasi caching offline menggunakan Web Cache Storage API (`rintik-custom-tones-v1`) melalui helper `cacheCustomAudio`, menjamin alarm kustom tetap berbunyi saat perangkat offline di tengah cuaca ekstrem.
  * Integrasi pemutaran looping persisten pada `App.tsx` & `audioAlarm.ts` dengan fallback otomatis ke `emergency_siren` bila pemutaran berkas audio kustom mengalami kegagalan.

---

## 3. Mock Data untuk Pengembangan Frontend

Frontend dapat mulai mengoding tampilan UI fitur AI sebelum endpoint backend selesai, menggunakan struktur mock data berikut:

```typescript
// Mock data untuk FE-05 (Prediksi Hujan AI)
export const MOCK_AI_PREDICTION = {
  willRain: true,
  probabilityPct: 85,
  estimatedMinutesUntilRain: 20,
  confidenceLevel: 'high' as const,
  trendFactors: {
    humidityDelta: '+15%',
    tempDelta: '-2.1°C',
    adcTrend: 'falling',
  },
  summary: 'Kelembapan naik tajam dan suhu turun drastis. Potensi hujan tinggi dalam 20 menit ke depan.',
};

// Mock data untuk FE-06 (Rekomendasi Jemuran AI)
export const MOCK_DRYING_ADVICE = {
  recommendation: 'aman_jemur' as const,
  dryingScore: 88,
  estimatedDryHours: 2.5,
  bestDryingWindow: 'Pukul 08:00 - 13:30 WIB',
  bmkgWeatherDesc: 'Cerah Berawan',
  actionMessage: 'Kondisi panas optimal dan angin cukup. Waktu tepat untuk menjemur pakaian tebal.',
};
```
