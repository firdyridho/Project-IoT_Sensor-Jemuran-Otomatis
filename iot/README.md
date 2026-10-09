# Dokumentasi Perangkat Keras & Firmware IoT (ESP32)

Dokumen ini menjelaskan rancangan perangkat keras, diagram pengkabelan (pinout), kalibrasi sensor, serta tata cara kompilasi dan flash firmware mikrokontroler ESP32 untuk sistem jemuran otomatis anti-hujan.

---

## 1. Daftar Komponen Hardware (Bill of Materials)

| Komponen | Spesifikasi / Model | Jumlah | Fungsi |
|---|---|---|---|
| Mikrokontroler | ESP32 NodeMCU-32S / DOIT DevKit V1 (30/38 Pin) | 1 unit | Pemroses utama, koneksi WiFi & transmisi MQTT |
| Sensor Hujan | Modul FC-37 / YL-83 + Komparator LM393 | 1 unit | Deteksi tetesan air hujan pada pelat konduktif |
| Sensor Suhu & Kelembapan | DHT22 (AM2302) | 1 unit | Monitoring temperatur dan kelembapan udara lingkungan |
| Aktuator Jemuran | Motor Servo TowerPro SG90 / MG90S Metal Gear | 1 unit | Menarik jemuran masuk ke kanopi saat hujan |
| Indikator Audio | Active Buzzer 5V | 1 unit | Alarm nada saat hujan terdeteksi |
| Indikator Visual | LED 5mm Merah / LED Bawaan Board (GPIO 2) | 1 unit | Penanda status aktif aktuator |
| Catu Daya | Adaptor 5V 2A DC / Step Down LM2596 | 1 unit | Penyuplai daya stabil ESP32 dan servo |
| Resistor Pull-up | 4.7k Ohm - 10k Ohm (opsional untuk DHT22) | 1 buah | Menjaga kestabilan sinyal data sensor suhu |
| Breadboard & Kabel | Breadboard 400 titik & Kabel Jumper Dupont | Secukupnya | Rangkaian prototipe |

---

## 2. Diagram Pinout & Skematik Pengkabelan

### Tabel Sambungan Pin ESP32

| Pin ESP32 | Terhubung Ke | Pin Komponen | Keterangan |
|---|---|---|---|
| **GPIO 34** (ADC1_CH6) | Sensor Hujan FC-37 | **AO** (Analog Out) | Pembacaan analog 0-4095 (Input only, bebas noise WiFi) |
| **GPIO 4** | Sensor DHT22 | **DATA / OUT** | Sinyal satu kabel (1-Wire) suhu dan kelembapan |
| **GPIO 18** | Motor Servo SG90 | **PWM / Signal** (Kabel Oranye/Kuning) | Pulsa 50Hz kendali sudut putaran motor |
| **GPIO 19** | Buzzer Aktif | **Anoda (+)** | Bunyi alarm saat hujan terdeteksi |
| **GPIO 2** | LED Status | Internal / Anoda (+) | LED indikator kondisi jemuran tertutup |
| **VIN / 5V** | Semua VCC Komponen | **VCC / 5V** | Tegangan masuk 5V |
| **GND** | Semua GND Komponen | **GND** | Jalur ground bersama (Common Ground) |

> **PENTING TENTANG CATU DAYA MOTOR SERVO**:
> Motor servo dapat menarik arus lonjakan hingga 500mA saat bergerak menarik beban jemuran. Sangat disarankan untuk menghubungkan pin VCC servo ke sumber 5V eksternal (jangan hanya mengandalkan pin 3.3V ESP32) dan pastikan jalur Ground (GND) dari adaptor dihubungkan bersama ke pin GND ESP32 (*Common Ground*).

---

## 3. Logika Kerja Sistem & State Machine

1. **Kondisi Normal (Cerah / Berawan)**:
   * Sensor hujan bernilai ADC tinggi (> 3000), persentase basah < ambang batas (default 60%).
   * Posisi motor servo: **0 derajat (Jemuran Terbuka)**.
   * ESP32 mengirim paket telemetri setiap 5 detik ke broker MQTT VPS (`hujansensor/{deviceId}/telemetry`).

2. **Kondisi Hujan Terdeteksi**:
   * Tetesan air mengenai pelat konduktif, nilai ADC turun drastis, persentase basah mencapai atau melebihi ambang batas (`rainPct >= rainThreshold`).
   * Buzzer berbunyi 2 kali secara instan.
   * Motor servo berputar ke sudut **90 derajat (Jemuran Tertutup)**.
   * ESP32 mengirim paket event darurat (`HUJAN_TERDETEKSI`) ke topik `hujansensor/{deviceId}/event`.

3. **Kondisi Hujan Reda (Histeresis & Debounce)**:
   * Ketika hujan berhenti dan air mulai mengering, persentase turun ke bawah `rainThreshold - 5%`.
   * Sistem menghitung timer stabil selama **12 detik berturut-turut** untuk memastikan tidak ada rintik susulan.
   * Setelah 12 detik stabil kering, servo kembali ke **0 derajat (Jemuran Dibuka Kembali)**.
   * ESP32 mempublikasikan event `HUJAN_BERHENTI`.

4. **Kendali Jarak Jauh (Manual Override)**:
   * Dashboard web dapat mengirim pesan ke topik `hujansensor/{deviceId}/cmd`:
     * `{"cmd":"BUKA"}`: Membuka jemuran secara manual.
     * `{"cmd":"TUTUP"}`: Menutup jemuran secara manual.
     * `{"cmd":"SET_THRESHOLD","value":75}`: Mengubah sensitivitas tanpa perlu flash ulang firmware.

---

## 4. Panduan Instalasi & Flashing Firmware

### Langkah A: Persiapan Arduino IDE

1. Buka **Arduino IDE** (versi 2.x disarankan).
2. Buka menu **File > Preferences**, pada kolom *Additional boards manager URLs*, tambahkan URL board ESP32:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Buka **Tools > Board > Boards Manager**, cari `esp32` oleh Espressif Systems lalu klik **Install**.
4. Pasang library yang dibutuhkan melalui **Tools > Manage Libraries**:
   * `PubSubClient` oleh Nick O'Leary
   * `DHT sensor library` oleh Adafruit
   * `ESP32Servo` oleh Kevin Harrington
   * `ArduinoJson` oleh Benoit Blanchon (versi 6 atau 7)

### Langkah B: Konfigurasi Parameter

1. Salin berkas `config.h.example` menjadi `config.h`:
   ```bash
   cp iot/config.h.example iot/config.h
   ```
2. Buka `iot/config.h` dan sesuaikan nilainya:
   * `WIFI_SSID`: Nama hotspot / WiFi di rumah Anda.
   * `WIFI_PASSWORD`: Kata sandi WiFi.
   * `DEVICE_ID`: ID unik perangkat Anda (harus sama dengan ID di dashboard web, contoh: `hs-8f3a1c9d2b70`).
   * `MQTT_SERVER`: Alamat server broker VPS Anda (default: `43.133.136.149`).
   * `MQTT_PORT`: Port MQTT (default: `1883`).

### Langkah C: Upload ke ESP32

1. Sambungkan ESP32 ke komputer menggunakan kabel Micro-USB atau USB-C data.
2. Di menu **Tools > Board**, pilih `DOIT ESP32 DEVKIT V1` (atau model ESP32 yang sesuai).
3. Di menu **Tools > Port**, pilih port COM yang terdeteksi (misalnya `COM3` atau `COM4`).
4. Klik tombol **Upload** (tanda panah ke kanan).
5. Jika pada status upload muncul pesan `Connecting.......____`, tekan dan tahan tombol **BOOT** pada board ESP32 selama 2 detik hingga proses flashing berjalan.
6. Buka **Tools > Serial Monitor** dengan baud rate `115200` untuk memantau log koneksi WiFi dan pembacaan sensor secara langsung.

---

## 5. Uji Coba Lapangan & Kalibrasi

1. **Uji Kering**:
   * Saat pelat sensor benar-benar kering, Serial Monitor harus menampilkan nilai ADC mendekati `4000 - 4095` dan intensitas `0%`.
2. **Uji Basah**:
   * Teteskan 1 tetes air pada pelat menggunakan pipet atau jari basah.
   * Nilai ADC akan langsung anjlok ke `< 1500` dan persentase hujan akan melonjak melewati 60%.
   * Perhatikan bahwa servo langsung bergerak ke sudut 90 derajat dan notifikasi masuk ke Dashboard Web secara sub-detik.
3. **Uji Reda**:
   * Keringkan pelat sensor menggunakan tisu kering.
   * Tunggu 12 detik, motor servo akan berputar kembali ke posisi 0 derajat.
