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

* [ ] **REQ-FE-22: Tombol Berhenti Darurat / Manual (Stop Motor) pada Kartu Kendali Rel Jemuran (`ClotheslineMotorCard.tsx`)**
  * Tanggal Diminta: 2026-10-26
  * Diminta Oleh: Backend Engineer (sesuai arahan Project Owner)
  * Target Komponen & Berkas Terkait:
    * `frontend/src/components/Dashboard/ClotheslineMotorCard.tsx` (kartu kendali rel motor jemuran)
    * `frontend/src/services/api.ts` atau fungsi pemanggil `commandMotor` (mendukung parameter/aksi `'stop'`)
  * Latar Belakang & Kebutuhan Fitur:
    * Backend kini telah menyediakan endpoint resmi `POST /api/devices/:id/motor/command` dengan payload `{ "action": "stop" }` (atau `"berhenti"`).
    * Di sisi perangkat keras (ESP32), motor stepper kini mendukung sistem rem instan dan limit switch ganda (masuk & keluar). Pengguna memerlukan tombol darurat di antarmuka website/PWA untuk menghentikan motor kapan saja secara manual saat rel sedang meluncur (misalnya jika ada jemuran tersangkut atau pengguna ingin menghentikan posisi jemuran di tengah rel).
  * Spesifikasi & Instruksi Kerja Frontend:
    1. **Penambahan Tombol Berhenti Manual ("Berhenti" / "Stop Motor")**:
       * Di panel tombol kontrol `ClotheslineMotorCard.tsx` (di samping atau di antara tombol "Tarik Masuk" dan "Bentangkan Keluar"), tambahkan tombol aksi dengan label: **"Berhenti"** atau **"Stop"** (menggunakan ikon Lucide `Square` atau `CircleStop` / `OctagonX`).
       * Styling tombol:
         - Sesuai prinsip pedoman [`.agents/rules/ui-mobile-first/SKILL.md`](../.agents/rules/ui-mobile-first/SKILL.md), gunakan warna solid tegas tanpa gradien AI-slop:
           `bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold rounded-xl transition-colors` (atau varian merah/amber solid).
       * Aksi Klik:
         - Mengirim request `POST /api/devices/:id/motor/command` dengan payload JSON: `{ "action": "stop" }`.
       * State & Interaktivitas Tombol:
         - Tombol Berhenti sangat berguna terutama ketika `motorStatus === 'moving'`, dan dapat di-klik untuk menghentikan laju motor seketika.
         - Berikan feedback loading atau toast/banner saat tombol diklik.
    2. **Sinkronisasi WebSocket State**:
       * Backend akan menyiarkan event WebSocket tipe `motor` dengan payload `{ "deviceId": devId, "status": "idle", "action": "stop" }` serta event log `motor_stop`.
       * Komponen kartu harus langsung memperbarui indikator motor menjadi idle/diam.
  * Dokumen Rujukan: [API_CONTRACT_AGREEMENT.md](API_CONTRACT_AGREEMENT.md), [PRD.md](PRD.md), [API.md](API.md)
  * Status: Siap Dikerjakan oleh Frontend


---

## Riwayat Permintaan Selesai (Archive)

* [x] **REQ-FE-21: Pembersihan Desain Tampilan Pengaturan (`SettingsView.tsx`): Eliminasi Gradien 'AI Slop', Gunakan Warna Solid Minimalis, Bersihkan Shadow Tebal, dan Sempurnakan Kontras Tema Gelap/Terang**
  * Tanggal Diminta: 2026-10-17
  * Tanggal Selesai: 2026-10-26
  * Diminta Oleh: Backend Engineer (sesuai arahan Project Owner)
  * Diselesaikan Oleh: Frontend Developer
  * Target Komponen & Berkas Terkait:
    * `frontend/src/components/Settings/SettingsView.tsx` (tampilan menu Pengaturan Akun & Preferensi)
    * `frontend/src/components/Settings/PasswordStrengthMeter.tsx` (indikator kekuatan kata sandi)
  * Spesifikasi yang Terpenuhi:
    1. **Eliminasi Gradien & Penggunaan Warna Solid**: Menghapus seluruh kelas gradien `bg-gradient-to-r` pada tombol simpan, tombol aksi, dan bar progress (`from-cyan-500 to-blue-600`, `from-blue-600 to-cyan-600`, `from-cyan-500 to-indigo-500`). Digantikan dengan warna solid minimalis (`bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs`).
    2. **Harmonisasi Dual-Mode (Light & Dark Theme)**: Mengganti background gelap statis (`bg-slate-900/80`) dengan token adaptif (`bg-white border-slate-200 text-slate-900 dark:bg-slate-900/80 dark:border-slate-800 dark:text-white`). Form input menggunakan `bg-slate-50 border-slate-300 text-slate-900 focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100`.
    3. **Navigasi Flat Clean**: Tab sidebar dibersihkan dari shadow neon tebal dan menggunakan aksen border tenang (`bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60`).
    4. **Password Strength Meter**: Track bar diperbarui menjadi `bg-slate-200 dark:bg-slate-700/60`, checklist aturan memenuhi kontras WCAG >= 4.5:1.
  * Status: [x] SELESAI

* [x] **REQ-FE-20: Tampilan Status Pergerakan Motor Stepper Realtime (`motor_status: moving`) & Visualisasi Sensor Cahaya LDR pada Dashboard**
  * Tanggal Diminta: 2026-10-15
  * Tanggal Selesai: 2026-10-26
  * Diminta Oleh: Backend Engineer (sesuai arahan Project Owner)
  * Diselesaikan Oleh: Frontend Developer
  * Target Komponen & Berkas Terkait:
    * `frontend/src/components/Dashboard/ClotheslineMotorCard.tsx`
    * `frontend/src/components/Dashboard/TelemetryGrid.tsx`
    * `frontend/src/App.tsx`
    * `frontend/src/services/api.ts`
  * Spesifikasi yang Terpenuhi:
    1. **Indikator Realtime Motor Stepper Bergerak**: Menampilkan animasi spinner gear bergerak dan banner status dinamis (*"⚙️ Motor Sedang Menarik Jemuran Masuk..."* atau *"⚙️ Motor Sedang Membentangkan Jemuran ke Luar..."*) saat `motorStatus === 'moving'`.
    2. **Proteksi Kontrol Manual**: Tombol manual ("Tarik ke Atap" dan "Bentangkan ke Luar") otomatis dinonaktifkan (disabled) saat motor sedang melangkah untuk mencegah instruksi ganda yang dapat merusak mekanik motor stepper.
    3. **Kartu Sensor Cahaya LDR**: Menambahkan kartu "Sensor Cahaya (LDR)" pada `TelemetryGrid.tsx` yang menampilkan nilai mentah ADC LDR (0 - 4095) beserta badge status "Terang" / "Mendung", identik dengan tampilan layar OLED ESP32.
    4. **WebSocket Listener**: Menambahkan callback `onMotor` pada `api.ts` dan menghubungkan penerimaan event WebSocket `type: 'motor'` ke state perangkat di `App.tsx` dengan filter multi-tenancy.
  * Status: [x] SELESAI


* [x] **REQ-FE-19: Inferensi Cuaca Mendung Realtime dari Sensor Optik LDR Hardware & Toleransi Status Offline saat Motor Kanopi Bergerak**
  * Tanggal Diminta: 2026-10-15
  * Tanggal Selesai: 2026-10-15
  * Diminta Oleh: Backend Engineer (sesuai pengujian Project Owner)
  * Diselesaikan Oleh: Fullstack / Backend Engineer
  * Target Komponen & Berkas Terkait:
    * `frontend/src/types/iot.ts` (penambahan field `mendung` dan `ldrRaw` pada interface `PembacaanHujan` dan `TelemetryPayload`)
    * `frontend/src/App.tsx` (pemetaan `mendung` dan `ldrRaw` pada `handleIngestTelemetry`, prioritas `isLdrMendung` di `realCondition`, serta peningkatan timeout offline dari 6 detik menjadi 15 detik)
    * `backend/models/models.go` & `backend/mqtt/subscriber.go` (penyiaran data LDR dan status mendung hardware secara realtime via WebSocket)
    * `iot/hujan_esp32.ino` (pengiriman heartbeat berkala setiap 500 langkah saat motor stepper bergerak agar tidak terjadi blackout komunikasi)
  * Spesifikasi yang Terpenuhi:
    1. **Sinkronisasi Realtime Cuaca Mendung**: Ketika sensor optik LDR pada ESP32 mendeteksi intensitas cahaya gelap/mendung (`mendung: true`), dashboard web langsung berubah realtime menjadi status Mendung tanpa tertimpa oleh ramalan cuaca BMKG.
    2. **Eliminasi Kedipan Status Offline saat Motor Berputar**: Jeda toleransi waktu offline di web ditingkatkan dari 6 detik menjadi 15 detik, dan ESP32 kini menyiarkan heartbeat status gerak (`motor_status: moving`) secara berkala di sela-sela langkah stepper sehingga status perangkat tetap stabil *Online*.
  * Status: [x] SELESAI

* [x] **REQ-FE-18: Halaman Mandiri Ketentuan Layanan & Kebijakan Privasi (Bebas Scroll Tanpa Popup) serta Redesain Landing Page Dinamis dengan Animasi Counter Meningkat saat Di-scroll**
  * Tanggal Diminta: 2026-10-15
  * Tanggal Selesai: 2026-10-15
  * Diminta Oleh: Project Owner
  * Diselesaikan Oleh: Frontend Developer
  * Target Komponen & Berkas Terkait:
    * `frontend/src/components/Legal/LegalView.tsx` (didesain ulang sebagai halaman penuh independen dengan header navigasi, tab switcher yang menyinkronkan rute `/terms` dan `/privacy`, tombol cetak dokumen/PDF, toggle tema, dan scrolling native dokumen tanpa kendala gestur)
    * `frontend/src/components/Landing/LandingPage.tsx` (redesain landing page dengan panggung simulasi fisik kanopi jemuran, animasi counter meningkat saat di-scroll untuk Servo 0°, ADC 3850, Kelembapan 12%, dan Latency Sub-4ms, sandbox AI interaktif, accordion FAQ, dan tautan legal langsung)
    * `frontend/src/components/Auth/AuthPage.tsx` (mengganti popup modal legal pada formulir registrasi dan footer dengan tautan SPA langsung `<Link to="/terms">` dan `<Link to="/privacy">`)
    * `frontend/src/App.tsx` (pemberian props `theme` dan `onToggleTheme` pada rendering rute `/terms` dan `/privacy`)
    * `frontend/src/components/Common/LegalModal.tsx` (didepresiasi dan dilepaskan dari seluruh alur aplikasi)
  * Spesifikasi yang Terpenuhi:
    1. **Eliminasi Popup Modal Legal**: Ketentuan Layanan dan Kebijakan Privasi kini dibuka sebagai halaman mandiri penuh. Masalah scroll tertahan teratasi secara menyeluruh karena menggunakan scrolling native browser yang mulus di ponsel pintar maupun komputer.
    2. **Animasi Angka Counter Meningkat saat Di-scroll**: Ketika pengunjung menggulir ke bagian telemetri konsol hardware, angka secara dinamis meningkat (count-up) dari 0 menuju angka target (Servo 0° Jemur, ADC 3850, Kelembapan 12% Kering, Latensi 3.8ms Sub-4ms) menggunakan kurva easing eksponensial.
    3. **Panggung Simulasi Interaktif & Sandbox AI**: Pengunjung dapat menyimulasikan tetesan hujan, melihat kanopi menutup dan jemuran terlindungi, serta menggeser slider kelembapan udara untuk melihat reaksi prediksi AI secara realtime.
  * Status: [x] SELESAI

* [x] **REQ-FE-17: Pemisahan Status "Alarm Audio Dimatikan" dengan "Status Fisik Sensor Masih Basah" & Visualisasi Tingkat Hujan (Gerimis / Hujan / Badai)**
  * Tanggal Diminta: 2026-10-15
  * Tanggal Selesai: 2026-10-15
  * Diminta Oleh: Backend Engineer (sesuai evaluasi Project Owner)
  * Diselesaikan Oleh: Frontend Developer
  * Target Komponen & Berkas Terkait:
    * `frontend/src/components/Alert/PersistentRainAlarmModal.tsx`
    * `frontend/src/App.tsx` (handler `onDismiss` modal alarm & floating banner status)
    * `frontend/src/components/Dashboard/HeroStatusCard.tsx` (indikator level cuaca: Gerimis, Hujan, Badai)
  * Spesifikasi yang Terpenuhi:
    1. **Banner / Badge "Alarm Diheningkan"**: Ketika modal alarm ditutup (`onDismiss`) sementara sensor fisik masih mendeteksi basah (`effectiveWet === true`), dashboard menampilkan banner informatif tenang: *"🔇 Alarm Suara Diheningkan — Sensor Masih Basah (Kanopi Tetap Aman di Dalam)"* lengkap dengan tombol pintas *"Bunyikan Lagi"*.
    2. **Klasifikasi Tingkat Hujan Jelas**: Visualisasi tingkat hujan terpisah secara akurat berdasarkan intensitas kebasahan:
       - `20% - 50%`: **Gerimis** (*Drizzle*)
       - `51% - 80%`: **Hujan Sedang / Deras** (*Rain*)
       - `> 80%`: **Badai / Hujan Sangat Lebat** (*Heavy Storm*)
    3. **Pencegahan Toast "Reda" Prematur**: Notifikasi toast *"Hujan Telah Reda"* hanya dipicu bila sensor benar-benar kering (`currentWet === false`).
  * Status: [x] SELESAI

* [x] **REQ-FE-16: Perbaikan Sinkronisasi Nada Dering Kustom & Preferensi Pengguna Antar-Perangkat (Cross-Device Account Sync)**
  * Tanggal Diminta: 2026-10-15
  * Tanggal Selesai: 2026-10-15
  * Diminta Oleh: Backend Engineer (sesuai laporan Project Owner)
  * Diselesaikan Oleh: Frontend Developer
  * Target Komponen & Berkas Terkait:
    * `frontend/src/services/auth.ts` (fungsi `login()` dan `register()`)
    * `frontend/src/App.tsx` (sinkronisasi audio kustom saat sesi aktif)
    * `frontend/src/components/Dashboard/TelemetryGrid.tsx` (pembersihan kartu DHT22 & Baterai yang tidak dipakai hardware)
  * Spesifikasi yang Terpenuhi:
    1. Melengkapi pemetaan `session.user` di `auth.ts` dengan menyertakan `telegramChatId`, `alarmTone`, `customAlarmUrl`, dan `theme`.
    2. Ketika sesi pengguna dimuat di `App.tsx`, `customAlarmUrl` otomatis disimpan ke `localStorage` dan di-cache via `cacheCustomAudio()` sehingga nada dering kustom langsung aktif saat login di gawai baru.
    3. Merapikan `TelemetryGrid.tsx` agar fokus pada sensor aktual (ADC FC-37, Persentase Basah, Sinyal WiFi, Uptime/Daya USB, dan Firmware).
  * Status: [x] SELESAI

* [x] **REQ-FE-15: Penyesuaian Inferensi Cuaca 'Mendung' (Pemisahan Cerah Berawan vs Mendung Tebal & Konsumsi Data LDR Hardware)**
  * Tanggal Diminta: 2026-10-15
  * Tanggal Selesai: 2026-10-15
  * Diminta Oleh: Backend Engineer (sesuai investigasi Project Owner)
  * Diselesaikan Oleh: Frontend Developer
  * Target Komponen & Berkas Terkait:
    * `frontend/src/App.tsx` (evaluasi `bmkgCondition` dan `realCondition`)
    * `frontend/src/components/Dashboard/HeroStatusCard.tsx`
  * Spesifikasi yang Terpenuhi:
    1. Memisahkan kondisi: jika `bmkgDesc` mengandung kata *"cerah"* (misal *"Cerah Berawan"*), visual ditetapkan sebagai `'cerah'` (terik matahari bersahabat).
    2. Status `'mendung'` hanya digunakan jika BMKG secara eksplisit menyatakan *"Berawan Tebal"* atau *"Mendung"*.
    3. Jika telemetri hardware memiliki flag `mendung: false` (sensor LDR mendeteksi cahaya terang di atas ambang ADC), sensor optik lokal diprioritaskan.
  * Status: [x] SELESAI

* [x] **REQ-FE-17: Halaman Penuh Mandiri Ketentuan Layanan & Kebijakan Privasi serta Interaktivitas Landing Page**
  * Tanggal Diminta: 2026-10-15
  * Tanggal Selesai: 2026-10-15
  * Diminta Oleh: Project Owner
  * Diselesaikan Oleh: Frontend Developer
  * Target Komponen & Berkas Terkait:
    * `frontend/src/components/Legal/LegalView.tsx` (didesain ulang sebagai halaman penuh independen dengan header navigasi, tab switcher yang menyinkronkan rute `/terms` dan `/privacy`, tombol cetak dokumen/PDF, toggle tema, dan scrolling native dokumen tanpa kendala gestur)
    * `frontend/src/components/Landing/LandingPage.tsx` (redesain landing page dengan panggung simulasi fisik tali rel jemuran, animasi counter meningkat saat di-scroll untuk Servo 0°, ADC 3850, Kelembapan 12%, dan Latency Sub-4ms, sandbox AI interaktif, accordion FAQ, dan tautan legal langsung)
    * `frontend/src/components/Auth/AuthPage.tsx` (mengganti popup modal legal pada formulir registrasi dan footer dengan tautan SPA langsung `<Link to="/terms">` dan `<Link to="/privacy">`)
    * `frontend/src/App.tsx` (pemberian props `theme` dan `onToggleTheme` pada rendering rute `/terms` dan `/privacy`)
    * `frontend/src/components/Common/LegalModal.tsx` (didepresiasi dan dilepaskan dari seluruh alur aplikasi)
  * Spesifikasi yang Terpenuhi:
    1. **Eliminasi Popup Modal Legal**: Ketentuan Layanan dan Kebijakan Privasi kini dibuka sebagai halaman mandiri penuh. Masalah scroll tertahan teratasi secara menyeluruh karena menggunakan scrolling native browser yang mulus di ponsel pintar maupun komputer.
    2. **Animasi Angka Counter Meningkat saat Di-scroll**: Ketika pengunjung menggulir ke bagian telemetri konsol hardware, angka secara dinamis meningkat (count-up) dari 0 menuju angka target (Servo 0° Jemur, ADC 3850, Kelembapan 12% Kering, Latensi 3.8ms Sub-4ms) menggunakan kurva easing eksponensial.
    3. **Panggung Simulasi Interaktif & Sandbox AI**: Pengunjung dapat menyimulasikan tetesan hujan, melihat rel tali katrol bergerak ke atap tertutup dan jemuran terlindungi, serta menggeser slider kelembapan udara untuk melihat reaksi prediksi AI secara realtime.
  * Status: [x] SELESAI

* [x] **REQ-FE-18: Desain Taste V1 Landing Page (Ambient Ethereal Blue-Purple Flow, Scrollbar Gradasi Ungu-Biru, Kontras & Toggle Tali Katrol ESP32, Prediksi AI Berwarna & Elegan, dan Perbaikan Bug Header Dark Mode)**
  * Tanggal Diminta: 2026-10-15
  * Tanggal Selesai: 2026-10-15
  * Diminta Oleh: Project Owner
  * Diselesaikan Oleh: Frontend Developer
  * Target Komponen & Berkas Terkait:
    * `frontend/src/components/Landing/LandingPage.tsx`
    * `frontend/src/components/Layout/Header.tsx`
    * `frontend/src/components/Legal/LegalView.tsx`
    * `frontend/src/components/Auth/AuthPage.tsx`
    * `frontend/src/App.tsx`
    * `frontend/src/index.css`
  * Spesifikasi yang Terpenuhi:
    1. **Ambient Ethereal Blue-Purple Gradient Flow**: Menambahkan lapisan aura gradasi biru-ungu tipis dan lembut di latar belakang landing page (`animate-subtle-gradient` & `animate-float-slow`) yang bergerak halus tanpa mencolok (anti-slop).
    2. **Scrollbar Gradasi Ungu-Biru**: Menyesuaikan scrollbar di Landing Page, Login, dan Register dengan gradasi warna ungu-biru (`linear-gradient(180deg, #6366f1, #3b82f6, #a855f7)`) yang elegan dan modern.
    3. **Konsol Telemetri Hardware ESP32 & Panggung Tali Katrol**: Memperbaiki kontras teks pada kedua sisi panggung simulasi (Area Atap Tertutup vs Area Luar Terbuka) sehingga tulisan sangat terbaca di mode terang maupun gelap. Menambahkan toggle switch bergaya rel dashboard dengan aksen gradasi biru-ungu.
    4. **Prediksi Hujan & Rekomendasi Jemur Berbasis AI**: Memperkaya visual modul AI dengan gauge melingkar berpendar, indikator status berwarna semantik (Hijau Emerald untuk Aman Jemur, Emas Amber untuk Waspada, Merah Rose untuk Tarik ke Atap), slider gradasi mikro, serta 4 kartu metrik pintar yang hidup.
    5. **Perbaikan Bug Header Dark Mode**: Memastikan seluruh header (Dashboard saat cerah maupun mendung, Landing Page, Auth, dan Legal) selalu merespons pilihan tema gelap pengguna secara konsisten (`bg-slate-900/90 text-slate-100 border-slate-800`).
  * Status: [x] SELESAI

* [x] **REQ-FE-14: Penghapusan Fitur Web Push Browser (Google VAPID) & Penyatuan Notifikasi 100% ke Telegram Bot**
  * Tanggal Diminta: 2026-10-14
  * Tanggal Selesai: 2026-10-14
  * Diminta Oleh: Backend Engineer (sesuai arahan Project Owner)
  * Diselesaikan Oleh: Frontend Developer
  * Target Komponen & Berkas Terkait:
    * `frontend/src/components/Layout/Header.tsx` (dibersihkan dari aksi web push browser; header fokus pada kontrol perangkat, tema, status koneksi broker, dan pengaturan)
    * `frontend/src/components/Perangkat/DeviceView.tsx` (kartu pendaftaran dan status Web Push API + VAPID resmi dihapus)
    * `frontend/src/components/Settings/SettingsView.tsx` (mengganti kartu Web Push pada Quick Actions Bar dan Tab Preferensi dengan status integrasi bot Telegram, tautan langsung ke `@Rintik_Iot_Bot`, serta tombol uji kirim pesan bot)
    * `frontend/src/services/webpush.ts` (deprekasi WebPushService dengan aman tanpa panggilan jaringan ke endpoint `/api/notifications/subscribe` dan `/api/notifications/vapid-key`)
    * `frontend/public/sw.js` (event handler push Google FCM yang menampilkan banner native OS dihapus, sementara arsitektur caching offline `rintik-v2` dan berkas audio kustom `rintik-custom-tones-v1` tetap dipertahankan utuh)
    * `frontend/src/App.tsx` (pembersihan state dan prop `notifPermission` / `isNotifSubscribed` yang sudah tidak lagi digunakan)
  * Spesifikasi & Instruksi Kerja yang Terpenuhi:
    1. **Penyatuan Notifikasi ke Telegram Bot (Unified Alerts Strategy)**:
       * Fitur Web Push Notification browser (Google VAPID/FCM) tidak lagi digunakan untuk menghindari friksi izin peramban seluler, pembatasan background OS, dan keharusan domain/SSL ketat.
       * Seluruh pengiriman peringatan hujan keluar (eksternal) kini dipusatkan **100% ke Telegram Bot**.
       * Di dalam aplikasi web (foreground), peringatan tetap didukung oleh **Modal HUD Alarm Darurat Hujan & Nada Dering Looping Persisten** (`PersistentRainAlarmModal.tsx` & `audioAlarm.ts`).
    2. **Pembersihan Antarmuka (UI Cleanup)**:
       * Seluruh elemen aktivasi push notification browser telah dibersihkan.
       * Quick Actions Bar dan Tab Preferensi pada menu Pengaturan kini menampilkan status koneksi Telegram Bot yang terhubung secara realtime dengan tombol pintas *"Buka Bot"* dan *"Uji Pesan"*.
       * Informasi panduan notifikasi dengan jelas menerangkan: *"Peringatan hujan otomatis dikirimkan langsung ke Telegram Anda. Pastikan Chat ID Telegram Anda sudah terhubung."*
  * Dokumen Rujukan: [API_CONTRACT_AGREEMENT.md](API_CONTRACT_AGREEMENT.md) Bagian 7.2
  * Status: [x] SELESAI

---

* [x] **REQ-FE-13: Antarmuka Unggah Nada Dering Alarm Kustom (Custom Audio Upload) & Caching Audio Offline**
  * Tanggal Diminta: 2026-10-14
  * Tanggal Selesai: 2026-10-14
  * Diminta Oleh: Backend Engineer (sesuai arahan Project Owner)
  * Diselesaikan Oleh: Frontend Developer
  * Komponen & Berkas Terkait:
    * `frontend/src/utils/audioAlarm.ts` (opsi tone 'custom', utility `cacheCustomAudio` dengan Web Cache Storage API `rintik-custom-tones-v1`, pemutaran looping via `HTMLAudioElement`, dan graceful fallback ke `emergency_siren`)
    * `frontend/src/components/Settings/SettingsView.tsx` (dropzone upload audio interaktif, validasi client-side file audio max 5MB, upload progress indicator, preview playback tombol play/stop, dan integrasi dengan `POST /api/user/custom-alarm` serta `PUT /api/user/profile`)
    * `frontend/src/App.tsx` (resolusi `customUrl` dari `localStorage` atau `session.user.customAlarmUrl` untuk pemutaran audio alarm persisten saat sensor hujan mendeteksi kebasahan)
  * Spesifikasi Desain & Tampilan yang Terpenuhi:
    1. **Tab Preferensi Pengaturan (`SettingsView.tsx`)**:
       * Menambahkan opsi nada dering kustom: *"Nada Dering Kustom (Unggah Sendiri)"* (`id: "custom"`).
       * Menyediakan area Dropzone dan tombol interaktif *"Pilih Berkas Audio"* yang mendukung format audio `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.webm`.
       * Validasi ketat di sisi klien: membatasi ukuran file maksimal 5MB dan memverifikasi MIME type audio sebelum mengirim ke server.
       * Indikator progres upload animasi yang halus dengan feedback visual saat berhasil/gagal.
       * Kontrol audio preview interaktif (Play/Pause) untuk menguji file audio kustom yang sedang aktif.
       * Kartu status audio kustom aktif dengan badge "Offline Ready" untuk menegaskan ketersediaan berkas saat offline.
    2. **Resiliensi Audio Offline (Offline Resilience)**:
       * Menyimpan file audio kustom ke dalam Browser Cache Storage (`caches.open('rintik-custom-tones-v1')`). Jika pengguna kehilangan koneksi internet saat badai petir atau hujan deras, alarm tetap dapat berbunyi berulang kali menggunakan blob audio yang tercache.
    3. **Integrasi Loop Alarm Persisten (`App.tsx` & `audioAlarm.ts`)**:
       * Saat sensor mendeteksi hujan atau tombol darurat diaktifkan, loop audio persisten secara otomatis memutar audio kustom yang tersimpan di server/cache lokal. Jika terjadi galat pemutaran (misal berkas rusak), sistem otomatis fallback ke synth alarm darurat (`emergency_siren`).
  * Dokumen Rujukan: [API_CONTRACT_AGREEMENT.md](API_CONTRACT_AGREEMENT.md), [PRD.md](PRD.md)
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

