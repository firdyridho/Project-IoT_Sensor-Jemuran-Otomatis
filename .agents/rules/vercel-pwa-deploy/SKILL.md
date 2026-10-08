---
name: vercel-pwa-deploy
description: Use when deploying the HujanPantau web app to Vercel, configuring build settings, setting HTTP headers, fixing production build failures, handling the service worker cache, or installing the app as a PWA. Covers Vite SPA deployment, vercel.json, service worker staleness, and PWA install behavior on iOS and Android. Trigger on keywords like deploy Vercel, vercel.json, build gagal, service worker, PWA, manifest, preview, production, deploy error.
---

# vercel-pwa-deploy

Alur deploy **HujanPantau** ke Vercel dan penanganan PWA.

## Fakta penting yang mengubah pendekatan

Aplikasi ini **tidak memakai router berbasis URL**. Navigasi memakai 5 tab internal, bukan path seperti `/dashboard` atau `/cuaca`.

Konsekuensinya:

- **Tidak butuh aturan rewrite SPA** ke `index.html`. Tidak ada path yang harus di-rewrite.
- `vercel.json` cukup berisi header, bukan rewrite.
- Ini juga lebih ramah PWA karena tidak ada routing yang perlu dipulihkan.

> Bila nanti menambahkan `react-router`, tambahkan pula aturan rewrite, atau semua deep link akan 404.

## Konfigurasi Vercel

| Pengaturan | Nilai |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm install` |
| Node version | 18 atau lebih baru |

Tidak ada environment variable yang dibutuhkan. Aplikasi tidak punya secret: token bot hanya ada di firmware, dan API BMKG tidak butuh kunci.

## `vercel.json`

```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(self), microphone=()" }
      ]
    }
  ]
}
```

### Kenapa `sw.js` harus `no-cache`

Vercel meng-cache berkas statis secara agresif. Bila `sw.js` ter-cache, pengguna bisa terjebak pada versi lama **tanpa cara memperbarui**: browser menolak service worker baru karena berkasnya tidak berubah.

Header `no-cache` memaksa browser memeriksa ulang `sw.js` tiap kunjungan. Ini wajib, tanpanya update aplikasi tidak sampai ke pengguna.

`X-Content-Type-Options: nosniff` juga penting karena aplikasi memuat data dari broker publik.

## Perintah

```bash
npm install          # sekali di awal
npm run dev          # pengembangan lokal
npm run lint         # wajib hijau sebelum commit
npm run typecheck    # wajib hijau sebelum commit
npm run build        # cek build lokal sebelum deploy
npx vercel           # deploy preview
npx vercel --prod    # deploy ke production
```

Selalu jalankan `lint` dan `typecheck` sebelum deploy. Build hijau tidak menjamin kode benar.

## Strategi cache service worker

| Jenis berkas | Strategi |
|---|---|
| `index.html` | network first, fallback cache |
| `sw.js` | **selalu dari jaringan** |
| Aset hash (`assets/*.js`) | cache first, immutable |
| Aset runtime (ikon BMKG) | stale while revalidate |

Aset produksi Vite memakai hash di nama berkas (`index-a1b2c3.js`), jadi cache first aman: file lama tidak pernah berubah arti.

**Jangan cache response API** (`api.bmkg.go.id`, `broker.emqx.io`) di service worker. Data realtime harus selalu dari jaringan.

### Masalah klasik: UI tidak pernah berubah

Gejala: kode sudah di-deploy, tapi tampilan pengguna tetap lama.

Penyebab berturut-turut, cek dari yang paling sering:

1. `sw.js` ter-cache (`Cache-Control` salah) - perbaiki header seperti di atas.
2. Pengguna membuka aplikasi dari homescreen yang masih memegang sesi lama - minta tutup dan buka ulang.
3. Build gagal diam-diam dan yang ter-deploy adalah build lama - cek log build.
4. `index.html` di-cache browser biasa - tambahkan meta tag:
   ```html
   <meta http-equiv="Cache-Control" content="no-cache" />
   ```

### Siklus update yang benar

```
build baru --> sw.js baru terdeteksi --> browser tawarkan update
    --> pengguna klik "Perbarui" --> reload --> versi baru aktif
```

Sediakan tombol `Perbarui` yang memanggil `registration.waiting.postMessage({type:'SKIP_WAITING'})` lalu reload. Jangan reload diam-diam, karena bisa memutus tampilan yang sedang dibaca pengguna.

## PWA

### `manifest.webmanifest`

```json
{
  "name": "HujanPantau - Sensor Hujan Jemuran",
  "short_name": "HujanPantau",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0891b2",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Wajib punya ikon **maskable** terpisah. Ikon biasa yang dipaksa maskable akan terpotong di sebagian Android.

### Perilaku per platform

| Platform | Pasang dari browser | Notification API |
|---|---|---|
| Android Chrome | ya | ya |
| iOS Safari 16.4+ | **hanya dari "Tambah ke Layar Utama"** | ya, hanya saat PWA terbuka |
| iOS < 16.4 | ya | **tidak didukung** |
| Desktop Chrome/Edge | ya | ya |

Konsekuensi penting: di iOS, **membuka dari ikon homescreen bukan berarti Notification API aktif**. Pengguna harus menambahkan ke layar utama lewat menu Share Safari.

Notifikasi Telegram menjadi jaring pengaman karena dikirim dari ESP32 dan tidak bergantung pada browser. Lihat `PRD.md` bagian 12.

### Verifikasi PWA

Lighthouse > Application:

- [ ] Manifest terbaca, `display: standalone`
- [ ] Service worker aktif dan mengontrol halaman
- [ ] `sw.js` punya `Cache-Control: no-cache`
- [ ] Lulus installability
- [ ] Ikon maskable tidak terpotong

## Umumnya gagal

| Gejala | Penyebab | Solusi |
|---|---|---|
| Build error, `Cannot find module` | dependensi belum terpasang | `npm install`, commit `package-lock.json` |
| Build error TypeScript | type error tersembunyi | jalankan `npm run typecheck` lokal dulu |
| Halaman kosong di production | error runtime saat hydration | cek console, tambahkan error boundary |
| Aset 404 | `base` path salah di `vite.config.ts` | pastikan `base: '/'` |
| Deploy sukses tapi versi lama | `sw.js` ter-cache | periksa header `Cache-Control` |
| CORS error di production | panggilan dari origin berbeda | BMKG mengizinkan `*`; periksa URL broker (WSS, bukan WS) |
| Koneksi MQTT gagal di production | memakai `ws://` bukan `wss://` | gunakan `wss://` di HTTPS |
| Ikon cuaca tidak tampil | spasi di URL | `encodeURIComponent` - lihat skill `bmkg-weather` |

### Catatan khusus MQTT di production

Situs Vercel berjalan di **HTTPS**, sehingga browser **menolak koneksi `ws://`** sebagai mixed content. Broker **wajib** diakses lewat `wss://`.

```
wss://broker.emqx.io:8884/mqtt     benar
ws://broker.emqx.io:8083/mqtt      akan ditolak browser di production
```

## Checklist sebelum deploy

- [ ] `npm run lint` hijau
- [ ] `npm run typecheck` hijau
- [ ] `npm run build` sukses
- [ ] Diuji pada viewport 360 px
- [ ] `vercel.json` sudah menyertakan `no-cache` untuk `sw.js`
- [ ] Tidak ada secret atau API key tertinggal di berkas frontend
- [ ] Atribusi BMKG tampil (kewajiban, lihat skill `bmkg-weather`)
- [ ] Log build Vercel menunjukkan status Ready, bukan error tersembunyi
