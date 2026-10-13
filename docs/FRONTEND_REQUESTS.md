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

* [ ] **REQ-FE-07: Peningkatan Responsivitas Mobile (Mobile-First Layout) pada Header Dashboard, Navigasi Tab, dan Komponen Fitur**
  * Tanggal Diminta: 2026-10-13
  * Diminta Oleh: Backend Engineer (sesuai arahan Project Owner)
  * Komponen & Berkas Terkait:
    * `frontend/src/components/Dashboard/Header.tsx`
    * `frontend/src/components/Dashboard/DashboardView.tsx`
    * `frontend/src/components/Navigation/Sidebar.tsx` / `BottomNav.tsx`
    * `frontend/src/App.tsx`
  * Masalah Saat Ini:
    * Pada tampilan mobile (layar smartphone, viewport lebar < 640px / 768px), header dashboard dan elemen fitur bertumpukan (overlap), teks terpotong, badge koneksi MQTT meluap keluar layar, dan grid kartu dashboard memaksakan kolom horizontal yang membuat tata letak berantakan.
  * Spesifikasi Desain & Tampilan yang Diinginkan:
    1. **Responsive Header Layout**:
       * Gunakan breakpoint Tailwind (`sm:`, `md:`, `lg:`).
       * Di layar mobile (< 640px), susun header menjadi 2 baris atau gunakan *compact action bar*: Baris 1 untuk Logo, Nama Perangkat (dengan truncate jika panjang), dan Tombol Menu/Tema; Baris 2 untuk Status Koneksi Broker (chip mini: ikon titik berdenyut hijau/merah + "Online/Offline") dan tombol aksi cepat.
       * Nama perangkat yang panjang diberi class `truncate max-w-[140px] sm:max-w-none`.
    2. **Mobile-First Dashboard Cards**:
       * Kartu telemetri utama (Status Hujan, Akumulasi Basah, Intensitas Analog, Estimasi BMKG) wajib beralih ke layout `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
       * Padding kontainer utama disesuaikan: `px-3 py-3` di mobile, `px-6 py-6` di tablet/desktop.
    3. **Navigasi Tab Mobile yang Halus**:
       * Pastikan navigasi tab di mobile memiliki horizontal scrolling yang mulus (`overflow-x-auto scrollbar-none flex-nowrap`) atau menggunakan Bottom Navigation Dock yang proporsional tanpa menutupi tombol aksi di bawah layar.
  * Dokumen Rujukan: [PRD.md](PRD.md) Bagian 3 (User Interface), [FRONTEND_REQUESTS.md](FRONTEND_REQUESTS.md)
  * Status: Siap Dikerjakan oleh Frontend Developer

---

* [ ] **REQ-FE-08: Redesain Splash Screen agar Lebih Clean, Elegan, dan Minimalis Modern**
  * Tanggal Diminta: 2026-10-13
  * Diminta Oleh: Backend Engineer (sesuai arahan Project Owner)
  * Komponen & Berkas Terkait:
    * `frontend/src/components/Common/SplashScreen.tsx`
  * Spesifikasi Desain & Tampilan yang Diinginkan:
    1. **Visual Simpel & Elegan**:
       * Hindari elemen dekoratif yang terlalu ramai atau berlebihan.
       * Tampilkan logo resmi Rintik (`/favicon.svg?v=2`) dengan animasi *subtle breathing* (skala 0.98 -> 1.02) atau pendaran lembut (*soft ambient glow*).
       * Tipografi nama aplikasi **RINTIK** menggunakan font *Outfit 900* dengan letter-spacing elegan (`tracking-[0.2em]`) dan sub-label minimalis *"IoT Jemuran Otomatis & Presisi Cuaca"*.
    2. **Minimalist Loading Bar**:
       * Indikator progres berupa garis tipis (*thin progress line* 2px) dengan gradien cyan ke indigo (`from-cyan-400 to-indigo-500`) yang berjalan mulus 0% -> 100%.
    3. **Transisi Halus (Smooth Exit Transition)**:
       * Saat pemuatan selesai, berikan efek transisi *fade-out* + *scale-up* lembut (`opacity-0 scale-105 duration-700 ease-out`) sebelum komponen dilepas dari DOM.
    4. **Dukungan Tema**:
       * Mendukung tema Dark (`#070b14` / `#0b1329`) dan Light (`#f8fafc` / `#f0f9ff`) secara otomatis.
  * Dokumen Rujukan: [PRD.md](PRD.md)
  * Status: Siap Dikerjakan oleh Frontend Developer

---

* [ ] **REQ-FE-09: Integrasi Notifikasi Realtime PWA & Browser Push Notification (Web Push API + VAPID)**
  * Tanggal Diminta: 2026-10-13
  * Diminta Oleh: Backend Engineer
  * Endpoint Backend yang Sudah Tersedia:
    * `GET /api/notifications/vapid-public-key` : Mengambil VAPID Public Key backend untuk pendaftaran di browser client.
    * `POST /api/notifications/subscribe` : Mendaftarkan push subscription browser pengguna ke database PostgreSQL.
  * Format Request Payload `POST /api/notifications/subscribe`:
    ```json
    {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {
        "p256dh": "BLm5V...",
        "auth": "wK8s..."
      },
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
    }
    ```
  * Arsitektur & Cara Kerja:
    * **Apakah butuh permission?** YA, browser memerlukan izin eksplisit dari pengguna (`Notification.requestPermission()`). Tanpa izin ini, browser secara ketat memblokir notifikasi sistem demi privasi dan keamanan pengguna.
    * Notifikasi sistem ini bekerja seperti notifikasi aplikasi native (APK Android / Windows Action Center), bahkan saat tab browser ditutup atau terminimalkan jika Service Worker terdaftar.
  * Spesifikasi Implementasi di Frontend:
    1. **Tombol Aktivasi Notifikasi (User Gesture Trigger)**:
       * Sediakan tombol saklar / lonceng di Header atau Pengaturan: *"Aktifkan Notifikasi Hujan"* / *"Izinkan Notifikasi"*.
       * Jangan memicu popup izin browser secara agresif saat pertama kali halaman dimuat (agar tidak ditolak atau dianggap spam oleh browser).
    2. **Permintaan Izin & Registrasi Service Worker**:
       * Saat tombol diklik:
         ```javascript
         const permission = await Notification.requestPermission();
         if (permission === 'granted') {
           const reg = await navigator.serviceWorker.register('/sw.js');
           const keyRes = await fetch(`${backendUrl}/api/notifications/vapid-public-key`);
           const { public_key } = await keyRes.json();
           const sub = await reg.pushManager.subscribe({
             userVisibleOnly: true,
             applicationServerKey: urlBase64ToUint8Array(public_key)
           });
           await fetch(`${backendUrl}/api/notifications/subscribe`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
             body: JSON.stringify(sub)
           });
         }
         ```
    3. **File Service Worker (`frontend/public/sw.js`)**:
       * Tangani event `push` dan `notificationclick` di Service Worker untuk menampilkan notifikasi native dengan judul, isi pesan, badge, dan ikon Rintik:
         ```javascript
         self.addEventListener('push', function(e) {
           const data = e.data ? e.data.json() : {};
           const title = data.title || 'Peringatan Hujan Rintik!';
           const options = {
             body: data.body || 'Sensor mendeteksi hujan! Kanopi jemuran diamankan.',
             icon: '/favicon.svg?v=2',
             badge: '/favicon.svg?v=2',
             vibrate: [200, 100, 200]
           };
           e.waitUntil(self.registration.showNotification(title, options));
         });
         ```
    4. **In-App Toast Fallback**:
       * Saat pengguna sedang aktif membuka website di tab depan, tetap tampilkan in-app toast notification melalui WebSocket/MQTT event `rain_start` / `rain_stop` seperti yang sudah berjalan di `ToastContainer`.
  * Dokumen Rujukan: [BACKEND_REQUESTS.md](BACKEND_REQUESTS.md), [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
  * Status: Siap Dikerjakan oleh Frontend Developer

---

* [ ] **REQ-FE-10: Pembuatan Halaman / Modal Ketentuan Layanan (Terms of Service) dan Kebijakan Privasi (Privacy Policy)**
  * Tanggal Diminta: 2026-10-13
  * Diminta Oleh: Backend Engineer (sesuai arahan Project Owner)
  * Komponen & Berkas Terkait:
    * `frontend/src/components/Common/LegalModal.tsx` atau `frontend/src/components/Legal/LegalView.tsx`
    * `frontend/src/components/Landing/LandingPage.tsx` (Footer / Legal Links)
    * `frontend/src/components/Auth/AuthPage.tsx` (Register terms checkbox / note)
    * `frontend/src/App.tsx` (Routing `/terms`, `/privacy`, dan validasi rute 404)
  * Spesifikasi Desain & Tampilan yang Diinginkan:
    1. **Format Akses & Navigasi**:
       * Sediakan tautan pada footer `LandingPage.tsx` dan catatan pendaftaran di `AuthPage.tsx` ("Dengan mendaftar, Anda menyetujui Ketentuan Layanan & Kebijakan Privasi Rintik").
       * Dapat dibuka sebagai rute halaman mandiri (`/terms` dan `/privacy`) atau modal dialog elegan (*read-friendly modal*) dengan tab switcher antara *"Ketentuan Layanan"* dan *"Kebijakan Privasi"*.
       * Pastikan rute `/terms` dan `/privacy` didaftarkan ke array `isValidAppRoute` di `App.tsx` agar tidak memicu halaman 404.
    2. **Struktur Konten Ketentuan Layanan (Terms of Service)**:
       * **Ruang Lingkup**: Layanan monitoring telemetri cuaca sensor fisik ESP32, otomatisasi motor penutup jemuran, dan integrasi prakiraan BMKG.
       * **Batas Tanggung Jawab (Disclaimer)**: Sensor fisik dan data BMKG disajikan sebagai alat bantu presisi; pengguna bertanggung jawab atas keamanan jemuran/aset saat terjadi bencana cuaca ekstrem di luar batas operasional hardware.
       * **Akun & Perangkat**: Pengguna bertanggung jawab menjaga kerahasiaan kata sandi dan ID perangkat ESP32 masing-masing.
       * **Penggunaan Wajar (Fair Use)**: Larangan melakukan spamming request HTTP/WebSocket/MQTT atau manipulasi telemetri ilegal.
    3. **Struktur Konten Kebijakan Privasi (Privacy Policy)**:
       * **Data yang Dikumpulkan**: Kredensial akun (nama, email), data telemetri sensor (nilai analog kelembapan, status basah, RSSI WiFi), kode wilayah BMKG (Adm4), dan push subscription token.
       * **Tujuan Pengolahan Data**: Pengoperasian kendali motor jemuran otomatis, peringatan dini cuaca, serta analitik riwayat cuaca personal.
       * **Keamanan & Multi-Tenancy**: Data telemetri dan perangkat terisolasi per akun pengguna (*multi-tenant*), password di-hash dengan standar industri, dan tidak dibagikan/dijual ke pihak ketiga.
       * **Hak Pengguna**: Hak mengekspor data telemetri (fitur CSV Export), hak menghapus riwayat telemetri/event, dan hak menghapus perangkat/akun sewaktu-waktu.
    4. **Estetika Tampilan**:
       * Tipografi bersih, mudah dibaca (*prose typography*, line-height proporsional, heading hierarkis, badge versi dokumen).
       * Mendukung tema Dark dan Light mode secara konsisten dengan tombol kembali / tutup yang intuitif.
  * Dokumen Rujukan: [PRD.md](PRD.md), [FRONTEND_REQUESTS.md](FRONTEND_REQUESTS.md)
  * Status: Siap Dikerjakan oleh Frontend Developer

---

* [ ] **REQ-FE-11: Implementasi Skeleton Loading (Shimmer Animation) untuk Status Loading Data (Cuaca, Telemetri, Grafik, & Riwayat)**
  * Tanggal Diminta: 2026-10-13
  * Diminta Oleh: Backend Engineer (sesuai arahan Project Owner)
  * Komponen & Berkas Terkait:
    * `frontend/src/components/Common/Skeleton.tsx` (komponen reusable Skeleton / Shimmer)
    * `frontend/src/components/Cuaca/WeatherView.tsx` & `frontend/src/components/Dashboard/QuickWeatherCard.tsx` (saat fetching data BMKG)
    * `frontend/src/components/Grafik/ChartsView.tsx` & `frontend/src/components/Grafik/TelemetryTable.tsx` (saat query telemetri riwayat)
    * `frontend/src/components/Riwayat/EventsView.tsx` (saat memuat log event sensor & jemuran)
    * `frontend/src/components/Perangkat/DeviceManager.tsx` (saat memuat daftar perangkat ESP32)
  * Spesifikasi Desain & Tampilan yang Diinginkan:
    1. **Komponen Reusable Skeleton (`Skeleton.tsx`)**:
       * Sediakan utilitas komponen `<Skeleton className="..." />` yang luwes dengan efek gelombang kilau (*shimmer animation wave* / `animate-pulse` halus).
       * Dukungan penuh dual-mode:
         * **Dark Mode**: basis `bg-slate-800/70` dengan highlight shimmer translusen `bg-slate-700/50`.
         * **Light Mode**: basis `bg-slate-200/80` dengan highlight shimmer translusen `bg-slate-100`.
       * Hindari balok abu-abu mati kaku (*flat grey block*) yang terkesan murahan; gunakan sudut membulat (`rounded-xl` / `rounded-lg`) serasi dengan desain kartu aplikasi.
    2. **Pencegahan Cumulative Layout Shift (Zero CLS)**:
       * Dimensi dan hierarki skeleton wajib menyerupai struktur visual komponen target saat terisi data.
       * Contoh:
         * **Kartu Cuaca BMKG**: placeholder lingkaran untuk ikon cuaca, placeholder teks tebal untuk angka temperatur (°C), dan baris-baris info kelembapan & angin.
         * **Tabel Telemetri & Log Riwayat**: baris header tabel dummy disertai 5 baris data placeholder bergaris tipis.
         * **Grafik Telemetri**: placeholder kontur kurva / balok area chart dengan tinggi proporsional (`h-64` atau `h-80`).
         * **Kartu Perangkat**: placeholder status pill badge, judul perangkat, dan tombol aksi.
    3. **Transisi Konten Halus (Smooth Transition)**:
       * Terapkan transisi memudar halus (`transition-opacity duration-300`) ketika data selesai dimuat dari API backend atau BMKG agar perpindahan dari skeleton ke data riil tidak tersentak atau flicker.
  * Dokumen Rujukan: [PRD.md](PRD.md), [FRONTEND_REQUESTS.md](FRONTEND_REQUESTS.md)
  * Status: Siap Dikerjakan oleh Frontend Developer

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

