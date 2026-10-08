# Panduan Lengkap Deploy IoT Sensor Hujan & Jemuran Otomatis (MySQL + CI/CD)

Panduan ini berisi arsitektur lengkap untuk **Frontend (Vercel)**, **Backend (Golang + MySQL di VPS Tencent Cloud aaPanel)**, dan **CI/CD Otomatis via GitHub**.

---

## 1. Arsitektur Folder Proyek & CI/CD

Semua file berada dalam 1 repository GitHub yang rapi (*Monorepo*):

```
Iot Sensor Hujan/
├── .github/
│   └── workflows/
│       └── deploy.yml            <-- CI/CD: Otomatis compile & deploy ke VPS saat git push
├── backend/                      <-- Golang Backend Service
│   ├── database/                 <-- GORM MySQL Driver & Migrasi Skema
│   ├── deploy/
│   │   ├── build-linux.bat       <-- Script kompilasi Linux lokal
│   │   ├── hujan-backend.service <-- Systemd service unit di VPS
│   │   └── nginx-aapanel.conf    <-- Nginx Reverse Proxy + WebSocket (/ws)
│   ├── handlers/                 <-- REST API & Hub WebSocket
│   ├── models/                   <-- Model data (Device, Telemetry, Event)
│   ├── mqtt/                     <-- Subscriber MQTT 24/7 (test.mosquitto.org)
│   ├── hujan-backend-linux       <-- Binary Linux mandiri
│   ├── go.mod
│   └── main.go
├── frontend/                     <-- React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   ├── vercel.json               <-- Routing SPA & Security Header Vercel
│   └── package.json
└── docs/
    └── DEPLOYMENT_GUIDE.md       <-- Panduan ini
```

---

## 2. Arsitektur Terpisah: Staging vs Production

Sistem mendukung pemisahan lingkungan (*Environment Separation*) secara penuh:

| Komponen | 🟡 Staging (Uji Coba) | 🟢 Production (Produksi) |
| :--- | :--- | :--- |
| **Git Branch** | `staging` | `main` |
| **Frontend Vercel** | `https://hujan-pantau-git-staging-xxx.vercel.app` (Preview otomatis) | `https://hujan-pantau.vercel.app` (Live Domain) |
| **Backend Domain** | `https://staging-43-133-136-149.sslip.io` | `https://43-133-136-149.sslip.io` |
| **Port Backend VPS** | Port `8080` | Port `8081` |
| **Database MySQL** | `hujan_iot_staging` | `hujan_iot_prod` |
| **Service Systemd** | `hujan-backend-staging.service` | `hujan-backend-prod.service` |
| **Konsumsi RAM VPS** | ~15 MB RAM | ~15 MB RAM |

*Kedua backend berjalan bersamaan di 1 VPS tanpa saling mengganggu, total RAM hanya ~30 MB!*

---

### A. Apakah Redis Berat di VPS?
* **Jawab:** **SANGAT RINGAN!** Redis hanya memakan RAM sekitar **15 – 25 MB**.
* **Fungsi di IoT:**
  1. **Cache Status Terkini:** Menyimpan status sensor terakhir (*Last Known State*) sehingga web tidak perlu terus-menerus melakukan query berat ke database disk.
  2. **Cache BMKG:** Menyimpan prakiraan cuaca BMKG selama 1–2 jam agar server tidak bolak-balik menembak API BMKG.
* **Cara Install di aaPanel:** Buka **App Store** di aaPanel -> Cari **Redis** -> Klik **Install** (Fast).

### B. Apakah Semua File Di-push ke GitHub?
* **YA**, semua kode di folder `frontend/`, `backend/`, `.github/`, dan `docs/` di-push ke GitHub.
* Yang **TIDAK** di-push (otomatis diabaikan oleh `.gitignore`):
  - `node_modules/` (library frontend)
  - File rahasia berisi password database (`.env`)

---

## 3. Langkah Setup Database MySQL di aaPanel

Setelah paket **LNMP** (Nginx, MySQL 5.7, phpMyAdmin) selesai di-install di aaPanel:

### Langkah 1: Buat Database di aaPanel
1. Buka dashboard **aaPanel** (`http://43.133.136.149:7800/login`).
2. Masuk ke menu **Database** di sebelah kiri.
3. Klik tombol biru **Add Database**:
   - **DBName:** `hujan_iot`
   - **DBType:** `MySQL`
   - **Username:** `hujan_user` (atau biarkan default)
   - **Password:** Catat password yang dibuatkan aaPanel (misal: `Rahasia123!`)
   - **Access Permission:** `Local server` (127.0.0.1)
4. Klik **Submit**.
5. Database `hujan_iot` sudah siap digunakan!

### Langkah 2: Buka phpMyAdmin (Opsional)
* Di menu **Database**, kamu bisa klik tombol **phpMyAdmin** untuk membuka tampilan visual database lewat browser.

---

## 4. Langkah Deploy Backend Golang di VPS

### Langkah 1: Siapkan Folder Aplikasi
Di aaPanel, masuk ke menu **Files** -> buat folder:
`/www/wwwroot/hujan-backend`

### Langkah 2: Upload File Binary
Upload file `hujan-backend-linux` dari folder `backend/` laptop kamu ke `/www/wwwroot/hujan-backend/`.
Beri izin eksekusi:
```bash
chmod +x /www/wwwroot/hujan-backend/hujan-backend-linux
```

### Langkah 3: Konfigurasi Service Systemd dengan MySQL
Buka menu **Terminal** di aaPanel (atau OrcaTerm Tencent) dan jalankan perintah:

```bash
cat << 'EOF' > /etc/systemd/system/hujan-backend.service
[Unit]
Description=HujanPantau IoT Go Backend
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/www/wwwroot/hujan-backend
ExecStart=/www/wwwroot/hujan-backend/hujan-backend-linux
Restart=always
RestartSec=5
Environment=PORT=8080
Environment=MQTT_BROKER=tcp://test.mosquitto.org:1883

# Konfigurasi Database MySQL aaPanel:
Environment=DB_TYPE=mysql
Environment=MYSQL_USER=hujan_user
Environment=MYSQL_PASSWORD=dieBWzRk7si447bZ
Environment=MYSQL_DATABASE=hujan_iot
Environment=MYSQL_HOST=127.0.0.1
Environment=MYSQL_PORT=3306

# Konfigurasi Cache Redis aaPanel:
Environment=REDIS_ADDR=127.0.0.1:6379

[Install]
WantedBy=multi-user.target
EOF

# Reload dan jalankan service
systemctl daemon-reload
systemctl enable hujan-backend
systemctl restart hujan-backend

# Cek status (harus warna hijau 'active running')
systemctl status hujan-backend
```

*Begitu service berjalan, tabel `devices`, `telemetries`, dan `events` otomatis dibuatkan di dalam database MySQL `hujan_iot`!*

### Langkah 4: Setup Domain Gratis & Reverse Proxy Nginx di aaPanel
1. Masuk ke menu **Website** -> **Add site**.
2. Masukkan domain gratis: **`43-133-136-149.sslip.io`**.
3. Di tab **SSL**, pilih **Let's Encrypt** -> centang nama domain -> klik **Apply** -> aktifkan **Force HTTPS**.
4. Klik tab **Reverse Proxy** -> **Add Reverse Proxy**:
   - Name: `hujan-api`
   - Target URL: `http://127.0.0.1:8080`
   - Sent Domain: `$host`
   - Pastikan **Enable cache** tetap **OFF (Mati)**!
   ```nginx
   location / {
       proxy_pass http://127.0.0.1:8080;
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
5. Buka tab **SSL** di website aaPanel -> pilih **Let's Encrypt** -> klik **Apply** untuk SSL gratis.

---

## 5. Langkah Deploy Frontend ke Vercel

1. Push repository ke akun [GitHub](https://github.com) Anda.
2. Buka dashboard [vercel.com](https://vercel.com) -> **Add New...** -> **Project**.
3. Import repo GitHub Anda.
4. Pada form konfigurasi:
   - **Root Directory:** pilih `frontend`
   - **Framework Preset:** `Vite`
5. Klik **Deploy**.
6. Selesai! Web Anda langsung tayang secara global di domain Vercel.

---

## 6. Hubungkan Frontend Vercel ke Backend VPS

1. Buka website Vercel Anda di browser.
2. Masuk ke menu **Perangkat** di navigasi bawah/samping.
3. Di kartu **Backend Server & Database (Tencent VPS aaPanel)**:
   - Masukkan alamat backend Anda (contoh: `https://api.domainkamu.com` atau `http://43.133.136.149:8080`).
   - Klik **Tes & Simpan Koneksi**.
4. Status akan berubah hijau: **Tersambung (Online)**.
5. Seluruh riwayat data sensor dari database MySQL di VPS akan langsung tersinkronisasi 24 jam nonstop ke web frontend!

---

## 7. Setup CI/CD Otomatis (Setiap Git Push Langsung Update)

Dengan file workflow `.github/workflows/deploy.yml`:
* **Frontend**: Vercel secara otomatis mendeteksi setiap kali kamu melakukan `git push` ke GitHub dan langsung memperbarui website secara instan tanpa perlu setting apa pun lagi.
* **Backend**: Menggunakan GitHub Actions via SSH atau Webhook aaPanel untuk memperbarui file binary backend di VPS setiap kali ada pembaruan kode.
