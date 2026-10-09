# Panduan Lengkap Deploy IoT Sensor Hujan dan Jemuran Otomatis

Panduan ini berisi dokumentasi arsitektur dan langkah deployment untuk Frontend (Vercel), Backend (Golang + MySQL di VPS Tencent Cloud aaPanel), dan CI/CD Otomatis via GitHub Actions.

---

## 1. Arsitektur Repositori dan Monorepo

Seluruh komponen aplikasi dikelola dalam satu repositori terstruktur (Monorepo):

```
Iot Sensor Hujan/
├── .github/
│   └── workflows/
│       └── deploy.yml            # Pipeline CI/CD GitHub Actions
├── backend/                      # Service Backend Golang
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
    └── DEPLOYMENT_GUIDE.md       # Panduan infrastruktur server dan deployment
```

---

## 2. Pemisahan Lingkungan: Staging vs Production

Sistem mendukung pemisahan lingkungan kerja secara penuh (Environment Separation) untuk menjamin stabilitas produksi:

| Komponen | Lingkungan Staging (Uji Coba) | Lingkungan Produksi (Live) |
| :--- | :--- | :--- |
| **Git Branch** | `staging` | `main` |
| **Frontend Vercel** | Vercel Preview Deployments (branch `staging`) | [https://rintik-self.vercel.app](https://rintik-self.vercel.app) |
| **Backend Domain** | `https://staging-43-133-136-149.sslip.io` | `https://43-133-136-149.sslip.io` |
| **Port Backend VPS** | Port `8080` | Port `8081` |
| **Database MySQL** | `hujan_iot_staging` | `hujan_iot_prod` |
| **Service Systemd** | `hujan-backend-staging.service` | `hujan-backend-prod.service` |
| **Konsumsi RAM VPS** | ~15 MB RAM | ~15 MB RAM |

Kedua backend berjalan bersamaan di 1 VPS tanpa saling mengganggu, dengan total konsumsi memori gabungan hanya sekitar ~30 MB RAM.

---

### 2.1 Konfigurasi Link Staging Permanen dan Nonaktifkan Akses Request di Vercel

Secara default, Vercel menghasilkan URL unik berbasis hash commit untuk setiap preview deployment dan mengaktifkan proteksi autentikasi (Deployment Protection). Agar link staging tetap permanen dan anggota tim tidak perlu meminta izin atau login setiap kali membuka web:

1. **Membuat Link Staging Permanen (Branch Alias)**:
   * Masuk ke dashboard proyek di Vercel.
   * Buka menu **Settings** > **Domains**.
   * Tambahkan domain atau subdomain khusus staging, misalnya: `staging-rintik.vercel.app` (atau nama pilihan lain yang tersedia).
   * Pada kolom **Git Branch**, pilih branch `staging`.
   * Klik **Add**.
   * Sekarang, setiap kali branch `staging` di-push, link tersebut otomatis diperbarui dan URL-nya tidak akan pernah berganti lagi.
   * Sebagai alternatif bawaan Vercel tanpa setting tambahan, Vercel menyediakan URL branch permanen otomatis dengan format:
     `https://<project-name>-git-staging-<username>.vercel.app` (link ini juga tetap dan tidak berganti).

2. **Mematikan Proteksi Request atau Login (Deployment Protection)**:
   * Masuk ke dashboard proyek di Vercel.
   * Buka menu **Settings** > **Deployment Protection**.
   * Pada bagian **Vercel Authentication**, ubah pengaturannya menjadi **Disabled** (Nonaktif).
   * Klik tombol **Save**.
   * Setelah dinonaktifkan, seluruh link preview dan staging dapat langsung dibuka oleh siapa pun tanpa perlu login ke akun Vercel dan tanpa harus mengirim request akses.

---

### Informasi Komponen Pendukung di VPS

#### A. Redis Cache
* Konsumsi RAM: Sangat ringan, berkisar antara 15 sampai 25 MB RAM.
* Fungsi:
  1. Cache Status Terkini: Menyimpan status sensor terakhir (Last Known State) sehingga pembacaan cepat tidak membebani query database disk.
  2. Cache Cuaca BMKG: Menyimpan data respon BMKG selama 1 hingga 2 jam untuk menghindari rate limit API eksternal.
* Instalasi di aaPanel: App Store -> Cari Redis -> Install.

#### B. Pengelolaan File Sensitif
* File yang di-push ke GitHub: Kode backend, frontend, konfigurasi deployment, dan dokumentasi.
* File yang diabaikan (.gitignore): Direktori `node_modules/` dan file kredensial lokal `.env`.

---

## 3. Konfigurasi Database MySQL di aaPanel

Setelah paket LNMP (Nginx, MySQL 5.7, phpMyAdmin) terpasang di aaPanel:

### Langkah Pembuatan Database
1. Buka dashboard aaPanel (`http://43.133.136.149:7800/login`).
2. Masuk ke menu **Database** pada bilah navigasi kiri.
3. Klik tombol **Add Database**:
   * **Database Staging**:
     - DBName: `hujan_iot_staging`
     - DBType: `MySQL`
     - Username: `hujan_user`
     - Access Permission: `Local server` (127.0.0.1)
   * **Database Production**:
     - DBName: `hujan_iot_prod`
     - DBType: `MySQL`
     - Username: `hujan_user`
     - Access Permission: `Local server` (127.0.0.1)
4. Klik **Submit**. Seluruh tabel (`devices`, `telemetries`, `events`) akan otomatis diinisialisasi oleh migrasi GORM saat service pertama kali dijalankan.

---

## 4. Konfigurasi Backend Golang di VPS

### Langkah 1: Direktori Aplikasi
Di aaPanel, buka menu **Files** dan pastikan kedua direktori berikut tersedia:
* `/www/wwwroot/hujan-backend-staging`
* `/www/wwwroot/hujan-backend-prod`

### Langkah 2: Pemberian Izin Eksekusi Binary
Pastikan binary memiliki izin eksekusi:
```bash
chmod +x /www/wwwroot/hujan-backend-staging/hujan-backend-linux
chmod +x /www/wwwroot/hujan-backend-prod/hujan-backend-linux
```

### Langkah 3: Konfigurasi Service Systemd

#### Service Staging (`/etc/systemd/system/hujan-backend-staging.service`):
```ini
[Unit]
Description=HujanPantau IoT Go Backend (Staging)
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/www/wwwroot/hujan-backend-staging
ExecStart=/www/wwwroot/hujan-backend-staging/hujan-backend-linux
Restart=always
RestartSec=5
Environment=PORT=8080
Environment=MQTT_BROKER=tcp://127.0.0.1:1883
Environment=DB_TYPE=mysql
Environment=MYSQL_USER=hujan_user
Environment=MYSQL_PASSWORD=dieBWzRk7si447bZ
Environment=MYSQL_DATABASE=hujan_iot_staging
Environment=MYSQL_HOST=127.0.0.1
Environment=MYSQL_PORT=3306
Environment=REDIS_ADDR=127.0.0.1:6379

[Install]
WantedBy=multi-user.target
```

#### Service Production (`/etc/systemd/system/hujan-backend-prod.service`):
```ini
[Unit]
Description=HujanPantau IoT Go Backend (Production)
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/www/wwwroot/hujan-backend-prod
ExecStart=/www/wwwroot/hujan-backend-prod/hujan-backend-linux
Restart=always
RestartSec=5
Environment=PORT=8081
Environment=MQTT_BROKER=tcp://127.0.0.1:1883
Environment=DB_TYPE=mysql
Environment=MYSQL_USER=hujan_user
Environment=MYSQL_PASSWORD=dieBWzRk7si447bZ
Environment=MYSQL_DATABASE=hujan_iot_prod
Environment=MYSQL_HOST=127.0.0.1
Environment=MYSQL_PORT=3306
Environment=REDIS_ADDR=127.0.0.1:6379

[Install]
WantedBy=multi-user.target
```

Aktivasi kedua service:
```bash
systemctl daemon-reload
systemctl enable hujan-backend-staging hujan-backend-prod
systemctl restart hujan-backend-staging hujan-backend-prod
```

### Langkah 4: Setup Domain dan Reverse Proxy Nginx

1. Tambahkan dua situs di menu **Website** aaPanel:
   * Domain Staging: `staging-43-133-136-149.sslip.io`
   * Domain Production: `43-133-136-149.sslip.io`
2. Pasang sertifikat SSL Let's Encrypt dan aktifkan Force HTTPS pada masing-masing situs.
3. Konfigurasikan Reverse Proxy pada masing-masing situs:
   * Untuk Staging: target URL `http://127.0.0.1:8080`
   * Untuk Production: target URL `http://127.0.0.1:8081`

Pastikan proxy Nginx meneruskan header WebSocket:
```nginx
location / {
    proxy_pass http://127.0.0.1:8080; # Ganti 8081 untuk production
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400s;
}
```

---

## 5. Deployment Frontend ke Vercel

1. Hubungkan repositori GitHub ke akun Vercel.
2. Buat project baru dengan memilih repositori ini.
3. Konfigurasi build setting:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Vite`
4. Klik **Deploy**.
5. Lingkungan produksi otomatis dialokasikan ke: `https://rintik-self.vercel.app/`.

---

## 6. Koneksi Otomatis Frontend ke Backend (Invisible Routing)

Frontend mengidentifikasi lingkungan secara transparan (Invisible Routing) tanpa mengharuskan pengguna mengisi URL server secara manual:

1. **Staging Frontend** (domain staging, preview pull request, localhost):
   * Terhubung otomatis ke: `https://staging-43-133-136-149.sslip.io`
   * Menggunakan database: `hujan_iot_staging`
2. **Production Frontend** (`https://rintik-self.vercel.app` atau custom domain produksi):
   * Terhubung otomatis ke: `https://43-133-136-149.sslip.io`
   * Menggunakan database: `hujan_iot_prod`

---

## 7. Setup CI/CD Otomatis Backend ke VPS via GitHub Actions

Agar pembaruan kode backend otomatis dikompilasi dan dikirim ke VPS tanpa intervensi manual:

### Penambahan GitHub Secrets
Masuk ke menu **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret** pada repositori GitHub:
* `VPS_HOST`: `43.133.136.149`
* `VPS_USERNAME`: `root` (atau `ubuntu`)
* `VPS_PASSWORD`: Password SSH VPS Anda (atau isi `VPS_SSH_KEY` jika menggunakan Private Key SSH)

### Mekanisme Deployment Otomatis
* **Push ke branch `staging`**:
  GitHub Actions mengompilasi binary Linux, mentransfer file ke `/www/wwwroot/hujan-backend-staging/hujan-backend-linux`, dan me-restart service `hujan-backend-staging`.
* **Push ke branch `main`**:
  GitHub Actions mengompilasi binary Linux, mentransfer file ke `/www/wwwroot/hujan-backend-prod/hujan-backend-linux`, dan me-restart service `hujan-backend-prod`.
* **Frontend**: Vercel melakukan build dan deployment otomatis setiap kali ada perubahan pada repositori.
