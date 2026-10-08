# Design Tokens

Sumber tunggal untuk warna, jarak, radius, dan tipografi **HujanPantau**. Seluruh komponen mengambil dari sini.

## Warna status

| Token | Peran | Terang | Gelap |
|---|---|---|---|
| `kering` | status aman, aksi utama | `#2563eb` | `#60a5fa` |
| `hujan` | status basah | `#0891b2` | `#22d3ee` |
| `offline` | perangkat tidak tersambung | `#64748b` | `#94a3b8` |
| `peringatan` | baterai lemah, data basi | `#d97706` | `#fbbf24` |
| `bahaya` | galat, aksi destruktif | `#dc2626` | `#f87171` |
| `sukses` | terhubung, tersimpan | `#16a34a` | `#4ade80` |

Warna status dipakai **hanya untuk status**. Jangan memakai `kering` sebagai warna latar kartu biasa.

## Warna netral

| Token | Peran | Terang | Gelap |
|---|---|---|---|
| `latar` | background halaman | `#f8fafc` | `#0f172a` |
| `kartu` | background kartu | `#ffffff` | `#1e293b` |
| `teks-utama` | judul, nilai utama | `#0f172a` | `#f1f5f9` |
| `teks-sekunder` | label, keterangan | `#475569` | `#94a3b8` |
| `garis` | border pemisah | `#e2e8f0` | `#334155` |
| `fokus` | outline fokus keyboard | `#2563eb` | `#60a5fa` |

## Jarak

Semua nilai kelipatan **4 px**. Dilarang memakai nilai bebas di luar skala.

| Nilai | Tailwind | Penggunaan |
|---|---|---|
| 4 px | `1` | ikon-label |
| 8 px | `2` | paduan rapat |
| 12 px | `3` | padding kartu mobile |
| 16 px | `4` | padding kartu desktop, jarak kartu |
| 24 px | `6` | jarak antar bagian halaman |
| 32 px | `8` | jarak bagian besar |

## Radius

| Elemen | Kelas | px |
|---|---|---|
| Kartu | `rounded-2xl` | 16 |
| Tombol | `rounded-xl` | 12 |
| Input | `rounded-lg` | 8 |
| Badge | `rounded-full` | penuh |

## Tipografi

| Peran | Kelas | px |
|---|---|---|
| Nilai besar (suhu, persentase) | `text-3xl md:text-4xl` | 30 / 36 |
| Judul halaman | `text-xl` | 20 |
| Judul kartu | `text-sm font-medium` | 14 |
| Teks isi | `text-sm` | 14 |
| Label, keterangan | `text-xs` | 12 |
| Badge | `text-xs` | 12 |

Seluruh antarmuka memakai **Bahasa Indonesia**. Jangan menambahkan i18n di v1 (lihat `PRD.md` Q5).

## Breakpoint

| Kelas | px | Penggunaan |
|---|---|---|
| default | 360 - 767 | bottom tab bar, satu kolom |
| `sm` | 640 | - |
| `md` | 768 | tablet, label tab lebih rapat |
| `lg` | 1024 | **sidebar kiri** |
| `xl` | 1280 | sidebar + kolom lebih lebar |

| Lebar | Navigasi |
|---|---|
| `< 1024 px` | Bottom tab bar fixed |
| `>= 1024 px` | Sidebar kiri, label terlihat |

## Bayangan

Gunakan sedikit, hanya untuk elemen yang benar-benar terangkat:

| Elemen | Kelas |
|---|---|
| Kartu | `border` saja, **tanpa** bayangan |
| Toast / dialog | `shadow-lg` |
| Tab bar fixed | `border-t` atau `shadow-[0_-1px_0_0_#e2e8f0]` |

Kartu dengan border lebih bersih daripada bayangan tebal, dan konsisten di kedua tema.

## Safe area

Wajib untuk elemen fixed di bawah layar:

```css
padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
```

Terapkan pada:

- Bottom tab bar
- Toast
- Bottom sheet

Tanpa ini, elemen terpotong gesture bar iOS.

## Layout dasar

```tsx
{/* mobile: tab bar */}
<nav className="fixed inset-x-0 bottom-0 z-40 md:hidden
                border-t bg-kartu
                pb-[env(safe-area-inset-bottom)]">
  ...
</nav>

{/* desktop: sidebar */}
<aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:flex-col
                  md:w-60 lg:w-64 md:border-r md:bg-kartu">
  ...
</aside>

<main className="pb-24 md:pb-6 md:pl-60 lg:pl-64">
  <div className="mx-auto max-w-5xl px-4 py-4">
    ...
  </div>
</main>
```

`pb-24` memastikan konten terakhir tidak tertutup tab bar.

## Kontras wajib

| Teks | Minimum |
|---|---|
| Utama | 4.5:1 |
| Besar (>= 24 px atau >= 18.66 px bold) | 3:1 |
| Ikon bermakna | 3:1 |

Uji **kedua tema**. Jangan mengasumsikan nilai yang lolos di tema terang juga lolos di tema gelap.

## Nilai data

| Situasi | Tampilan |
|---|---|
| Tidak ada data / `null` / belum memuat | `—` |
| Data `0` sungguhan | `0` |
| Perangkat offline | nilai ditandai basi |

`null` dan `0` tidak boleh tertukar. Lihat `PRD.md` FR-12.
