-- =============================================================================
-- SEED DATA & DUMMY DATA: DESA SAKALPUTUNG
-- Untuk inisialisasi awal database Supabase
-- =============================================================================

-- Catatan:
-- Akun Admin RT 1-5 dibuat di auth.users melalui Supabase Dashboard / Auth API,
-- atau profil dummy di bawah dapat digunakan untuk development awal.

-- 1. PROFILES DUMMY (Admin RT 1 s/d RT 5 & Contoh Warga)
-- Misal ID uuid tetap untuk testing
INSERT INTO public.profiles (id, email, nama_lengkap, nomor_telepon, umur, rt, rw, alamat_lengkap, latitude, longitude, role, is_profile_completed)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'admin.rt1@sakalputung.desa.id', 'Admin RT 01', '081234567801', 42, 1, '01', 'Jl. Sakalputung Raya No. 01, RT 01 RW 01', -6.914744, 107.609810, 'admin_rt', true),
    ('a0000000-0000-0000-0000-000000000002', 'admin.rt2@sakalputung.desa.id', 'Admin RT 02', '081234567802', 45, 2, '01', 'Jl. Sakalputung Raya No. 15, RT 02 RW 01', -6.915200, 107.610500, 'admin_rt', true),
    ('a0000000-0000-0000-0000-000000000003', 'admin.rt3@sakalputung.desa.id', 'Admin RT 03', '081234567803', 39, 3, '01', 'Jl. Kenanga No. 08, RT 03 RW 01', -6.916100, 107.611200, 'admin_rt', true),
    ('a0000000-0000-0000-0000-000000000004', 'admin.rt4@sakalputung.desa.id', 'Admin RT 04', '081234567804', 50, 4, '01', 'Jl. Melati No. 22, RT 04 RW 01', -6.916800, 107.612000, 'admin_rt', true),
    ('a0000000-0000-0000-0000-000000000005', 'admin.rt5@sakalputung.desa.id', 'Admin RT 05', '081234567805', 47, 5, '01', 'Jl. Mawar No. 05, RT 05 RW 01', -6.917500, 107.612800, 'admin_rt', true),
    ('b0000000-0000-0000-0000-000000000001', 'budi.santoso@gmail.com', 'Budi Santoso', '085712345678', 35, 1, '01', 'Jl. Sakalputung No. 04, RT 01 RW 01', -6.914900, 107.609950, 'warga', true)
ON CONFLICT (id) DO NOTHING;

-- 2. DATA PENDUDUK DUMMY (Master Data Penduduk dengan Titik Maps)
INSERT INTO public.data_penduduk (nik, nama, umur, jenis_kelamin, rt, rw, alamat_rumah, latitude, longitude, status_keluarga, pekerjaan)
VALUES
    ('3301011504850001', 'Ahmad Supardi', 48, 'Laki-laki', 1, '01', 'Jl. Sakalputung Raya No. 10, RT 01', -6.914600, 107.609600, 'Kepala Keluarga', 'Wiraswasta'),
    ('3301012209900002', 'Siti Rahmawati', 34, 'Perempuan', 1, '01', 'Jl. Sakalputung Raya No. 12, RT 01', -6.914800, 107.609750, 'Ibu Rumah Tangga', 'Guru'),
    ('3301011001780003', 'Hendra Wijaya', 46, 'Laki-laki', 2, '01', 'Jl. Sakalputung Raya No. 18, RT 02', -6.915300, 107.610600, 'Kepala Keluarga', 'Pegawai Swasta'),
    ('3301010506020004', 'Dina Kurnia', 22, 'Perempuan', 2, '01', 'Jl. Anggrek No. 03, RT 02', -6.915500, 107.610800, 'Anak', 'Mahasiswa'),
    ('3301011403650005', 'Bambang Sutrisno', 59, 'Laki-laki', 3, '01', 'Jl. Kenanga No. 11, RT 03', -6.916200, 107.611400, 'Kepala Keluarga', 'Petani/Pekebun'),
    ('3301011811880006', 'Joko Prayitno', 36, 'Laki-laki', 4, '01', 'Jl. Melati No. 25, RT 04', -6.916900, 107.612200, 'Kepala Keluarga', 'Pedagang'),
    ('3301012902960007', 'Rina Agustina', 28, 'Perempuan', 5, '01', 'Jl. Mawar No. 09, RT 05', -6.917600, 107.612950, 'Istri', 'Karyawan Swasta')
ON CONFLICT (nik) DO NOTHING;

-- 3. BERITA DESA DUMMY
INSERT INTO public.berita_desa (penulis_id, judul, slug, ringkasan, isi, gambar_cover_url, kategori, is_published)
VALUES
    (
        'a0000000-0000-0000-0000-000000000001',
        'Jadwal Kerja Bakti Massal Sambut Musim Hujan di Desa Sakalputung',
        'kerja-bakti-massal-musim-hujan-sakalputung',
        'Kerja bakti bersama seluruh warga RT 01 hingga RT 05 membersihkan saluran air dan drainase desa.',
        'Dalam rangka mengantisipasi potensi genangan air pada musim penghujan, pengurus RT 01 sampai RT 05 mengimbau seluruh warga untuk berpartisipasi dalam kegiatan kerja bakti serentak pada hari Minggu pukul 07.00 WIB.',
        'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80',
        'Kegiatan',
        TRUE
    ),
    (
        'a0000000-0000-0000-0000-000000000001',
        'Sosialisasi Penggunaan Portal Layanan Mandiri Warga Sakalputung',
        'sosialisasi-portal-layanan-mandiri-warga',
        'Kini warga dapat mengajukan pengaduan, melihat informasi surat, dan berdonasi langsung melalui website.',
        'Pemerintah Desa Sakalputung resmi meluncurkan portal layanan publik berbasis web untuk mempermudah warga dalam berinteraksi dengan pengurus RT secara transparan dan cepat.',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
        'Pengumuman',
        TRUE
    )
ON CONFLICT (slug) DO NOTHING;

-- 4. SURAT DARI PUSAT DUMMY
INSERT INTO public.surat_pusat (admin_id, nomor_surat, asal_instansi, perihal, ringkasan_isi, target_rt, tanggal_surat, bagikan_otomatis)
VALUES
    (
        'a0000000-0000-0000-0000-000000000001',
        '400.1/123/KEMENSOS/2026',
        'Kementerian Sosial RI',
        'Penyaluran Bantuan Pangan Non-Tunai (BPNT) Tahap IV',
        'Diberitahukan kepada seluruh warga Desa Sakalputung penerima manfaat bahwa pengambilan bantuan sembako akan dilaksanakan di Balai Desa mulai tanggal 20 Oktober 2026 membawa KTP dan KK asli.',
        NULL,
        CURRENT_DATE,
        TRUE
    );

-- 5. KEGIATAN DONASI DUMMY
INSERT INTO public.kegiatan_donasi (admin_id, judul_kegiatan, slug, deskripsi, banner_url, target_nominal, nominal_terkumpul, status, tanggal_mulai, tanggal_selesai)
VALUES
    (
        'a0000000-0000-0000-0000-000000000001',
        'Renovasi Pos Kamling dan Pemasangan CCTV RT 01 - RT 05',
        'renovasi-pos-kamling-dan-cctv-desa',
        'Penggalangan dana swadaya warga untuk meningkatkan keamanan lingkungan desa Sakalputung melalui peremajaan pos ronda dan pengadaan kamera pengawas di titik-titik strategis.',
        'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80',
        15000000.00,
        3500000.00,
        'aktif',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days'
    )
ON CONFLICT (slug) DO NOTHING;

-- 6. CONTOH LAPORAN KENDALA DUMMY
INSERT INTO public.laporan_kendala (warga_id, judul, deskripsi, rt, alamat_lokasi, latitude, longitude, foto_url, status)
VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        'Lampu Penerangan Jalan Umum (PJU) Mati di Depan Musholla',
        'Lampu jalan mati sejak 3 hari yang lalu sehingga jalanan gelap saat malam hari dan rawan kecelakaan.',
        1,
        'Depan Musholla Al-Ikhlas, RT 01 RW 01',
        -6.914850,
        107.609900,
        'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
        'belum_dikerjakan'
    );
