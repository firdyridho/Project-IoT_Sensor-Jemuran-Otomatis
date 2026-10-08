# Troubleshooting Deploy dan PWA

Daftar gejala nyata, penyebab, dan cara memperbaiki. Diurutkan dari yang paling sering ditemui.

## Build gagal

### `Cannot find module 'xxx'`

```bash
npm install
```

Pastikan `package-lock.json` ikut ter-commit. Lock file yang hilang membuat Vercel mengambil versi berbeda dari lokal.

### Type error yang tidak muncul di lokal

Jalankan dulu sebelum deploy:

```bash
npm run typecheck
npm run lint
npm run build
```

Build hijau **tidak** menjamin type check hijau. `vite build` sering tidak mengecek tipe ketat tergantung konfigurasi.

### Build sukses tapi output kosong

| Cek | Nilai benar |
|---|---|
| `vite.config.ts` `build.outDir` | `dist` |
| Vercel output directory | `dist` |
| `base` | `/` |

## Aset 404 di production

Penyebab paling umum: `base` salah di `vite.config.ts`.

```ts
// benar untuk root domain
export default defineConfig({ base: '/' });
```

Bila di-deploy ke subpath (`/app/`), set `base: '/app/'`. Aset yang dirujuk `/xxx.js` tanpa prefix akan 404.

## Halaman kosong di production

Gejala: layar putih, console menunjukkan error runtime.

| Penyebab | Perbaikan |
|---|---|
| Error saat inisialisasi komponen | tambah error boundary di root |
| Akses `localStorage` di module scope | pindahkan ke dalam effect, siapkan fallback |
| Service worker mengembalikan `index.html` untuk aset JS | perbaiki strategi cache, jangan network-first untuk aset hash |
| Variabel lingkungan tidak ada | pastikan tidak ada API key yang dibutuhkan |

Tambahan: akses `localStorage` bisa gagal bila browser dalam mode private atau storage diblokir. Selalu pakai try-catch dengan nilai default.

## Koneksi MQTT gagal di production

### Penyebab 1: mixed content

Situs Vercel memakai HTTPS. Browser **menolak `ws://`** di halaman HTTPS.

```
wss://broker.emqx.io:8884/mqtt     benar
ws://broker.emqx.io:8083/mqtt      ditolak browser
```

### Penyebab 2: port salah

| Broker | Port WSS | Path |
|---|---|---|
| EMQX | 8884 | `/mqtt` |
| HiveMQ | 8884 | `/mqtt` |
| Mosquitto | 8081 | `/mqtt` |

### Penyebab 3: protokol opsi salah di mqtt.js

```ts
mqtt.connect('wss://broker.emqx.io:8884/mqtt', {
  protocol: 'wss',
  clientId: 'web-' + Math.random().toString(16).slice(2, 10),
  reconnectPeriod: 5000,
  connectTimeout: 10000,
});
```

Jangan menyusun URL secara manual bila opsi `protocol` sudah disediakan library.

### Diagnosa

Buka tab Network, filter `WS`. Bila tidak ada baris WebSocket sama sekali, masalahnya di pemanggilan kode. Bila ada tapi status `101` lalu tertutup, periksa payload dan `clientId` duplikat.

`clientId` harus unik. Dua klien dengan ID sama akan saling menendang di sebagian broker.

## Versi UI tidak pernah berubah

Diurutkan dari penyebab paling sering.

### 1. `sw.js` ter-cache

Vercel meng-cache berkas statis. Bila `sw.js` ter-cache, browser tidak pernah melihat versi baru.

Periksa di tab Network berkas `sw.js`. Bila `Cache-Control` bukan `no-cache`, tambahkan di `vercel.json`:

```json
{ "source": "/sw.js", "headers": [{ "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }] }
```

### 2. Service worker menunggu tanpa aktif

Periksa Application > Service Workers. Bila status `waiting`, worker baru sudah diunduh tapi belum mengambil alih.

Solusi: sediakan tombol `Perbarui` yang memanggil `SKIP_WAITING`, lalu reload.

### 3. Browser menolak update otomatis

Chrome menunda update service worker bila tab sudah lama terbuka. Buka aplikasi dalam tab baru, atau tutup semua tab aplikasi lalu buka lagi.

### 4. Cache browser biasa pada `index.html`

Tambahkan:

```html
<meta http-equiv="Cache-Control" content="no-cache" />
```

## Notifikasi tidak muncul

| Platform | Syarat |
|---|---|
| Semua | halaman harus di HTTPS |
| Semua | izin harus `granted` |
| iOS | harus **Add to Home Screen**, bukan dibuka dari tab biasa |
| iOS | minimal versi 16.4 |
| Semua | halaman/PWA harus dalam keadaan terbuka |

### Cara memeriksa izin

```js
const status = await Notification.requestPermission();
console.log(status);   // 'granted' | 'denied' | 'default'
```

- `default` = pengguna belum ditanya
- `denied` = ditolak, dan browser tidak akan menanya ulang tanpa reset lewat pengaturan situs

Bila `denied`, tombol harus menjelaskan cara memulihkan lewat pengaturan browser, bukan terus menekan izin.

### Alternatif

Notifikasi Telegram dikirim langsung dari ESP32 dan tidak bergantung pada browser. Ini jaring pengaman utama, terutama di iOS. Lihat skill `iot-rain-domain`.

## Ikon cuaca tidak tampil

URL ikon dari BMKG mengandung spasi:

```
https://api-apps.bmkg.go.id/storage/icon/cuaca/cerah berawan-am.svg
```

```ts
const safe = raw.replace(/ /g, '%20');
```

Juga tangani `null`. Detail lengkap ada di skill `bmkg-weather`.

## Halaman Cuaca kosong

| Kode HTTP | Penyebab | Tindakan |
|---|---|---|
| 404 | kode `adm4` tidak dikenal | sarankan periksa kode |
| 429 | rate limit 60 per menit | tunggu 60 detik |
| 403 / CORS | jarang terjadi, CORS BMKG terbuka | cek kembali URL |
| 5xx | gangguan BMKG | tampilkan cache lama |

Bila 429 terus terjadi, cek apakah ada loop fetch yang tidak berhenti atau TTL cache tidak berjalan.

## Deploy terlihat sukses tapi runtime error

Cek log Vercel: **Runtime Logs** dan **Build Logs**. Build `Ready` tidak berarti aplikasi berjalan tanpa error.

Untuk error yang hanya muncul di production, tambahkan `error boundary` dan `window.onerror` sementara agar terlihat di console pengguna.

## Verifikasi setelah deploy

- [ ] `npm run lint` dan `npm run typecheck` hijau
- [ ] `npm run build` sukses lokal
- [ ] Log Vercel `Ready`
- [ ] `sw.js` memiliki `Cache-Control: no-cache`
- [ ] Tidak ada request `ws://` di tab Network
- [ ] Atribusi BMKG tampil
- [ ] Diuji di viewport 360 px
- [ ] Tidak ada secret tertinggal di frontend
