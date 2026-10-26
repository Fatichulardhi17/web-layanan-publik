-- =============================================================================
-- SISTEM INFORMASI LAYANAN PUBLIK DESA SAKALPUTUNG
-- Database Schema untuk Supabase (PostgreSQL)
-- Sesuai dengan roadmap spesifikasi: ROAD.md
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & CUSTOM TYPES
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('warga', 'admin_rt', 'admin_desa');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_laporan') THEN
        CREATE TYPE status_laporan AS ENUM ('belum_dikerjakan', 'menunggu_info_lanjut', 'sudah_dikerjakan');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_kegiatan_donasi') THEN
        CREATE TYPE status_kegiatan_donasi AS ENUM ('aktif', 'tercapai', 'selesai', 'ditutup');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_transaksi_donasi') THEN
        CREATE TYPE status_transaksi_donasi AS ENUM ('pending', 'berhasil', 'gagal', 'kadaluarsa');
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. TABEL: PROFILES (Akun Pengguna: Warga & Admin RT 1-5 / Admin Desa)
-- Terhubung langsung dengan auth.users Supabase
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    nama_lengkap VARCHAR(150) NOT NULL,
    nomor_telepon VARCHAR(25),
    umur INT CHECK (umur >= 0),
    tanggal_lahir DATE,
    rt INT CHECK (rt BETWEEN 1 AND 5), -- RT 1 sampai RT 5 Sakalputung
    rw VARCHAR(5) DEFAULT '01',
    alamat_lengkap TEXT,
    latitude DOUBLE PRECISION,         -- Titik peta rumah
    longitude DOUBLE PRECISION,        -- Titik peta rumah
    foto_profil TEXT,
    role user_role NOT NULL DEFAULT 'warga',
    is_profile_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Flag onboarding warga
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_rt ON public.profiles(rt);

-- -----------------------------------------------------------------------------
-- 4. TABEL: DATA_PENDUDUK (Master Kependudukan Desa Sakalputung RT 1-5)
-- Menyimpan seluruh data kependudukan desa, titik alamat maps untuk semua warga
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.data_penduduk (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Tautan jika warga sudah terdaftar di aplikasi
    nik VARCHAR(16) UNIQUE,                                        -- Nomor Induk Kependudukan
    nama VARCHAR(150) NOT NULL,
    umur INT NOT NULL CHECK (umur >= 0),
    jenis_kelamin VARCHAR(15) CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
    rt INT NOT NULL CHECK (rt BETWEEN 1 AND 5),                    -- Wilayah RT 1 s/d RT 5
    rw VARCHAR(5) NOT NULL DEFAULT '01',
    alamat_rumah TEXT NOT NULL,                                    -- Alamat fisik rumah
    latitude DOUBLE PRECISION NOT NULL,                            -- Koordinat maps lokasi rumah
    longitude DOUBLE PRECISION NOT NULL,                           -- Koordinat maps lokasi rumah
    status_keluarga VARCHAR(50) DEFAULT 'Kepala Keluarga',         -- Status dalam KK
    pekerjaan VARCHAR(100),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_penduduk_rt ON public.data_penduduk(rt);
CREATE INDEX IF NOT EXISTS idx_penduduk_nama ON public.data_penduduk(nama);

-- -----------------------------------------------------------------------------
-- 5. TABEL: LAPORAN_KENDALA (Pengaduan & Kendala Warga)
-- Fitur: Warga lapor kendala + foto + keluhan, status dikelola admin
-- Status: 'belum_dikerjakan', 'menunggu_info_lanjut', 'sudah_dikerjakan'
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.laporan_kendala (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warga_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    judul VARCHAR(200) NOT NULL,
    deskripsi TEXT NOT NULL,
    rt INT NOT NULL CHECK (rt BETWEEN 1 AND 5),                    -- Wilayah kendala terjadi
    alamat_lokasi TEXT,                                            -- Patokan / detail alamat
    latitude DOUBLE PRECISION,                                     -- Koordinat kendala (opsional)
    longitude DOUBLE PRECISION,
    foto_url TEXT NOT NULL,                                        -- URL foto bukti kendala (Supabase Storage)
    status status_laporan NOT NULL DEFAULT 'belum_dikerjakan',
    catatan_admin TEXT,                                            -- Respon tindak lanjut admin
    ditangani_oleh UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Admin RT yang merespon
    selesai_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laporan_warga ON public.laporan_kendala(warga_id);
CREATE INDEX IF NOT EXISTS idx_laporan_rt ON public.laporan_kendala(rt);
CREATE INDEX IF NOT EXISTS idx_laporan_status ON public.laporan_kendala(status);

-- -----------------------------------------------------------------------------
-- 6. TABEL: BERITA_DESA (Informasi & Berita Seputar Desa Sakalputung)
-- Ditambahkan admin dan ditampilkan ke seluruh pengguna
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.berita_desa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    penulis_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    judul VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    ringkasan TEXT,
    isi TEXT NOT NULL,
    gambar_cover_url TEXT,                                         -- Foto berita
    kategori VARCHAR(50) NOT NULL DEFAULT 'Pengumuman',            -- misal: Pengumuman, Kegiatan, Layanan
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    dilihat_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_berita_slug ON public.berita_desa(slug);
CREATE INDEX IF NOT EXISTS idx_berita_published ON public.berita_desa(is_published, created_at DESC);

-- -----------------------------------------------------------------------------
-- 7. TABEL: SURAT_PUSAT (Surat Masuk dari Pemerintah Pusat)
-- Admin menginput surat dan dibagikan otomatis ke warga
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.surat_pusat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nomor_surat VARCHAR(100) NOT NULL,
    asal_instansi VARCHAR(150) NOT NULL DEFAULT 'Pemerintah Pusat',
    perihal VARCHAR(255) NOT NULL,
    ringkasan_isi TEXT NOT NULL,
    file_dokumen_url TEXT,                                         -- File dokumen (PDF) dari Supabase Storage
    target_rt INT CHECK (target_rt IS NULL OR (target_rt BETWEEN 1 AND 5)), -- NULL = Seluruh RT
    tanggal_surat DATE NOT NULL DEFAULT CURRENT_DATE,
    bagikan_otomatis BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surat_tanggal ON public.surat_pusat(tanggal_surat DESC);

-- -----------------------------------------------------------------------------
-- 8. TABEL: NOTIFIKASI_SURAT_WARGA (Pesan Masuk Surat ke Tiap Warga)
-- Menyimpan record penerimaan kabar surat oleh masing-masing warga
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifikasi_surat_warga (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surat_id UUID NOT NULL REFERENCES public.surat_pusat(id) ON DELETE CASCADE,
    warga_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_dibaca BOOLEAN NOT NULL DEFAULT FALSE,
    dibaca_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_warga ON public.notifikasi_surat_warga(warga_id, is_dibaca);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_surat_warga ON public.notifikasi_surat_warga(surat_id, warga_id);

-- -----------------------------------------------------------------------------
-- 9. TABEL: KEGIATAN_DONASI (Forum Penggalangan Donasi Desa)
-- Admin membuat forum donasi untuk kegiatan desa (cth: HUT RI, perbaikan jalan, santunan)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kegiatan_donasi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    judul_kegiatan VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    deskripsi TEXT NOT NULL,
    banner_url TEXT,
    target_nominal NUMERIC(15, 2) NOT NULL CHECK (target_nominal > 0),
    nominal_terkumpul NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (nominal_terkumpul >= 0),
    jumlah_donatur INT NOT NULL DEFAULT 0 CHECK (jumlah_donatur >= 0),
    status status_kegiatan_donasi NOT NULL DEFAULT 'aktif',
    tanggal_mulai DATE NOT NULL DEFAULT CURRENT_DATE,
    tanggal_selesai DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donasi_status ON public.kegiatan_donasi(status);
CREATE INDEX IF NOT EXISTS idx_donasi_slug ON public.kegiatan_donasi(slug);

-- -----------------------------------------------------------------------------
-- 10. TABEL: TRANSAKSI_DONASI (Transaksi Pembayaran Donasi via Payment Gateway)
-- Warga donasi menggunakan Payment Gateway (Midtrans, Xendit, QRIS, Virtual Account, dll.)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transaksi_donasi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kegiatan_id UUID NOT NULL REFERENCES public.kegiatan_donasi(id) ON DELETE CASCADE,
    warga_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Bisa anonim / tamu
    order_id VARCHAR(100) UNIQUE NOT NULL,                         -- ID unik transaksi payment gateway
    nama_donatur VARCHAR(150) NOT NULL,
    is_anonim BOOLEAN NOT NULL DEFAULT FALSE,                      -- Sembunyikan nama donatur dari publik
    email VARCHAR(150),
    nomor_telepon VARCHAR(25),
    pesan_doa TEXT,                                                -- Doa/dukungan dari donatur
    jumlah_donasi NUMERIC(15, 2) NOT NULL CHECK (jumlah_donasi > 0),
    status_pembayaran status_transaksi_donasi NOT NULL DEFAULT 'pending',
    metode_pembayaran VARCHAR(50),                                 -- 'qris', 'bca_va', 'gopay', dll
    payment_url TEXT,                                              -- URL redirect / Snap token
    payment_gateway_response JSONB,                                -- Data webhook lengkap dari gateway
    dibayar_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaksi_kegiatan ON public.transaksi_donasi(kegiatan_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_order ON public.transaksi_donasi(order_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_status ON public.transaksi_donasi(status_pembayaran);

-- =============================================================================
-- 11. FUNCTIONS & TRIGGERS
-- =============================================================================

-- Fungsi helper untuk auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger updated_at pada semua tabel relevan
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_penduduk_updated_at ON public.data_penduduk;
CREATE TRIGGER trigger_penduduk_updated_at BEFORE UPDATE ON public.data_penduduk
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_laporan_updated_at ON public.laporan_kendala;
CREATE TRIGGER trigger_laporan_updated_at BEFORE UPDATE ON public.laporan_kendala
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_berita_updated_at ON public.berita_desa;
CREATE TRIGGER trigger_berita_updated_at BEFORE UPDATE ON public.berita_desa
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_surat_updated_at ON public.surat_pusat;
CREATE TRIGGER trigger_surat_updated_at BEFORE UPDATE ON public.surat_pusat
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_kegiatan_donasi_updated_at ON public.kegiatan_donasi;
CREATE TRIGGER trigger_kegiatan_donasi_updated_at BEFORE UPDATE ON public.kegiatan_donasi
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_transaksi_donasi_updated_at ON public.transaksi_donasi;
CREATE TRIGGER trigger_transaksi_donasi_updated_at BEFORE UPDATE ON public.transaksi_donasi
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger Supabase Auth: Otomatis buat entri profil saat user register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, nama_lengkap, role, is_profile_completed)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Warga Sakalputung'),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'warga'::public.user_role),
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Otomatis bagikan notifikasi surat pusat ke seluruh warga yang cocok dengan RT
CREATE OR REPLACE FUNCTION public.handle_broadcast_surat_pusat()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bagikan_otomatis = TRUE THEN
        INSERT INTO public.notifikasi_surat_warga (surat_id, warga_id)
        SELECT NEW.id, p.id
        FROM public.profiles p
        WHERE p.role = 'warga'
          AND (NEW.target_rt IS NULL OR p.rt = NEW.target_rt)
        ON CONFLICT (surat_id, warga_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_broadcast_surat ON public.surat_pusat;
CREATE TRIGGER trigger_broadcast_surat
    AFTER INSERT ON public.surat_pusat
    FOR EACH ROW EXECUTE FUNCTION public.handle_broadcast_surat_pusat();

-- Trigger: Otomatis sinkronisasi nominal terkumpul & jumlah donatur ketika pembayaran donasi berhasil
CREATE OR REPLACE FUNCTION public.handle_transaksi_donasi_sukses()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika status berubah menjadi 'berhasil'
    IF (NEW.status_pembayaran = 'berhasil' AND (OLD.status_pembayaran IS NULL OR OLD.status_pembayaran != 'berhasil')) THEN
        UPDATE public.kegiatan_donasi
        SET nominal_terkumpul = nominal_terkumpul + NEW.jumlah_donasi,
            jumlah_donatur = jumlah_donatur + 1,
            status = CASE 
                WHEN (nominal_terkumpul + NEW.jumlah_donasi) >= target_nominal THEN 'tercapai'::status_kegiatan_donasi 
                ELSE status 
            END
        WHERE id = NEW.kegiatan_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_donasi_sukses ON public.transaksi_donasi;
CREATE TRIGGER trigger_sync_donasi_sukses
    AFTER UPDATE ON public.transaksi_donasi
    FOR EACH ROW EXECUTE FUNCTION public.handle_transaksi_donasi_sukses();

-- =============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_penduduk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_kendala ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.berita_desa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat_pusat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifikasi_surat_warga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kegiatan_donasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi_donasi ENABLE ROW LEVEL SECURITY;

-- Helper fungsi cek admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin_rt', 'admin_desa')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies Profiles
CREATE POLICY "Profil dapat dibaca oleh pemiliknya dan admin"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profil dapat diupdate oleh pemiliknya"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Policies Data Penduduk
CREATE POLICY "Data penduduk dapat dibaca oleh admin dan warga terdaftar"
    ON public.data_penduduk FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Hanya admin yang dapat mengelola data penduduk"
    ON public.data_penduduk FOR ALL
    USING (public.is_admin());

-- Policies Laporan Kendala
CREATE POLICY "Warga dapat melihat laporannya sendiri dan admin dapat melihat semua"
    ON public.laporan_kendala FOR SELECT
    USING (auth.uid() = warga_id OR public.is_admin());

CREATE POLICY "Warga terautentikasi dapat membuat laporan"
    ON public.laporan_kendala FOR INSERT
    WITH CHECK (auth.uid() = warga_id);

CREATE POLICY "Admin dapat mengupdate status laporan"
    ON public.laporan_kendala FOR UPDATE
    USING (public.is_admin());

-- Policies Berita Desa
CREATE POLICY "Semua orang dapat membaca berita yang dipublikasi"
    ON public.berita_desa FOR SELECT
    USING (is_published = TRUE OR public.is_admin());

CREATE POLICY "Hanya admin yang dapat mengelola berita"
    ON public.berita_desa FOR ALL
    USING (public.is_admin());

-- Policies Surat Pusat
CREATE POLICY "Warga dan admin dapat melihat surat pusat"
    ON public.surat_pusat FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Hanya admin yang dapat menambah atau mengedit surat"
    ON public.surat_pusat FOR ALL
    USING (public.is_admin());

-- Policies Notifikasi Surat Warga
CREATE POLICY "Warga hanya dapat membaca notifikasinya sendiri"
    ON public.notifikasi_surat_warga FOR SELECT
    USING (auth.uid() = warga_id);

CREATE POLICY "Warga dapat menandai notifikasinya sudah dibaca"
    ON public.notifikasi_surat_warga FOR UPDATE
    USING (auth.uid() = warga_id);

-- Policies Kegiatan Donasi
CREATE POLICY "Semua orang dapat melihat kegiatan donasi"
    ON public.kegiatan_donasi FOR SELECT
    USING (TRUE);

CREATE POLICY "Hanya admin yang dapat membuat atau mengedit forum donasi"
    ON public.kegiatan_donasi FOR ALL
    USING (public.is_admin());

-- Policies Transaksi Donasi
CREATE POLICY "Semua orang dapat melihat donasi publik non-anonim"
    ON public.transaksi_donasi FOR SELECT
    USING (TRUE);

CREATE POLICY "Siapapun dapat melakukan transaksi donasi"
    ON public.transaksi_donasi FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Admin atau webhook payment gateway dapat mengupdate status transaksi"
    ON public.transaksi_donasi FOR UPDATE
    USING (public.is_admin() OR auth.role() = 'service_role');
