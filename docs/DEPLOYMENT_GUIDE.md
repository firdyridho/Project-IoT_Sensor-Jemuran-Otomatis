# Panduan Deployment Arsitektur IoT HujanPantau

| Atribut | Keterangan |
| :--- | :--- |
| **Nama Sistem** | HujanPantau Infrastructure & Operations |
| **Versi Dokumen** | 2.0 (Arsitektur VPS Tencent Cloud, Mosquitto & Vercel) |
| **Status** | Aktif / Produksi & Staging |
| **Tanggal Pembaruan** | 2026-10-13 |
| **Dokumen Terkait** | [`PRD.md`](./PRD.md) / [`ERD.md`](./ERD.md) / [`API.md`](./API.md) / [`API_CONTRACT_AGREEMENT.md`](./API_CONTRACT_AGREEMENT.md) |

---

## 1. Arsitektur Infrastruktur dan Server

Sistem HujanPantau memadukan infrastruktur server cloud VPS regional untuk pemrosesan backend dan broker IoT dengan jaringan edge CDN global untuk antarmuka pengguna:

```
[ ESP32 Hardware ] ---> TCP 1883 ---> [ Mosquitto Private Broker ]
                                                | (127.0.0.1)
                                                v
[ Web Vercel SPA ] <--- WSS /ws <--- [ Go Backend (Port 8080/8081) ]
                                                |
                                       +--------+--------+
                                       |                 |
                                       v                 v
                                  [ MySQL 5.7 ]     [ Redis Cache ]
```

---

## 2. Pemisahan Lingkungan: Staging vs Production

Kedua lingkungan beroperasi secara terisolasi pada server yang sama tanpa saling mengganggu, dengan total konsumsi memori gabungan kurang dari 40 MB RAM:

| Parameter | Lingkungan Staging (Uji Coba) | Lingkungan Produksi (Live) |
| :--- | :--- | :--- |
| **Git Branch** | `staging` | `main` |
| **Frontend Vercel** | Vercel Preview Deployments (`staging`) | `https://rintik-self.vercel.app` |
| **Domain API & WSS** | `https://staging-43-133-136-149.sslip.io` | `https://43-133-136-149.sslip.io` |
| **Port Internal VPS** | Port `8080` (HTTP & WebSocket) | Port `8081` (HTTP & WebSocket) |
| **Database MySQL** | `hujan_iot_staging` | `hujan_iot_prod` |
| **MQTT Broker** | `127.0.0.1:1883` (Lokal VPS) | `127.0.0.1:1883` (Lokal VPS) |
| **Service Systemd** | `hujan-backend-staging.service` | `hujan-backend-prod.service` |

---

## 3. Konfigurasi Private Mosquitto MQTT Broker di VPS

Untuk menghilangkan latensi tinggi dan kendala *rate-limiting* pada broker publik luar negeri, broker Mosquitto diinstal langsung pada VPS Tencent Cloud.

### 3.1 Pemasangan dan Konfigurasi Service
1. Pemasangan paket Mosquitto:
   ```bash
   apt-get update -y && apt-get install -y mosquitto mosquitto-clients
   ```
2. Pembuatan berkas konfigurasi listener `/etc/mosquitto/conf.d/default.conf`:
   ```conf
   # Port TCP utama untuk perangkat keras mikrokontroler ESP32
   listener 1883 0.0.0.0
   allow_anonymous true

   # Port WebSocket opsional untuk gateway browser
   listener 9001 0.0.0.0
   protocol websockets
   ```
3. Mengaktifkan dan me-restart service:
   ```bash
   systemctl enable mosquitto
   systemctl restart mosquitto
   ```

### 3.2 Pembukaan Port Firewall (Wajib Dilakukan)
Agar mikrokontroler ESP32 dari jaringan internet eksternal dapat terhubung:
1. **Console Tencent Cloud Lighthouse**:
   * Masuk ke menu **Firewall / Security Group** pada instance `43.133.136.149`.
   * Tambahkan aturan baru (*Add Rule*):
     * Protokol: `TCP`
     * Port: `1883`
     * Sumber (*Source*): `0.0.0.0/0`
     * Kebijakan (*Policy*): `Allow`
2. **Panel aaPanel (Menu Security)**:
   * Masuk ke menu **Security**.
   * Tambahkan port `1883` ke daftar port yang diizinkan (*Add Port*).
3. **Firewall Internal Linux (UFW/Firewalld)**:
   ```bash
   ufw allow 1883/tcp || firewall-cmd --add-port=1883/tcp --permanent && firewall-cmd --reload
   ```

---

## 4. Konfigurasi Backend Golang dan Database di VPS

### 4.1 Pembuatan Database MySQL di aaPanel
1. Buka dashboard aaPanel (`http://43.133.136.149:7800/login`).
2. Masuk ke menu **Database** > **Add Database**:
   * Database Staging:
     * Nama Database: `hujan_iot_staging`
     * Username: `hujan_iot_staging`
     * Password: Buat password aman (catat untuk service systemd)
   * Database Produksi:
     * Nama Database: `hujan_iot_prod`
     * Username: `hujan_iot_prod`
     * Password: Buat password aman (catat untuk service systemd)

### 4.2 Unit Service Systemd Backend
Dua unit service systemd dikonfigurasikan agar berjalan otomatis saat boot:

* **Staging Service** (`/etc/systemd/system/hujan-backend-staging.service`):
  ```ini
  [Unit]
  Description=HujanPantau IoT Go Backend (Staging)
  After=network.target mysql.service mosquitto.service

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
  Environment=MYSQL_USER=hujan_iot_staging
  Environment=MYSQL_PASSWORD=<PASSWORD_STAGING>
  Environment=MYSQL_DATABASE=hujan_iot_staging
  Environment=MYSQL_HOST=127.0.0.1
  Environment=MYSQL_PORT=3306
  Environment=TELEGRAM_BOT_TOKEN=<TOKEN_BOT>
  Environment=TELEGRAM_BOT_USERNAME=Rintik_Iot_Bot

  [Install]
  WantedBy=multi-user.target
  ```

* **Production Service** (`/etc/systemd/system/hujan-backend-prod.service`):
  Gunakan struktur yang sama dengan mengganti `PORT=8081`, direktori `/www/wwwroot/hujan-backend-prod`, dan kredensial database `hujan_iot_prod`.

Aktivasi kedua service:
```bash
systemctl daemon-reload
systemctl enable hujan-backend-staging hujan-backend-prod
systemctl restart hujan-backend-staging hujan-backend-prod
```

### 4.3 Setup Domain dan Reverse Proxy Nginx
1. Buat dua website di menu **Website** aaPanel:
   * Staging: `staging-43-133-136-149.sslip.io`
   * Produksi: `43-133-136-149.sslip.io`
2. Pasang sertifikat SSL Let's Encrypt dan aktifkan Force HTTPS.
3. Konfigurasi Reverse Proxy Nginx dengan header WebSocket upgrade:
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
2. Buat proyek baru dengan memilih repositori ini.
3. Atur konfigurasi build:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Routing SPA diatur otomatis melalui berkas `frontend/vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
5. Domain produksi otomatis dialokasikan ke `https://rintik-self.vercel.app/`.

---

## 6. Otomasi CI/CD via GitHub Actions

Pipeline CI/CD dikelola secara terpusat pada berkas `.github/workflows/deploy.yml`.

### 6.1 Rahasia Repositori (GitHub Secrets)
Pastikan nilai rahasia berikut telah dikonfigurasikan pada **Settings** > **Secrets and variables** > **Actions**:
* `VPS_HOST`: `43.133.136.149`
* `VPS_USERNAME`: `root`
* `VPS_PASSWORD`: Password login SSH VPS Anda
* `TELEGRAM_BOT_TOKEN`: Token bot Telegram resmi

### 6.2 Alur Eksekusi Otomatis
1. **Validasi Frontend**: Menjalankan pengecekan tipe data TypeScript (`npm run typecheck`) dan kompilasi build produksi.
2. **Kompilasi Backend Go**: Mengompilasi source code Golang menjadi binary Linux AMD64 (`GOOS=linux GOARCH=amd64 go build -o hujan-backend-linux .`).
3. **Transfer SCP Aman**: Mengirimkan binary executable ke direktori VPS yang sesuai.
4. **Provisioning Otomatis**: Memastikan Mosquitto broker terpasang, mengonfigurasi listener 1883, memperbarui unit systemd, dan me-restart service backend.

---

## 7. Verifikasi Pasca Deployment

Setelah alur CI/CD selesai dieksekusi:
1. **Uji Kesehatan Backend**:
   ```bash
   curl -i https://staging-43-133-136-149.sslip.io/health
   ```
   *Ekspektasi*: HTTP 200 OK dengan payload `{"app":"HujanPantau-Backend","status":"healthy"}`.
2. **Uji Port MQTT 1883**:
   ```powershell
   Test-NetConnection -ComputerName 43.133.136.149 -Port 1883
   ```
   *Ekspektasi*: `TcpTestSucceeded : True`.
3. **Uji Dashboard Web**:
   Buka `https://rintik-self.vercel.app/`, periksa status koneksi WebSocket dan kartu telemetri.
