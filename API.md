# 📖 Dokumentasi REST API Backend - Sakalputung

Backend Golang menggunakan **Gin Framework**, terintegrasi dengan **Supabase PostgreSQL** dan **Payment Gateway (Midtrans)** sesuai spesifikasi pada [ROAD.md](./ROAD.md).

* **Base URL**: `http://localhost:8080/api`
* **Format Request/Response**: `application/json`
* **Header Autentikasi**: `Authorization: Bearer <token_jwt>`

---

## 📑 Daftar Endpoint

### 1. Autentikasi & Onboarding Profil Warga
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `POST` | `/auth/admin/login` | Login admin RT 1-5 menggunakan nama RT | Publik |
| `GET` | `/auth/me` | Mengambil data profil user yang login | Warga & Admin |
| `POST` / `PUT` | `/auth/onboarding` | Melengkapi profil warga (nama, umur, RT 1-5, alamat, maps) | Warga |

#### Request Login Admin:
```json
POST /api/auth/admin/login
{
  "username": "rt1",
  "password": "adminrt1pass"
}
```
*(Mendukung username: `rt1`, `rt2`, `rt3`, `rt4`, `rt5`)*

#### Request Onboarding Warga:
```json
POST /api/auth/onboarding
{
  "nama_lengkap": "Budi Santoso",
  "umur": 35,
  "rt": 1,
  "nomor_telepon": "081234567890",
  "alamat_lengkap": "Jl. Sakalputung No. 04, RT 01 RW 01",
  "latitude": -6.914900,
  "longitude": 107.609950
}
```

---

### 2. Dashboard Admin
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `GET` | `/admin/dashboard/stats` | Statistik total penduduk, per RT, status laporan, donasi & surat | Admin RT / Desa |

---

### 3. Data Penduduk & Pemetaan Maps (RT 1 - RT 5)
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `GET` | `/penduduk` | List data kependudukan (filter: `?rt=1` & search `?q=nama`) | Auth |
| `GET` | `/penduduk/maps` | Titik koordinat peta (lat, lng, nama, RT, alamat) untuk maps | Auth |
| `POST` | `/penduduk` | Menambah data kependudukan baru | Admin RT / Desa |
| `PUT` | `/penduduk/:id` | Mengubah data kependudukan | Admin RT / Desa |
| `DELETE` | `/penduduk/:id` | Menghapus data kependudukan | Admin RT / Desa |

#### Request Tambah Penduduk:
```json
POST /api/penduduk
{
  "nik": "3301011504850001",
  "nama": "Ahmad Supardi",
  "umur": 48,
  "jenis_kelamin": "Laki-laki",
  "rt": 1,
  "alamat_rumah": "Jl. Sakalputung Raya No. 10, RT 01",
  "latitude": -6.914600,
  "longitude": 107.609600,
  "pekerjaan": "Wiraswasta"
}
```

---

### 4. Laporan / Pengaduan Kendala Warga
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `POST` | `/laporan` | Warga mengirim kendala disertai foto & keluhan | Warga |
| `GET` | `/laporan` | Melihat daftar laporan (Warga: miliknya; Admin: semua/per RT) | Auth |
| `PATCH` | `/laporan/:id/status` | Admin mengelola status laporan warga | Admin RT / Desa |

#### Pilihan Status Laporan:
1. `belum_dikerjakan`
2. `menunggu_info_lanjut`
3. `sudah_dikerjakan`

#### Request Update Status (Admin):
```json
PATCH /api/laporan/{id}/status
{
  "status": "sudah_dikerjakan",
  "catatan_admin": "Petugas telah mengganti bohlam lampu PJU di lokasi."
}
```

---

### 5. Berita Desa
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `GET` | `/berita` | Membaca daftar berita terbaru desa | Publik / Warga |
| `GET` | `/berita/:slug` | Membaca detail isi berita (auto increment views) | Publik / Warga |
| `POST` | `/berita` | Admin mempublikasikan berita baru | Admin RT / Desa |
| `DELETE` | `/berita/:id` | Menghapus artikel berita | Admin RT / Desa |

---

### 6. Surat dari Pusat & Kabar Otomatis
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `POST` | `/surat` | Admin menginput surat pusat & dibagikan otomatis ke warga | Admin RT / Desa |
| `GET` | `/surat` | Arsip seluruh surat masuk dari pusat | Auth |
| `GET` | `/surat/warga` | Kotak masuk pesan kabar surat yang diterima warga | Warga |
| `PATCH` | `/surat/notifikasi/:id/read` | Menandai pesan surat telah dibaca | Warga |

---

### 7. Forum Donasi Kegiatan Desa & Payment Gateway
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `GET` | `/donasi/kegiatan` | Daftar forum donasi aktif desa & persentase dana | Publik / Warga |
| `GET` | `/donasi/kegiatan/:slug` | Detail forum donasi & riwayat donatur | Publik / Warga |
| `POST` | `/donasi/kegiatan` | Admin membuat forum donasi baru | Admin RT / Desa |
| `POST` | `/donasi/bayar` | Warga melakukan donasi via Payment Gateway (QRIS, VA, E-Wallet) | Publik / Warga |
| `POST` | `/donasi/webhook` | Endpoint Webhook Payment Gateway (Midtrans) | Payment Gateway |
| `POST` | `/donasi/simulasi-sukses/:order_id` | Simulasi pembayaran berhasil untuk testing developer | Publik |

#### Request Donasi:
```json
POST /api/donasi/bayar
{
  "kegiatan_id": "c1f7a28e-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "nama_donatur": "Ibu Siti",
  "is_anonim": false,
  "jumlah_donasi": 50000,
  "pesan_doa": "Semoga kegiatan perbaikan pos kamling berjalan lancar."
}
```

---

## 🚀 Cara Menjalankan Backend

1. Salin `.env.example` ke `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Sesuaikan nilai `DATABASE_URL` dengan connection string dari Supabase Anda.
3. Jalankan server:
   ```powershell
   go run main.go
   ```
4. Server akan aktif di port `8080` (Health Check: `http://localhost:8080/api/health`).
