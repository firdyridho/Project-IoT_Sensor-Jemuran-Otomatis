# HujanPantau - Sistem Pemantauan Sensor Hujan dan Jemuran Otomatis IoT

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Go](https://img.shields.io/badge/Golang-1.22+-00ADD8?logo=go&logoColor=white)](https://go.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![MQTT](https://img.shields.io/badge/MQTT-Mosquitto-660066?logo=eclipse-mosquitto&logoColor=white)](https://mosquitto.org/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

HujanPantau adalah platform Internet of Things (IoT) cerdas end-to-end yang dirancang untuk mendeteksi intensitas air hujan secara realtime, menggerakkan motor servo penarik jemuran otomatis, mencatat riwayat telemetri ke database relasional dan in-memory cache, serta menyajikan visualisasi data modern yang terintegrasi langsung dengan prakiraan cuaca resmi BMKG Indonesia.

---

## Daftar Lingkungan (Environments)

### 1. Web Frontend (Vercel)
* **Production**: [https://rintik-self.vercel.app/](https://rintik-self.vercel.app/) (Branch: `main`)
* **Staging / Preview**: Vercel Preview Deployments (Dikelola otomatis pada setiap push ke branch `staging`)

### 2. Backend Server & API Gateway
Untuk menjaga integritas server dan mencegah potensi eksploitasi endpoint secara publik, konfigurasi internal host, IP server, port service, serta detail endpoint backend didokumentasikan secara terpisah pada panduan teknis internal:
* Dokumentasi Infrastruktur & Endpoint: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

---

## Arsitektur Sistem

Sistem mengadopsi pola arsitektur modular terdistribusi (Decoupled Microservice Architecture) untuk menjamin keandalan perangkat keras dan ketersediaan layanan web:

```mermaid
graph TD
    subgraph Hardware ["Hardware Lapangan"]
        ESP32["ESP32 Microcontroller"]
        Sensor["Sensor Hujan FC-37 / MH-RD"]
        Servo["Motor Servo Jemuran"]
        Sensor -->|ADC 0-4095| ESP32
        ESP32 -->|PWM Signal| Servo
    end

    subgraph Broker ["MQTT Message Broker"]
        Mosquitto["test.mosquitto.org:1883 TCP<br/>wss://test.mosquitto.org:8081 WSS"]
    end

    subgraph VPS ["Lighthouse VPS Server"]
        subgraph BackendGo ["Golang Backend Service"]
            MQTTSub["MQTT Subscriber Daemon"]
            GinAPI["REST API & WebSocket Hub"]
        end
        MySQL[("MySQL Database")]
        Redis[("Redis In-Memory Cache")]
        Nginx["Nginx Reverse Proxy & SSL"]

        MQTTSub -->|Simpan Riwayat Telemetri| MySQL
        MQTTSub -->|Cache State Terkini| Redis
        MQTTSub -->|Siaran WebSocket| GinAPI
        GinAPI --> Nginx
    end

    subgraph Client ["Client & Layanan Eksternal"]
        Vercel["Vercel Global Edge CDN"]
        WebSPA["React 19 Frontend Dashboard"]
        BMKG["API Cuaca BMKG Indonesia"]
        Telegram["Telegram Bot Alerts"]

        Vercel --> WebSPA
        Nginx -->|WebSocket & REST API| WebSPA
        Mosquitto -.->|Direct MQTT Fallback| WebSPA
        WebSPA --> BMKG
        MQTTSub --> Telegram
    end

    ESP32 -->|Publish Telemetry & Event| Mosquitto
    Mosquitto -->|Subscribe Topic| MQTTSub
```

---

## Diagram Sekuensial Operasional

```mermaid
sequenceDiagram
    autonumber
    actor Cuaca as Curah Hujan / Air
    participant S as Sensor Hujan FC-37
    participant E as ESP32 Microcontroller
    participant M as Motor Servo Jemuran
    participant B as MQTT Broker
    participant G as Golang Backend Service
    participant D as MySQL & Redis Storage
    participant W as React Frontend Web
    actor U as Pengguna

    Cuaca->>S: Air membasahi plat konduktor sensor
    S->>E: Penurunan nilai analog ADC
    critical Pengamanan Hardware Seketika
        E->>M: Aktifkan servo penarik jemuran ke area tertutup
    end
    E->>B: Publikasikan event rain_start dan telemetri
    B->>G: Worker backend mengonsumsi antrean MQTT
    par Persistensi & Sinkronisasi
        G->>D: Simpan log ke MySQL dan perbarui cache Redis
    and Distribusi Realtime
        G->>W: Transmisikan event melalui WebSocket
    end
    W->>U: Tampilkan visualisasi realtime, audio darurat, dan notifikasi sistem
```

---

## Fitur Utama

* **Deteksi Presisi & Proteksi Hardware**: Menggunakan kalibrasi nilai analog ADC dengan logika histeresis untuk mengeliminasi false positive akibat kelembapan tinggi atau tetesan embun pagi.
* **Otonomi Perangkat Keras**: Logika penarikan jemuran dieksekusi langsung di mikrokontroler tanpa bergantung pada ketersediaan koneksi internet demi keselamatan fisik jemuran.
* **Backend Kinerja Tinggi**: Dibangun menggunakan bahasa Go dengan arsitektur non-blocking, konsumsi memori hemat (~15 MB RAM), dan penanganan request berkecepatan tinggi.
* **Penyimpanan Terdistribusi**: Menggabungkan MySQL 5.7 untuk integritas data jangka panjang dan Redis untuk akselerasi akses status perangkat secara in-memory.
* **Antarmuka Responsif & PWA**: Dibangun menggunakan React 19, TypeScript, dan Tailwind CSS dengan dukungan tema Gelap/Terang, visualisasi grafik interaktif, dan kapabilitas Progressive Web App (PWA).
* **Integrasi Data Meteorologi**: Sinkronisasi data cuaca berkala dengan Open Data BMKG Indonesia berdasarkan kode wilayah administratif tingkat kelurahan (ADM4).
* **Alur CI/CD Otomatis**: Integrasi otomatis melalui GitHub Actions untuk kompilasi binary Linux, verifikasi tipe TypeScript, serta deployment berkala ke server staging dan produksi.

---

## Struktur Direktori Repositori

```
Iot Sensor Hujan/
├── .github/
│   └── workflows/
│       └── deploy.yml            # Pipeline CI/CD GitHub Actions
├── backend/                      # Layanan Backend Golang
│   ├── database/                 # Driver MySQL (GORM) dan Redis cache
│   ├── deploy/                   # Service unit systemd dan konfigurasi Nginx
│   ├── handlers/                 # Handler REST API dan WebSocket hub
│   ├── models/                   # Definisi struktur entitas data
│   ├── mqtt/                     # Background worker subscriber MQTT
│   ├── hujan-backend-linux       # Binary executable Linux AMD64
│   ├── go.mod
│   └── main.go
├── frontend/                     # Dashboard SPA React
│   ├── src/                      # Source code aplikasi, hooks, dan state manager
│   ├── public/                   # Asset statis, ikon, dan manifest PWA
│   ├── vercel.json               # Konfigurasi routing SPA dan HTTP security headers
│   └── package.json
└── docs/
    └── DEPLOYMENT_GUIDE.md       # Panduan lengkap deployment infrastruktur server
```

---

## Panduan Instalasi Lokal

### Prasyarat
* Node.js versi 20 atau lebih baru
* Go versi 1.22 atau lebih baru
* Git

### 1. Menjalankan Frontend
```bash
cd frontend
npm install
npm run dev
```
Akses aplikasi melalui browser pada alamat: `http://localhost:5173`

### 2. Menjalankan Backend
```bash
cd backend
go run main.go
```
Layanan backend akan aktif pada port `:8080`.

---

## Dokumentasi Teknis & Manajemen Task

Untuk menjaga alur pengembangan tetap terstruktur dan mempermudah kolaborasi antara Backend Engineer dan Frontend UI/AI:
* **Task Khusus Backend (Golang, Database & AI Engine)**: [docs/BACKEND_TASKS.md](docs/BACKEND_TASKS.md)
* **Task Khusus Frontend (React, UI/UX & Komponen AI)**: [docs/FRONTEND_TASKS.md](docs/FRONTEND_TASKS.md)
* **Spesifikasi REST API & WebSocket Hub**: [docs/API.md](docs/API.md)
* **Struktur Data & Relasi Database (ERD)**: [docs/ERD.md](docs/ERD.md)
* **Panduan Deployment Server & VPS aaPanel**: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

---

## Lisensi

Proyek ini didistribusikan di bawah lisensi [MIT License](LICENSE).
