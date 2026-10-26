# 🗄️ Dokumentasi Struktur Database - Sakalputung

Dokumentasi ini menjelaskan rancangan skema database untuk web **Layanan Publik Desa Sakalputung** berbasis **Supabase (PostgreSQL)** sesuai spesifikasi di file [ROAD.md](../ROAD.md).

---

## 📌 Gambaran Umum Relasi (Entity Relationship)

```mermaid
erDiagram
    auth_users ||--|| profiles : "1-to-1 account link"
    profiles ||--o{ data_penduduk : "created_by / linked user"
    profiles ||--o{ laporan_kendala : "warga membuat laporan"
    profiles ||--o{ berita_desa : "admin menulis berita"
    profiles ||--o{ surat_pusat : "admin mengunggah surat"
    surat_pusat ||--o{ notifikasi_surat_warga : "dibagikan otomatis"
    profiles ||--o{ notifikasi_surat_warga : "diterima oleh warga"
    profiles ||--o{ kegiatan_donasi : "admin membuat campaign"
    kegiatan_donasi ||--o{ transaksi_donasi : "donasi terkumpul"
    profiles ||--o{ transaksi_donasi : "warga mendonasi (opsional)"

    profiles {
        uuid id PK
        string email
        string nama_lengkap
        string nomor_telepon
        int umur
        int rt
        text alamat_lengkap
        float latitude
        float longitude
        string role
        boolean is_profile_completed
    }

    data_penduduk {
        uuid id PK
        string nik UK
        string nama
        int umur
        int rt
        text alamat_rumah
        float latitude
        float longitude
    }

    laporan_kendala {
        uuid id PK
        uuid warga_id FK
        string judul
        text deskripsi
        int rt
        string foto_url
        enum status
        text catatan_admin
    }

    berita_desa {
        uuid id PK
        uuid penulis_id FK
        string judul
        string slug UK
        text isi
        string gambar_cover_url
        boolean is_published
    }

    surat_pusat {
        uuid id PK
        uuid admin_id FK
        string nomor_surat
        string perihal
        text ringkasan_isi
        string file_dokumen_url
        int target_rt
        boolean bagikan_otomatis
    }

    kegiatan_donasi {
        uuid id PK
        uuid admin_id FK
        string judul_kegiatan
        string slug UK
        numeric target_nominal
        numeric nominal_terkumpul
        int jumlah_donatur
        enum status
    }

    transaksi_donasi {
        uuid id PK
        uuid kegiatan_id FK
        string order_id UK
        string nama_donatur
        boolean is_anonim
        numeric jumlah_donasi
        enum status_pembayaran
        string payment_url
    }
```

---

## 📋 Detail Tabel & Kebutuhan Fitur

### 1. `profiles`
* **Kegunaan**: Menyimpan informasi akun user (Warga dan Admin RT 1-5). Terhubung dengan `auth.users` Supabase.
* **Fitur yang Didukung**:
  * Autentikasi Google / Nomor Telepon (`auth.users`).
  * Onboarding profil awal warga (`is_profile_completed`): nama, umur, RT (1-5), alamat lengkap.
  * Role: `'warga'`, `'admin_rt'`, `'admin_desa'`.
  * Koordinat alamat rumah (`latitude`, `longitude`) untuk pemetaan maps.

### 2. `data_penduduk`
* **Kegunaan**: Master kependudukan desa Sakalputung untuk RT 1 sampai RT 5.
* **Fitur yang Didukung**:
  * Menampilkan data kependudukan desa (nama, umur, RT 1-5).
  * Pemetaan alamat seluruh rumah penduduk melalui Leaflet/Google Maps (`latitude`, `longitude`).

### 3. `laporan_kendala`
* **Kegunaan**: Menyimpan keluhan/pengaduan dari warga desa.
* **Fitur yang Didukung**:
  * Upload foto kendala dan deskripsi keluhan.
  * Status pengerjaan oleh admin:
    1. `belum_dikerjakan`
    2. `menunggu_info_lanjut`
    3. `sudah_dikerjakan`
  * Catatan dan nama admin RT yang merespon.

### 4. `berita_desa`
* **Kegunaan**: Mengelola artikel informasi dan pengumuman desa.
* **Fitur yang Didukung**:
  * Admin menambahkan berita desa (judul, slug, cover image, konten).
  * Ditampilkan pada beranda/halaman warga desa.

### 5. `surat_pusat` & `notifikasi_surat_warga`
* **Kegunaan**: Distribusi informasi surat dari instansi pusat ke warga.
* **Fitur yang Didukung**:
  * Admin menginput surat pusat dan file dokumen/PDF.
  * Trigger otomatis mendistribusikan notifikasi (`bagikan_otomatis`) ke seluruh akun warga di RT terkait.

### 6. `kegiatan_donasi` & `transaksi_donasi`
* **Kegunaan**: Forum penggalangan dana sosial desa dan pencatatan transaksi *payment gateway*.
* **Fitur yang Didukung**:
  * Admin membuka forum kegiatan donasi dengan target nominal.
  * Warga/donatur melakukan pembayaran melalui Payment Gateway (QRIS, VA, E-Wallet).
  * Webhook payment gateway mengupdate status pembayaran (`pending` ➔ `berhasil`).
  * Trigger otomatis mengakumulasikan `nominal_terkumpul` dan `jumlah_donatur`.

---

## 🚀 Cara Import ke Supabase

1. Buka dashboard proyek Anda di **[Supabase Console](https://supabase.com/dashboard)**.
2. Buka menu **SQL Editor** pada sidebar kiri.
3. Buka dan salin seluruh isi file **[schema.sql](./schema.sql)**, lalu klik **Run**.
4. (Opsional) Salin dan jalankan isi file **[seed.sql](./seed.sql)** untuk mengisi data dummy awal (Admin RT 1-5, data kependudukan, berita, kegiatan donasi).

---

## 🪣 Konfigurasi Storage Bucket Supabase

Buat bucket berikut di menu **Storage** Supabase:
1. `laporan-images` (Public/Private dengan Policy): Foto bukti laporan kendala warga.
2. `berita-images` (Public): Gambar banner/cover berita desa.
3. `surat-documents` (Authenticated): File dokumen PDF surat dari pusat.
4. `donasi-banners` (Public): Banner forum kegiatan donasi.
