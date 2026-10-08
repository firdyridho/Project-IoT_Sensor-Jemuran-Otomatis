---
name: ui-mobile-first
description: Use when creating or editing UI components, layouts, pages, Tailwind classes, color tokens, dark mode, navigation, or responsive behavior in the HujanPantau web app. Defines the mobile-first design system, bottom tab bar to sidebar breakpoint, spacing scale, touch target size, and accessibility rules. Trigger on keywords like komponen UI, Tailwind, tema gelap, dark mode, responsif, bottom nav, sidebar, warna, desain, styling, CSS.
---

# ui-mobile-first

Standar desain untuk dashboard **HujanPantau**. Tujuannya: bersih, responsif, nyaman dipakai sambil rebahan di HP.

Stack: React + Vite + **Tailwind CSS v4** via `@tailwindcss/vite`. Tidak ada UI library eksternal, komponen ditulis sendiri agar bobot bundle kecil.

## Prinsip

1. **Mobile adalah default.** Tulis gaya untuk 360 px dulu, baru tambahkan layar besar lewat min-width.
2. **Satu aksen.** Warna cerah hanya untuk status dan aksi utama. Sisanya netral.
3. **Satu hero per layar.** Di Dashboard, hero card status adalah elemen terbesar.
4. **Tanpa dekorasi berlebih.** Hindari gradien besar, bayangan tebal, dan ikon dekoratif yang tidak membawa informasi.

## Breakpoint

| Lebar | Navigasi | Catatan |
|---|---|---|
| `< 768 px` | **Bottom tab bar** 5 menu | default, target utama |
| `768 - 1023 px` | Bottom tab bar, label lebih rapat | tablet |
| `>= 1024 px` | **Sidebar kiri** | label selalu terlihat |

Tailwind v4 memakai breakpoint bawaan: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.

```tsx
<nav className="fixed inset-x-0 bottom-0 md:hidden">...</nav>
<aside className="hidden md:flex md:flex-col md:w-60 lg:w-64">...</aside>
<main className="pb-20 md:pb-0 md:pl-60 lg:pl-64">...</main>
```

`pb-20` di main mencegah konten terakhir tertutup tab bar.

## Safe area (PWA)

```css
padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
```

Wajib untuk bottom tab bar agar tidak tertutup gesture bar iOS. Terapkan juga pada toast.

## Token jarak

Semua jarak kelipatan **4 px**. Jangan pakai nilai bebas seperti `7px`.

| Token Tailwind | px | Penggunaan |
|---|---|---|
| `gap-1`, `p-1` | 4 | ikon dengan label |
| `gap-2`, `p-2` | 8 | paduan rapat |
| `gap-3`, `p-3` | 12 | padding kartu mobile |
| `gap-4`, `p-4` | 16 | padding kartu desktop, jarak antar kartu |
| `gap-6` | 24 | jarak antar bagian |

## Radius

| Elemen | Radius |
|---|---|
| Kartu | `rounded-2xl` (16 px) |
| Tombol | `rounded-xl` (12 px) |
| Badge | `rounded-full` |
| Input | `rounded-lg` (8 px) |

Konsistensi radius lebih penting daripada nilai persisnya.

## Target sentuh

Minimal **44 x 44 px** untuk semua elemen yang bisa ditekan.

```tsx
<button className="min-h-11 min-w-11 p-2">...</button>
```

Termasuk: tab bar, tombol close toast, tombol ganti tema, tombol ekspor. Jangan menyusutkan tombol ikon di bawah 44 px demi estetika.

## Palet status

| Peran | Terang | Gelap |
|---|---|---|
| Kering (default/aksi) | `#2563eb` | `#60a5fa` |
| Hujan | `#0891b2` | `#22d3ee` |
| Offline | `#64748b` | `#94a3b8` |
| Peringatan | `#d97706` | `#fbbf24` |
| Bahaya | `#dc2626` | `#f87171` |
| Sukses | `#16a34a` | `#4ade80` |

Warna status hanya dipakai untuk status, bukan sebagai warna dekoratif. Jangan pakai biru "kering" sebagai warna latar kartu biasa.

## Tema gelap

- Default mengikuti preferensi sistem (`prefers-color-scheme`).
- Pengguna bisa memaksa lewat tombol, pilihannya `light`, `dark`, `system`.
- Simpan di `localStorage` kunci `hujan.settings`, bidang `tema`.

```ts
const tema = settings.tema === 'system'
  ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  : settings.tema;
document.documentElement.dataset.tema = tema;
```

**Jangan terapkan warna gelap lewat filter CSS atau `hue-rotate`.** Nilai kontras jadi tidak terprediksi.

### Kontras wajib

Teks utama minimal **4.5:1**, teks besar (>= 18.66 px bold atau 24 px) minimal **3:1**. Cek kedua tema, bukan hanya terang.

Abu-abu gelap seperti `#94a3b8` pada latar `#0f172a` lolos; `#64748b` pada latar gelap yang sama sering gagal. Uji, jangan asumsikan.

## Komponen dasar

Bangun sendiri, jangan tarik library UI:

| Komponen | Catatan |
|---|---|
| `Card` | `rounded-2xl border p-3 md:p-4` |
| `Button` | varian `primary`, `ghost`, `danger`; minimal `min-h-11` |
| `Badge` | `rounded-full px-2 py-0.5 text-xs` |
| `TabBar` | mobile fixed bottom, desktop jadi sidebar |
| `Sheet` | drawer mobile, `Dialog` untuk desktop |
| `Toast` | fixed bottom di atas tab bar, auto-dismiss 5 detik |
| `EmptyState` | selalu sediakan pesan bila data kosong |
| `Skeleton` | untuk status loading, jangan tampilkan layar kosong |

`clsx` atau `tailwind-merge` boleh dipakai untuk menyusun kelas kondisional.

## Aturan layout mobile

- **Satu kolom.** Jangan pernah membuat dua kolom di bawah 768 px.
- **Kartu tekan ke tepi:** `px-4` di kontainer, bukan memakai lebar penuh tanpa jarak.
- **Scroll vertikal bebas, scroll horizontal dilarang.** Bila tabel tidak muat, ubah jadi daftar kartu.
- **Dropdown jangan menutupi konten.** Untuk pemilih seri/grafik di layar kecil, pakai bottom sheet, bukan dropdown yang terpotong.
- **Nomor besar boleh.** Suhu dan persentase layak jadi `text-3xl` atau `text-4xl`, itu adalah informasi utama.

## Aksesibilitas

- Heading berurutan: satu `h1` per halaman, lalu `h2`, `h3`.
- Semua ikon dekoratif diberi `aria-hidden="true"`. Ikon yang membawa makna butuh `aria-label`.
- Elemen yang berubah status memakai `role="status"` dan `aria-live="polite"` agar pembaca layar memberitahu.
- Status jangan dibedakan **hanya** oleh warna. Selalu sertakan teks atau ikon (`Hujan`, `Offline`).
- Fokus terlihat: jangan menghapus outline tanpa mengganti dengan gaya fokus yang jelas.
- Navigasi keyboard harus bisa mencapai semua tab dan tombol.

## Konsistensi data

Aturan tampilan angka agar UI tidak menipu:

| Situasi | Tampilan |
|---|---|
| Tidak ada data | `—` (tanda hubung), **bukan** `0` |
| Data `null` dari firmware | `—` |
| Data `0` sungguhan | `0` |
| Memuat | Skeleton, bukan `0` |
| Perangkat offline | Tandai nilai sebagai basi, jangan biarkan terlihat segar |

Pembedaan `null` versus `0` diwajibkan oleh FR-12 di `PRD.md`.

## Checklist sebelum selesai

- [ ] Diuji pada lebar 360 px tanpa scroll horizontal
- [ ] Bottom tab bar tidak menutupi konten terakhir
- [ ] Semua target sentuh >= 44 x 44 px
- [ ] Tema gelap lolos kontras 4.5:1
- [ ] `null` tampil sebagai `—`, bukan `0`
- [ ] Tidak ada `bg-white` / `text-black` hardcoded yang mengabaikan tema
- [ ] Elemen `aria-hidden` pada ikon dekoratif
