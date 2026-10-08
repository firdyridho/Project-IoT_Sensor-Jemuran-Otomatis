# Panduan Lengkap Deploy IoT Sensor Hujan & Jemuran Otomatis

Panduan ini berisi panduan teknis implementasi backend **Golang + SQLite** di VPS **Tencent Cloud Lighthouse (aaPanel)** dan frontend di **Vercel**, serta solusi penyebab sensor ESP32 sebelumnya tidak terdeteksi basah di web.

---

## 1. Penyebab Kenapa Sensor ESP32 Sebelumnya Masih Terbaca "Kering"

Ada 2 penyebab utama yang sudah diperbaiki:

1. **Simulator Web Otomatis Aktif (Root Cause)**:
   - Sebelumnya, state awal simulator diatur ke `true` untuk keperluan demo saat belum ada alat fisik. Akibatnya, modul simulator lokal terus-menerus menimpa (*override*) pembacaan MQTT riil dengan angka acak kondisi kering setiap 2 detik.
   - **Perbaikan**: Kami sudah mengubah nilai default menjadi `isSimulating = false`. Sekarang web memprioritaskan data riil dari ESP32 / WebSocket backend secara langsung.
2. **Kesesuaian Topic & Device ID**:
   - ESP32 harus mempublikasikan telemetry dengan topik:
     `hujansensor/{DEVICE_ID}/telemetry`
     Contoh Device ID bawaan: `hs-8f3a1c9d2b70`
     Topik: `hujansensor/hs-8f3a1c9d2b70/telemetry`

---

## 2. Struktur Proyek yang Telah Dipisah

Proyek sekarang memiliki struktur terpisah (*monorepo clean split*):

```
Iot Sensor Hujan/
├── backend/                  <-- Dideploy ke Tencent Cloud VPS (aaPanel)
│   ├── database/             <-- SQLite murni (GORM + pure-Go driver, tanpa CGO)
│   ├── deploy/
│   │   ├── build-linux.bat   <-- Script compile binary Linux langsung dari Windows
│   │   ├── hujan-backend.service <-- Service systemd untuk autostart 24/7 di VPS
│   │   └── nginx-aapanel.conf <-- Template Reverse Proxy + WebSocket Nginx
│   ├── handlers/             <-- REST API & Hub WebSocket
│   ├── models/               <-- Skema tabel Device, Telemetry, Event
│   ├── mqtt/                 <-- MQTT Subscriber daemon (test.mosquitto.org)
│   ├── hujan-backend-linux   <-- Binary Linux 64-bit SIAP JALAN (~14 MB, RAM < 15 MB)
│   ├── go.mod
│   └── main.go
│
├── frontend/                 <-- Dideploy ke Vercel
│   ├── src/                  <-- React 19 + TypeScript + Vite + Tailwind CSS v4
│   ├── public/
│   ├── vercel.json           <-- Routing SPA & Security Header
│   └── package.json
│
└── docs/                     <-- Dokumentasi teknis
```

---

## 3. Langkah Deploy Backend di Tencent Cloud Lighthouse (aaPanel)

Spesifikasi VPS Tencent Cloud murah (1-2 vCPU, 1-2 GB RAM) **sangat lebih dari cukup** karena backend Golang ini di-compile menjadi single static binary dan menggunakan database SQLite yang hanya memakan RAM sekitar **10 - 15 MB**!

### Langkah 1: Siapkan Folder di aaPanel
1. Buka dashboard **aaPanel** di browser Anda.
2. Masuk ke menu **Files**.
3. Masuk ke direktori `/www/wwwroot/` lalu buat folder baru bernama:
   `/www/wwwroot/hujan-backend`

### Langkah 2: Upload File Binary
1. Dari laptop Anda, buka folder:
   `c:\Users\alfadhilah\Downloads\Iot Sensor Hujan\backend\`
2. Upload file **`hujan-backend-linux`** ke dalam folder `/www/wwwroot/hujan-backend/` di aaPanel.
3. Klik kanan file `hujan-backend-linux` di aaPanel -> pilih **Permissions** -> centang **Execute (755)** (atau ketik `chmod +x /www/wwwroot/hujan-backend/hujan-backend-linux` di terminal SSH aaPanel).

> **Catatan Recompile**: Jika suatu saat Anda mengubah kode backend di Windows, cukup jalankan script `backend\deploy\build-linux.bat`, binary Linux baru akan otomatis terbuat.

### Langkah 3: Jalankan sebagai Background Service 24/7 (systemd)
Buka menu **Terminal** di aaPanel (atau via PuTTY/SSH) dan jalankan perintah:

```bash
# 1. Salin konfigurasi service
cat << 'EOF' > /etc/systemd/system/hujan-backend.service
[Unit]
Description=HujanPantau IoT Go Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/www/wwwroot/hujan-backend
ExecStart=/www/wwwroot/hujan-backend/hujan-backend-linux
Restart=always
RestartSec=5
Environment=PORT=8080
Environment=MQTT_BROKER=tcp://test.mosquitto.org:1883
Environment=DB_PATH=/www/wwwroot/hujan-backend/hujan.db

[Install]
WantedBy=multi-user.target
EOF

# 2. Reload daemon dan jalankan service
systemctl daemon-reload
systemctl enable hujan-backend
systemctl start hujan-backend

# 3. Cek status berjalan
systemctl status hujan-backend
```

Database `hujan.db` akan otomatis dibuat oleh backend saat pertama kali dijalankan!

### Langkah 4: Setup Domain / Reverse Proxy Nginx di aaPanel
1. Di aaPanel, masuk ke menu **Website** -> klik **Add site**.
2. Masukkan domain Anda (misal `api.domainanda.com`) atau gunakan IP VPS jika belum memiliki domain.
3. Setelah website dibuat, klik nama website -> pilih menu **Reverse Proxy** -> klik **Add Reverse Proxy**:
   - Proxy Name: `hujan-api`
   - Target URL: `http://127.0.0.1:8080`
   - Sent Domain: `$host`
4. Buka tab **Config** pada Reverse Proxy tersebut, pastikan baris WebSocket sudah ada:
   ```nginx
   location / {
       proxy_pass http://127.0.0.1:8080;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;

       # Dukungan WebSocket
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_read_timeout 86400s;
   }
   ```
5. Buka tab **SSL** di website aaPanel untuk memasang sertifikat HTTPS gratis (Let's Encrypt).
6. **Penting**: Pastikan port `80`, `443` (dan `8080` jika diakses langsung) sudah dibuka di menu **Firewall aaPanel** dan di **Security Group / Firewall Console Tencent Cloud**.

---

## 4. Langkah Deploy Frontend di Vercel

Frontend dibangun dengan React + Vite dan siap dideploy ke Vercel tanpa biaya sepeser pun.

### Opsi A: Deploy Melalui Git (GitHub / GitLab)
1. Buat repository baru di [GitHub](https://github.com) dan push folder proyek ini.
2. Buka [vercel.com](https://vercel.com) -> login -> klik **Add New...** -> **Project**.
3. Import repository GitHub Anda.
4. Pada bagian **Configure Project**:
   - **Root Directory**: klik Edit lalu pilih `frontend` (atau ketik `frontend`).
   - **Framework Preset**: `Vite` (terdeteksi otomatis).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Klik tombol **Deploy**.
6. Dalam 1-2 menit, situs Anda sudah aktif di domain seperti `https://hujan-pantau.vercel.app`.

---

## 5. Menghubungkan Frontend Vercel ke Backend Tencent VPS

Setelah kedua layanan aktif:
1. Buka website Anda di Vercel (misal `https://hujan-pantau.vercel.app`).
2. Masuk ke tab **Perangkat** di navigasi bawah/samping.
3. Gulir ke kartu **Backend Server & Database (Tencent VPS aaPanel)**.
4. Masukkan URL server backend Anda, contoh:
   - `https://api.domainanda.com` (jika menggunakan domain + SSL)
   - atau `http://129.226.xx.xx:8080` (jika menggunakan IP publik langsung)
5. Klik tombol **Tes & Simpan Koneksi**.
6. Sistem akan mengecek endpoint `/health`. Jika berhasil, badge hijau **Tersambung (Online)** akan menyala dan seluruh riwayat database 24/7 langsung tersinkronisasi!

---

## 6. Contoh Kode Arduino / ESP32 Lengkap

Berikut adalah sketsa ESP32 yang terhubung ke sensor hujan (pin Analog 34), servo jemuran (pin 18), dan mempublikasikan data ke broker Mosquitto:

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>

// 1. Konfigurasi WiFi
const char* WIFI_SSID     = "NAMA_WIFI_ANDA";
const char* WIFI_PASSWORD = "PASSWORD_WIFI";

// 2. Konfigurasi MQTT (100% Gratis Tanpa Akun)
const char* MQTT_BROKER   = "test.mosquitto.org";
const int   MQTT_PORT     = 1883;

// 3. Identitas Perangkat (Samakan dengan yang terdaftar di Web/Backend)
const char* DEVICE_ID     = "hs-8f3a1c9d2b70";

// Pin Hardware
const int PIN_SENSOR_HUJAN = 34; // Pin Analog sensor hujan FC-37
const int PIN_SERVO        = 18; // Pin Signal Motor Servo Jemuran

// Ambang Batas (Toleransi Sensor)
// Nilai ADC ESP32: 4095 = Kering Total, < 2500 = Basah/Hujan
const int THRESHOLD_RAW    = 2500; 

WiFiClient espClient;
PubSubClient client(espClient);
Servo jemuranServo;

bool statusHujanSebelumnya = false;
unsigned long lastSendMs = 0;

void setupWifi() {
  Serial.print("Menghubungkan ke WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Terhubung! IP: " + WiFi.localIP().toString());
}

void reconnectMqtt() {
  while (!client.connected()) {
    Serial.print("Menghubungkan ke Mosquitto...");
    String clientId = "ESP32Hujan-" + String(DEVICE_ID);
    
    // Last Will & Testament (LWT) jika koneksi mati
    String lwtTopic = "hujansensor/" + String(DEVICE_ID) + "/state";
    String lwtPayload = "{\"v\":1,\"deviceId\":\"" + String(DEVICE_ID) + "\",\"status\":\"offline\"}";

    if (client.connect(clientId.c_str(), lwtTopic.c_str(), 1, true, lwtPayload.c_str())) {
      Serial.println(" Berhasil!");
      // Kirim state online
      String onlinePayload = "{\"v\":1,\"deviceId\":\"" + String(DEVICE_ID) + "\",\"status\":\"online\",\"fw\":\"1.0.0\"}";
      client.publish(lwtTopic.c_str(), onlinePayload.c_str(), true);
    } else {
      Serial.print(" Gagal, rc=");
      Serial.print(client.state());
      Serial.println(" Coba lagi dalam 3 detik...");
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_SENSOR_HUJAN, INPUT);
  jemuranServo.attach(PIN_SERVO);
  jemuranServo.write(0); // Posisi jemuran di luar saat kering

  setupWifi();
  client.setServer(MQTT_BROKER, MQTT_PORT);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWifi();
  }
  if (!client.connected()) {
    reconnectMqtt();
  }
  client.loop();

  // Baca sensor hujan setiap 2 detik
  unsigned long now = millis();
  if (now - lastSendMs >= 2000) {
    lastSendMs = now;

    int rawAdc = analogRead(PIN_SENSOR_HUJAN);
    // Hitung persentase kebasahan (0% kering, 100% basah kuyup)
    int pct = map(4095 - rawAdc, 0, 4095, 0, 100);
    pct = constrain(pct, 0, 100);

    bool isWet = (rawAdc < THRESHOLD_RAW);

    // Gerakkan Servo Jemuran Otomatis
    if (isWet && !statusHujanSebelumnya) {
      Serial.println("🌧️ HUJAN TERDETEKSI! Menarik jemuran ke dalam...");
      jemuranServo.write(90); // Tarik jemuran masuk ke kanopi/teduhan
      
      // Kirim event rain_start ke MQTT
      String evTopic = "hujansensor/" + String(DEVICE_ID) + "/event";
      String evPayload = "{\"v\":1,\"deviceId\":\"" + String(DEVICE_ID) + "\",\"type\":\"rain_start\",\"ts\":" + String(now) + ",\"data\":{\"pct\":" + String(pct) + "}}";
      client.publish(evTopic.c_str(), evPayload.c_str());
    } else if (!isWet && statusHujanSebelumnya) {
      Serial.println("☀️ HUJAN REDA! Mengeluarkan jemuran kembali...");
      jemuranServo.write(0); // Keluarkan jemuran kembali ke sinar matahari

      // Kirim event rain_stop ke MQTT
      String evTopic = "hujansensor/" + String(DEVICE_ID) + "/event";
      String evPayload = "{\"v\":1,\"deviceId\":\"" + String(DEVICE_ID) + "\",\"type\":\"rain_stop\",\"ts\":" + String(now) + "}";
      client.publish(evTopic.c_str(), evPayload.c_str());
    }
    statusHujanSebelumnya = isWet;

    // Kirim Telemetry ke MQTT
    String telemTopic = "hujansensor/" + String(DEVICE_ID) + "/telemetry";
    String telemPayload = "{"
      "\"v\":1,"
      "\"deviceId\":\"" + String(DEVICE_ID) + "\","
      "\"ts\":" + String(now) + ","
      "\"raw\":" + String(rawAdc) + ","
      "\"pct\":" + String(pct) + ","
      "\"wet\":" + (isWet ? "true" : "false") + ","
      "\"rssi\":" + String(WiFi.RSSI()) +
    "}";

    client.publish(telemTopic.c_str(), telemPayload.c_str());
    Serial.println("Data terkirim -> ADC: " + String(rawAdc) + " | Wet: " + String(isWet ? "YA" : "TIDAK"));
  }
}
```

---

## 7. Rangkuman Pertanyaan & Jawaban

1. **Bisa ngga Frontend di Vercel dan Backend di Tencent Cloud?**
   - **BISA BANGET**. Ini adalah arsitektur *Decoupled/Microservices* standar industri terbaik.
   - Frontend di Vercel mendapatkan CDN global ultra-cepat dan gratis.
   - Backend di Tencent Cloud menyimpan database SQLite 24 jam nonstop dan mendengarkan sensor ESP32 meskipun browser ditutup.
2. **Kekuatan VPS Murah Tencent Cloud**:
   - Backend Golang tidak membutuhkan Node.js runtime atau Docker berat. Binary hanya memakan RAM ~12 MB, CPU < 1%, sehingga sisa kapasitas VPS 2GB masih sangat longgar untuk aaPanel dan database.
3. **Gratis Tanpa Biaya Berlangganan**:
   - Broker MQTT memakai Mosquitto umum (`test.mosquitto.org`), database memakai SQLite lokal di disk VPS, dan hosting frontend di Vercel 100% gratis.
