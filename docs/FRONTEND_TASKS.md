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
  * Background cuaca fotorealistik: Cerah (kuning oranye matahari hangat), Gerimis (abu-abu transisi), Hujan (gelap pekat dengan rintik diagonal miring), Badai (gelap berhint ungu).
  * Ilustrasi Cuaca 3D Skeuomorfik: Bola matahari 3D glossy, awan 3D puffy bervolume, dan tetesan air 3D cyan/sky-blue mengilap.
  * Header Jam Digital Realtime & 4-Day Forecast pill cards row.
  * Penyesuaian kontras dinamis: Frosted glass hangat pada cuaca cerah dan frosted glass gelap pada cuaca hujan/badai.

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

* [ ] **FE-07: Tab Riwayat Log Akurasi AI (`AIAccuracyView.tsx`)**:
  * **Lokasi**: Sub-tab di dalam menu Riwayat Event.
  * **Tujuan**: Menampilkan tabel akurasi prediksi model:
    * Kolom: Waktu Prediksi | Probabilitas Diberikan | Status Sensor Fisik | Akurasi (Tepat / Meleset).
    * Memberikan transparansi kepada pengguna mengenai keandalan sistem cerdas.

---

### Fase 3: Analitik Data, Pengaturan & Integrasi [PRIORITAS SEDANG]

* [ ] **FE-08: Fitur Ekspor Data Riwayat (CSV & Excel)**:
  * Tombol "Ekspor Data" pada tab Grafik dan tab Riwayat.
  * Menghasilkan file `.csv` langsung di browser yang berisi timestamp, nilai ADC, kelembapan, suhu, dan tegangan baterai.
* [ ] **FE-09: Filter Rentang Tanggal Lanjutan (Datepicker)**:
  * Memungkinkan pengguna memilih rentang tanggal spesifik (misal: 1 Oktober - 5 Oktober) untuk melihat riwayat telemetri lama dari database VPS.
* [ ] **FE-10: Pengaturan Nada Dering Alarm Hujan**:
  * Opsi memilih suara alert ketika sensor mendeteksi hujan (pilihan: Nada Sirine Ringan, Bell Ding, atau Suara Hujan).
  * Pengaturan volume audio dan tombol preview suara di menu Kelola Perangkat.
* [ ] **FE-11: Form Integrasi Bot Telegram**:
  * Input Chat ID Telegram pada tab Kelola Perangkat agar pengguna menerima pesan bot instan saat jemuran tertutup otomatis.

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
