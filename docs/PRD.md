# PRD - Dashboard IoT Sensor Hujan dan Jemuran Otomatis (HujanPantau)

| Atribut | Keterangan |
| :--- | :--- |
| **Nama Produk** | HujanPantau (Rintik IoT) |
| **Versi Dokumen** | 2.0 (Arsitektur Full-Stack Terintegrasi) |
| **Status** | Aktif / Produksi & Staging |
| **Tanggal Pembaruan** | 2026-10-13 |
| **Dokumen Terkait** | [`ERD.md`](./ERD.md) / [`API.md`](./API.md) / [`API_CONTRACT_AGREEMENT.md`](./API_CONTRACT_AGREEMENT.md) / [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) |

---

## 1. Ringkasan Eksekutif

HujanPantau adalah ekosistem Internet of Things (IoT) cerdas end-to-end yang dirancang untuk mendeteksi intensitas air hujan secara presisi, menggerakkan aktuator motor pelindung jemuran secara otomatis, menyinkronkan data mikroklimat ke cloud database relasional dan in-memory cache, serta menyajikan visualisasi analitik interaktif yang terhubung langsung dengan data cuaca resmi BMKG Indonesia dan notifikasi Telegram.

Produk ini terdiri dari empat pilar arsitektur yang terintegrasi secara modular:
1. **Node Perangkat Keras (ESP32)**: Membaca sensor hujan analog (FC-37/MH-RD), sensor cahaya (LDR), layar OLED monitor, dan mengontrol aktuator motor stepper/servo secara otonom (failsafe lokal) serta mempublikasikan telemetri ke private cloud MQTT broker setiap 2 detik.
2. **Private MQTT Broker (Mosquitto VPS)**: Broker privat berlatensi rendah (< 15 ms) pada Tencent Cloud VPS regional Singapura, menggantikan broker publik guna menjamin privasi, menghilangkan batasan rate-limiting, dan mencegah tabrakan data perangkat asing.
3. **Backend Service (Golang Engine)**: Service berkinerja tinggi yang berjalan dengan arsitektur non-blocking di Linux AMD64 VPS, mengelola konsumsi pesan MQTT, siaran WebSocket realtime, penyimpanan ganda (MySQL 5.7 dan Redis), mesin prediksi hujan (AI Engine), kontrol motor dua arah, dan pengiriman notifikasi darurat Telegram.
4. **Web Dashboard SPA (React 19 & Tailwind CSS v4)**: Antarmuka mobile-first berbasis Progressive Web App (PWA) di Vercel yang menyajikan status visual, grafik interaktif, prediksi kecerdasan buatan, kontrol motor manual, dan integrasi prakiraan cuaca resmi BMKG per kelurahan (ADM4).

---

## 2. Masalah dan Latar Belakang

### 2.1 Permasalahan Nyata
* **Perubahan Cuaca Ekstrem dan Mendadak**: Di iklim tropis Indonesia, hujan sering turun secara tiba-tiba tanpa tanda-tanda yang jelas saat penghuni rumah sedang bekerja, bepergian, atau tidur.
* **Kerugian Akibat Jemuran Basah**: Pakaian yang terkena air hujan setelah dijemur berisiko bau apek, kotor, dan memerlukan proses pencucian ulang yang membuang waktu, air, dan energi listrik.
* **Keterbatasan Aplikasi Cuaca Konvensional**: Aplikasi cuaca umum hanya menyediakan estimasi makro pada tingkat kecamatan atau kota, tidak mencerminkan kondisi riil di atas jemuran halaman rumah secara spesifik.
* **Kelemahan Alarm Konvensional**: Sistem alarm buzzer sederhana di rumah tidak berguna jika pemilik sedang berada di luar rumah atau di ruangan berperedam suara.

### 2.2 Perbandingan Solusi

| Parameter | Solusi Konvensional (Buzzer/CCTV) | Aplikasi Cuaca Umum | HujanPantau IoT |
| :--- | :--- | :--- | :--- |
| **Deteksi Fisik Lapangan** | Ya (lokal saja) | Tidak (data satelit makro) | Ya (sensor analog langsung) |
| **Aksi Otomatis Perlindungan** | Tidak (manual oleh manusia) | Tidak ada | Ya (motor menarik otomatis) |
| **Akses Jarak Jauh** | Terbatas / Mahal (CCTV) | Ya | Ya (Web Realtime & Telegram) |
| **Kemampuan Analitik & AI** | Tidak ada | Probabilitas wilayah umum | Analisis tren suhu, kelembapan, & ADC |
| **Keandalan Tanpa Internet** | Terbatas | Tidak berfungsi | Failsafe lokal otonom pada ESP32 |

---

## 3. Tujuan dan Tolok Ukur Keberhasilan

### 3.1 Tujuan Utama Produk
* **O1 - Kecepatan Respon Aktual**: Penarikan fisik jemuran berlangsung dalam waktu kurang dari 1 detik sejak tetesan air pertama membasahi sensor konduktor.
* **O2 - Latensi Komunikasi Realtime**: Pembaruan status di dashboard web dan pengiriman pesan bot Telegram terjadi dalam waktu kurang dari 2 detik setelah sensor aktif.
* **O3 - Integritas dan Keamanan Data**: Tidak ada kebocoran data antar-perangkat, data telemetri historis tersimpan rapi di MySQL, dan status instan dapat diakses dalam hitungan mikrodetik melalui Redis.
* **O4 - Keandalan Operasional Tinggi**: Ketersediaan layanan 99.9% dengan arsitektur private broker dan watchdog offline otomatis (toleransi 6 detik).
* **O5 - Pengalaman Pengguna Responsif**: Antarmuka web mendukung layar smartphone mulai dari 360 px tanpa pergeseran horizontal, serta memiliki mode visual gelap dan terang.

---

## 4. Persona Pengguna dan Skenario Penggunaan

### Persona Utama: Profesional Urban & Pengurus Rumah Tangga
* **Profil**: Pengguna yang memiliki aktivitas padat di luar rumah atau bekerja dari rumah (WFH), menjemur pakaian di area terbuka, dan memiliki akses smartphone serta koneksi internet.
* **Kebutuhan**:
  * Ingin kepastian bahwa jemuran aman saat ditinggal bepergian.
  * Membutuhkan informasi kapan waktu optimal untuk menjemur pakaian berdasarkan cuaca riil dan prakiraan BMKG.
  * Memerlukan kendali manual dari jarak jauh jika mendung tebal mulai muncul.

### Skenario Operasional
1. **Skenario Hujan Tiba-Tiba**: Pemilik rumah sedang rapat di kantor. Hujan deras turun di rumah. Sensor FC-37 mendeteksi air, ESP32 seketika menggerakkan motor stepper menarik jemuran ke area beratap. Dalam waktu bersamaan, bot Telegram mengirimkan pesan darurat disertai data kebasahan sensor.
2. **Skenario Perencanaan Jemur Pagi**: Pagi hari sebelum beraktivitas, pengguna membuka dashboard web, melihat Kartu Rekomendasi Jemur AI (Drying Advice) yang menyatakan "AMAN JEMUR" dengan estimasi kering 2.5 jam, disinkronkan dengan prakiraan BMKG kelurahan setempat.
3. **Skenario Gangguan Koneksi**: Jika koneksi WiFi rumah terputus, mikrokontroler ESP32 tetap mengoperasikan logika penarikan motor secara otonom saat hujan turun tanpa henti.

---

## 5. Fitur dan Modul Fungsional Produk

### 5.1 Modul Hardware dan Firmware (ESP32 Node)
* **Sampling Analog Realtime**: Pembacaan ADC pin GPIO 33 (Sensor Hujan) dan GPIO 34 (LDR Cahaya) dengan rentang kalibrasi 0-4095.
* **Logika Histeresis Anti-Flapping**: Menghindari pemicu palsu akibat tetesan embun atau kelembapan tinggi sesaat.
* **Kontrol Aktuator Stepper / Servo**: Mengirimkan sinyal step dan direction pada GPIO 18 dan 19 untuk menarik atau mendorong jemuran.
* **Display Monitor OLED**: Layar I2C SSD1306 (GPIO 21 SDA, GPIO 22 SCL) menampilkan identitas perangkat, status cuaca, dan posisi mekanik rel.
* **MQTT Keepalive dan LWT**: Mengirimkan paket data per 2 detik, memantau keepalive 5 detik, serta menitipkan status Last Will and Testament (LWT) otomatis offline.

### 5.2 Modul Private Cloud MQTT Broker
* **Dedicated Mosquitto VPS**: Berjalan pada port TCP 1883 dan WebSocket port 9001.
* **Isolasi Topik Terstruktur**:
  * `hujansensor/{deviceId}/telemetry` (Telemetri reguler)
  * `hujansensor/{deviceId}/state` (Status online/offline dan metadata)
  * `hujansensor/{deviceId}/event` (Peristiwa transisi seperti `rain_start` dan `rain_stop`)
  * `hujansensor/{deviceId}/cmd` (Perintah kontrol arah motor)
  * `{deviceId}/data` dan `{deviceId}/control` (Format kompatibilitas hardware)

### 5.3 Modul Backend Service (Golang Engine)
* **Daemon Subscriber Non-Blocking**: Berlangganan topik MQTT, memvalidasi kepemilikan perangkat di database, dan mencegah pendaftaran liar perangkat asing.
* **WebSocket Realtime Hub (`/ws`)**: Menyiarkan event telemetri, status online/offline, posisi motor, dan peringatan dini ke seluruh peramban yang terhubung.
* **Watchdog Deteksi Offline**: Menandai perangkat sebagai offline secara otomatis jika tidak menerima transmisi baru dalam rentang waktu lebih dari 6 detik.
* **Sistem Autentikasi Pengguna**: Registrasi, login dengan hashing bcrypt, proteksi brute-force, dan token bearer sesi.
* **Mesin Analitik AI**:
  * `POST /api/ai/predict-rain`: Menganalisis delta penurunan suhu, lonjakan kelembapan udara, dan tren ADC sensor untuk memprediksi potensi hujan dalam 15-45 menit ke depan.
  * `GET /api/ai/drying-advice`: Menghitung skor jemur (0-100), estimasi jam pakaian kering, dan jam jemur optimal.
* **Penyimpanan Ganda Relasional & In-Memory**:
  * MySQL 5.7: Tabel `users`, `devices`, `telemetries`, `events`, dan `ai_predictions`.
  * Redis: Cache status instan `latest_telemetry:{deviceId}` dan riwayat cepat `telemetry_history:{deviceId}`.
* **Notifikasi Telegram Otomatis**: Layanan daemon latar belakang yang mengirimkan pesan alert saat hujan atau pergerakan jemuran terdeteksi.
* **Ekspor Data CSV**: Mengunduh seluruh riwayat telemetri perangkat untuk analisis penelitian.

### 5.4 Modul Frontend Web Dashboard (React 19 & Tailwind CSS v4)
* **Kartu Status Pahlawan (Hero Status Card)**: Menampilkan status utama (Kering, Hujan, atau Offline), waktu terakhir dilihat, persentase basah, dan level baterai.
* **Kartu Kontrol Motor Jemuran**: Tombol interaktif untuk menarik atau mendorong jemuran secara manual dengan indikator posisi aktual (Teduh / Luar).
* **Kartu Analisis AI & Prediksi Cuaca**: Widget probabilitas hujan cerdas dan rekomendasi kondisi jemur.
* **Grafik Interaktif Realtime**: Visualisasi fluktuasi grafik ADC dan kelembapan secara langsung tanpa reload halaman.
* **Integrasi Open Data BMKG**: Mengambil prakiraan cuaca resmi 3 harian berdasarkan kode kelurahan ADM4.
* **Manajemen Perangkat Multi-Tenancy**: Menambah, mengedit ambang batas, dan menghapus perangkat dengan isolasi data yang ketat.
* **Dukungan Tema dan Audio Sirene**: Mode Gelap, Mode Terang, serta audio alarm darurat saat hujan terdeteksi.

---

## 6. Persyaratan Non-Fungsional (NFR)

* **Keandalan (Reliability)**: Kegagalan koneksi internet tidak boleh menghentikan fungsi penarikan jemuran darurat di lapangan.
* **Performa (Performance)**:
  * Waktu tanggap endpoint REST API < 100 ms.
  * Konsumsi memori backend Golang < 25 MB RAM di server VPS.
  * Siaran WebSocket diterima browser dalam waktu < 200 ms dari publikasi hardware.
* **Keamanan (Security)**:
  * Seluruh lalu lintas HTTP dan WebSocket web dilindungi enkripsi SSL/TLS (HTTPS & WSS).
  * Proteksi brute force pada endpoint autentikasi login (pembatasan percobaan berturut-turut).
  * Endpoint MQTT memvalidasi pendaftaran ID perangkat di database sebelum memproses data.
* **Ketersediaan (Availability)**: Dukungan auto-restart service melalui unit systemd Linux di VPS dan deployment global edge CDN melalui Vercel.

---

## 7. Batasan Sistem dan Rencana Pengembangan Lanjutan

### Batasan Saat Ini:
* Pengereman dan pembacaan motor menggunakan open-loop berbasis waktu atau sinyal limit switch sederhana (closed-loop encoder direncanakan pada iterasi berikutnya).
* Pembaruan firmware mikrokontroler (OTA) masih menggunakan port serial kabel atau jaringan lokal.

### Roadmap Pengembangan Mendatang (v2.1+):
* **Web-Based OTA Firmware Update**: Pengunggahan file binary firmware ESP32 langsung melalui dashboard web admin.
* **Dukungan Kamera ESP32-CAM**: Streaming visual gambar jemuran secara snapshot resolusi rendah untuk verifikasi mata pengguna.
* **Integrasi Multi-Sensor Eksternal**: Penambahan modul anemometer untuk deteksi kecepatan angin kencang.
