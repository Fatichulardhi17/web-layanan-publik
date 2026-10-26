# Design System Specification: Modern Tactile Minimal (Skillset - Custom Palette)

Dokumentasi spesifikasi desain (`desain.md`) ini diperbarui dengan palet warna khusus sesuai permintaan:

- **Deep Indigo / Slate:** `#464B71` (`rgb(70, 75, 113)`)
- **Ocean Blue:** `#118AB2` (`rgb(17, 138, 178)`)
- **Mint / Soft Teal:** `#7CD5C7` (`rgb(124, 213, 199)`)
- **Warm Light Canvas / Surface:** `#F2F2ED` (`rgb(242, 242, 237)`)

---

## 1. Brand Identity & Overview
- **Sakalputung** Skillset Dashboard
- **Gaya Visual:** Modern Tactile Minimal / Soft Elevated UI
- **Karakter Desain:** Bersih, terstruktur, ramah dengan sudut membulat tinggi (*high rounded corners*), kontras elegan antara latar hangat `#F2F2ED` dengan aksen indigo pekat `#464B71` serta sentuhan ocean blue `#118AB2` dan mint `#7CD5C7`.

---

## 2. Color Palette (Tokens)

### 2.1 Surfaces & Backgrounds
| Token Name | Hex Code / RGB | Penggunaan |
| :--- | :--- | :--- |
| `surface-canvas` | `#F2F2ED` (`rgb(242, 242, 237)`) | Latar belakang kanvas utama aplikasi |
| `surface-container` | `#FFFFFF` | Permukaan kartu utama (Stat cards, Charts, Calendar) |
| `surface-container-low` | `#E8E8E2` | Permukaan sekunder / inner container / filter background |
| `surface-dark-primary` | `#464B71` (`rgb(70, 75, 113)`) | Kartu sorotan utama (*Total Revenue card*), tombol CTA utama, sidebar promo |
| `surface-dark-secondary` | `#373B5A` | Variasi gelap untuk pill aktif atau dropdown |

### 2.2 Text & Typography Colors
| Token Name | Hex Code | Penggunaan |
| :--- | :--- | :--- |
| `text-primary` | `#23263B` / `#1F2232` | Judul utama, angka metrik besar, label aktif |
| `text-secondary` | `#585C74` | Label metrik, subtitle, navigasi samping inaktif |
| `text-muted` | `#8B8FA3` | Placeholder form, tanggal inaktif, ikon sekunder |
| `text-inverse` | `#FFFFFF` | Teks di atas container gelap (`#464B71` atau `#118AB2`) |

### 2.3 Accent & Interactive Tokens
| Token Name | Hex Code / RGB | Penggunaan |
| :--- | :--- | :--- |
| `accent-primary` | `#118AB2` (`rgb(17, 138, 178)`) | Tombol aktif, tab filter terpilih, progress bar, link interaktif |
| `accent-highlight` | `#7CD5C7` (`rgb(124, 213, 199)`) | Indikator positif/pertumbuhan, badge sukses, gauge highlight |
| `accent-neutral-bar` | `#464B71` | Batang grafik aktif/utama |
| `accent-bar-highlight`| `#7CD5C7` | Batang grafik bulan terpilih / sorotan interaktif |
| `status-pill-bg` | `#E2F6F3` / `#118AB2` | Badge status "Paid" atau tag aktif |

---

## 3. Typography Hierarchy

**Font Family Utama:** `Plus Jakarta Sans`, `Inter`, atau sans-serif modern.

| Tingkat Hierarki | Ukuran / Line-Height | Weight | Karakter / Kasus Penggunaan |
| :--- | :--- | :--- | :--- |
| **Display / H1** | 24px / 32px | SemiBold (600) | Judul Halaman (`Dashboard`) |
| **Metric Large** | 22px - 26px / 32px | Bold (700) | Angka metrik (`$23,902`, `16,815`) |
| **Card Header (H2)** | 16px / 24px | SemiBold (600) | Judul Widget (`Total Revenue`, `Course Purchases`) |
| **Body Default** | 14px / 20px | Regular (400) / Medium (500) | Nama murid, nama kursus, filter tab |
| **Caption / Small** | 12px / 16px | Medium (500) | Persentase tren, header tabel, hari kalender |
| **Micro / Subtext** | 11px / 14px | Regular (400) | Sub-keterangan (*from last month*, Student ID) |

---

## 4. Elevation, Radii & Shadows

### 4.1 Border Radius
- `radius-sm`: `8px` — Tombol kecil, badge status, pill tabel.
- `radius-md`: `14px` — Input pencarian, item seleksi kalender aktif.
- `radius-lg`: `20px` - `24px` — Kartu statis, widget bar chart, widget kalender.
- `radius-full`: `9999px` — Avatar, toggle filter (Day / Week / Month / Year).

### 4.2 Shadows & Depth
- **Soft Tactile Card Shadow:**
  `box-shadow: 0 4px 20px -2px rgba(70, 75, 113, 0.06), 0 2px 6px -1px rgba(70, 75, 113, 0.03);`
- **Dark Inverted Card Glow:**
  `box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.2), 0 10px 25px -5px rgba(70, 75, 113, 0.3);`

---

## 5. Component Patterns

- **Pill Filters & Tabs:** Background kontainer `#E8E8E2`, tab aktif menggunakan `#464B71` atau `#118AB2` dengan teks putih.
- **Dark Highlight Card:** Berlatar belakang gradasi halus `#464B71` ke `#373B5A` dengan aksen tren `#7CD5C7`.
- **Chart Bars:** Batang standar `#464B71` dengan aksen bar terpilih menggunakan `#7CD5C7` atau `#118AB2`.
- **Status Badges:** Tag "Paid" dengan warna latar `#E2F6F3` dan teks `#118AB2` atau aksen solid `#464B71`.
