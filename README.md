# 🌧️ HujanPantau — Sistem IoT Sensor Hujan & Jemuran Otomatis

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Go](https://img.shields.io/badge/Golang-1.22+-00ADD8?logo=go&logoColor=white)](https://go.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![MQTT](https://img.shields.io/badge/MQTT-Mosquitto-660066?logo=eclipse-mosquitto&logoColor=white)](https://mosquitto.org/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

**HujanPantau** adalah platform *Internet of Things* (IoT) cerdas *end-to-end* untuk mendeteksi hujan secara *realtime*, mengendalikan motor servo penarik jemuran otomatis, mencatat histori cuaca 24/7 ke database MySQL & Redis, dan menampilkan pemantauan interaktif dengan prakiraan cuaca resmi BMKG Indonesia.

---

## 🏛️ Arsitektur Sistem

Sistem ini dirancang dengan arsitektur terpisah (*Decoupled Microservice Architecture*):

```mermaid
graph TD
    subgraph Hardware ["🔌 Hardware Lapangan"]
        ESP32["ESP32 Microcontroller"]
        Sensor["Sensor Hujan FC-37 / MH-RD"]
        Servo["Motor Servo Jemuran"]
        Sensor -->|ADC 0-4095| ESP32
        ESP32 -->|PWM Signal| Servo
    end

    subgraph Broker ["☁️ MQTT Broker (100% Free)"]
        Mosquitto["test.mosquitto.org:1883 (TCP)<br/>wss://test.mosquitto.org:8081 (WSS)"]
    end

    subgraph VPS ["🖥️ Tencent Cloud Lighthouse VPS (aaPanel)"]
        subgraph BackendGo ["⚡ Golang Backend Service"]
            MQTTSub["MQTT Subscriber Worker"]
            GinAPI["Gin REST API & WebSocket Hub"]
        end
        MySQL[("🗄️ MySQL 5.7 Database")]
        Redis[("⚡ Redis In-Memory Cache")]
        Nginx["🌐 Nginx Reverse Proxy (SSL Let's Encrypt)"]

        MQTTSub -->|Simpan 24/7| MySQL
        MQTTSub -->|Cache Status Kilat| Redis
        MQTTSub -->|Broadcast Live| GinAPI
        GinAPI --> Nginx
    end

    subgraph Client ["📱 Client & Cloud Hosting"]
        Vercel["⚡ Vercel (Edge CDN)"]
        WebSPA["💻 React 19 Frontend Dashboard"]
        BMKG["🇮🇩 API Cuaca BMKG Indonesia"]
        Telegram["📲 Notifikasi Telegram Bot"]

        Vercel --> WebSPA
        Nginx -->|WebSocket /ws & REST| WebSPA
        Mosquitto -.->|Direct MQTT Fallback| WebSPA
        WebSPA --> BMKG
        MQTTSub --> Telegram
    end

    ESP32 -->|Publish Telemetry & Event| Mosquitto
    Mosquitto -->|Subscribe| MQTTSub
```

---

## 🔄 Alur Deteksi Hujan & Tarik Jemuran Otomatis

```mermaid
sequenceDiagram
    autonumber
    actor Awan as 🌧️ Cuaca / Tetesan Air
    participant S as Sensor Hujan FC-37
    participant E as ESP32 Microcontroller
    participant M as Motor Servo Jemuran
    participant B as Mosquitto MQTT
    participant G as Golang Backend (VPS)
    participant D as MySQL & Redis
    participant W as Web Frontend (Vercel)
    actor U as 👤 Pengguna

    Awan->>S: Air hujan membasahi sensor
    S->>E: Tegangan ADC turun (< 2500)
    critical Aksi Cepat Hardware
        E->>M: Putar Servo 90° (Tarik jemuran ke dalam)
    end
    E->>B: Publish 'rain_start' & Telemetry (ADC, Pct, Wet=true)
    B->>G: Worker Backend menerima payload
    par Penyimpanan & Cache
        G->>D: Simpan ke MySQL & Update Redis
    and Siaran Realtime
        G->>W: Push WebSocket (/ws)
    end
    W->>U: Muncul Banner Merah, Suara Alarm Audio & Notifikasi Push!
```

---

## ✨ Fitur Utama

- **🌧️ Deteksi Hujan Real-time & Presisi**: Menggunakan sensor FC-37/MH-RD dengan kalibrasi ADC dan proteksi histeresis anti-flicker (*false alarms*).
- **👔 Tarik Jemuran Otomatis**: Motor servo langsung bergerak otomatis di sisi perangkat tanpa ketergantungan internet untuk keselamatan jemuran.
- **⚡ Backend Golang Super Ringan**: Single static binary dengan konsumsi RAM hanya **~15 MB** dan CPU **< 0.5%**, sangat hemat untuk VPS ekonomis.
- **🗄️ Dual Storage (MySQL & Redis)**: Data telemetri dan riwayat hujan tersimpan permanen di **MySQL 5.7**, sementara status terkini di-cache dengan kecepatan mikrodetik di **Redis**.
- **🌐 Frontend Modern di Vercel**: Dibangun dengan **React 19**, **TypeScript**, dan **Tailwind CSS v4**, mendukung Dark/Light Mode, grafik tren interaktif, dan PWA.
- **⛅ Integrasi Cuaca BMKG**: Menampilkan prakiraan cuaca resmi BMKG Indonesia per kecamatan secara *real-time*.
- **🔔 Multi-Channel Alert**: Notifikasi audio darurat, browser Web Push Notification, dan integrasi Bot Telegram.
- **📡 100% Bebas Biaya Langganan**: Menggunakan public broker Eclipse Mosquitto dan hosting Vercel gratis tanpa perlu kartu kredit.

---

## 📁 Struktur Repositori

```
Iot Sensor Hujan/
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD GitHub Actions: validasi & build otomatis
├── backend/                      # Backend Golang
│   ├── database/                 # GORM MySQL & Redis in-memory cache
│   ├── deploy/                   # Systemd service unit & konfigurasi Nginx aaPanel
│   ├── handlers/                 # REST API endpoints & WebSocket Hub
│   ├── models/                   # Struct data (Device, Telemetry, Event)
│   ├── mqtt/                     # Background MQTT subscriber daemon
│   ├── hujan-backend-linux       # Binary Linux siap deploy (~21 MB)
│   ├── go.mod
│   └── main.go
├── frontend/                     # Frontend SPA React
│   ├── src/                      # Komponen React, hooks, dan state manager
│   ├── public/                   # Asset statis, ikon PWA, manifest
│   ├── vercel.json               # Konfigurasi routing SPA & security headers
│   └── package.json
└── docs/
    └── DEPLOYMENT_GUIDE.md       # Panduan instalasi dan deployment lengkap
```

---

## 🚀 Panduan Cepat Menjalankan Lokal

### 1. Jalankan Frontend
```bash
cd frontend
npm install
npm run dev
```
Akses dashboard di browser: `http://localhost:5173`

### 2. Jalankan Backend (Golang)
```bash
cd backend
go run main.go
```
Backend akan aktif di port `:8080`.

---

## 📖 Panduan Deployment Server

Panduan lengkap mengenai cara deploy ke **Vercel** dan VPS **Tencent Cloud Lighthouse (aaPanel)** dengan domain gratis `sslip.io` serta SSL Let's Encrypt tersedia di:
👉 **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)**

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
