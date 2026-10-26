package models

import (
	"time"

	"github.com/google/uuid"
)

// UserRole mendefinisikan tingkatan hak akses dalam sistem
type UserRole string

const (
	RoleWarga      UserRole = "warga"
	RoleAdminRT    UserRole = "admin_rt"
	RoleAdminDesa  UserRole = "admin_desa"
)

// StatusLaporan mendefinisikan status penanganan keluhan warga
type StatusLaporan string

const (
	StatusBelumDikerjakan     StatusLaporan = "belum_dikerjakan"
	StatusMenungguInfoLanjut  StatusLaporan = "menunggu_info_lanjut"
	StatusSudahDikerjakan     StatusLaporan = "sudah_dikerjakan"
)

// StatusKegiatanDonasi status forum penggalangan dana
type StatusKegiatanDonasi string

const (
	StatusDonasiAktif    StatusKegiatanDonasi = "aktif"
	StatusDonasiTercapai StatusKegiatanDonasi = "tercapai"
	StatusDonasiSelesai  StatusKegiatanDonasi = "selesai"
	StatusDonasiDitutup  StatusKegiatanDonasi = "ditutup"
)

// StatusTransaksiDonasi status pembayaran via payment gateway
type StatusTransaksiDonasi string

const (
	StatusBayarPending    StatusTransaksiDonasi = "pending"
	StatusBayarBerhasil   StatusTransaksiDonasi = "berhasil"
	StatusBayarGagal      StatusTransaksiDonasi = "gagal"
	StatusBayarKadaluarsa StatusTransaksiDonasi = "kadaluarsa"
)

// Profile merepresentasikan profil pengguna (warga & admin)
type Profile struct {
	ID                 uuid.UUID `json:"id" db:"id"`
	Email              *string   `json:"email,omitempty" db:"email"`
	NamaLengkap        string    `json:"nama_lengkap" db:"nama_lengkap"`
	NomorTelepon       *string   `json:"nomor_telepon,omitempty" db:"nomor_telepon"`
	Umur               *int      `json:"umur,omitempty" db:"umur"`
	TanggalLahir       *string   `json:"tanggal_lahir,omitempty" db:"tanggal_lahir"`
	RT                 *int      `json:"rt,omitempty" db:"rt"`
	RW                 string    `json:"rw" db:"rw"`
	AlamatLengkap      *string   `json:"alamat_lengkap,omitempty" db:"alamat_lengkap"`
	Latitude           *float64  `json:"latitude,omitempty" db:"latitude"`
	Longitude          *float64  `json:"longitude,omitempty" db:"longitude"`
	FotoProfil         *string   `json:"foto_profil,omitempty" db:"foto_profil"`
	Role               UserRole  `json:"role" db:"role"`
	IsProfileCompleted bool      `json:"is_profile_completed" db:"is_profile_completed"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

// DataPenduduk master data kependudukan per RT (RT 1-5) dengan titik koordinat peta
type DataPenduduk struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	UserID          *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	NIK             *string    `json:"nik,omitempty" db:"nik"`
	Nama            string     `json:"nama" db:"nama"`
	Umur            int        `json:"umur" db:"umur"`
	JenisKelamin    *string    `json:"jenis_kelamin,omitempty" db:"jenis_kelamin"`
	RT              int        `json:"rt" db:"rt"`
	RW              string     `json:"rw" db:"rw"`
	AlamatRumah     string     `json:"alamat_rumah" db:"alamat_rumah"`
	Latitude        float64    `json:"latitude" db:"latitude"`
	Longitude       float64    `json:"longitude" db:"longitude"`
	StatusKeluarga  string     `json:"status_keluarga" db:"status_keluarga"`
	Pekerjaan       *string    `json:"pekerjaan,omitempty" db:"pekerjaan"`
	CreatedBy       *uuid.UUID `json:"created_by,omitempty" db:"created_by"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
}

// LaporanKendala laporan keluhan/masalah dari warga
type LaporanKendala struct {
	ID            uuid.UUID     `json:"id" db:"id"`
	WargaID       uuid.UUID     `json:"warga_id" db:"warga_id"`
	Warga         *Profile      `json:"warga,omitempty"`
	Judul         string        `json:"judul" db:"judul"`
	Deskripsi     string        `json:"deskripsi" db:"deskripsi"`
	RT            int           `json:"rt" db:"rt"`
	AlamatLokasi  *string       `json:"alamat_lokasi,omitempty" db:"alamat_lokasi"`
	Latitude      *float64      `json:"latitude,omitempty" db:"latitude"`
	Longitude     *float64      `json:"longitude,omitempty" db:"longitude"`
	FotoURL       string        `json:"foto_url" db:"foto_url"`
	Status        StatusLaporan `json:"status" db:"status"`
	CatatanAdmin  *string       `json:"catatan_admin,omitempty" db:"catatan_admin"`
	DitanganiOleh *uuid.UUID    `json:"ditangani_oleh,omitempty" db:"ditangani_oleh"`
	SelesaiAt     *time.Time    `json:"selesai_at,omitempty" db:"selesai_at"`
	CreatedAt     time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at" db:"updated_at"`
}

// BeritaDesa artikel berita atau informasi pengumuman seputar desa
type BeritaDesa struct {
	ID             uuid.UUID `json:"id" db:"id"`
	PenulisID      uuid.UUID `json:"penulis_id" db:"penulis_id"`
	Penulis        *Profile  `json:"penulis,omitempty"`
	Judul          string    `json:"judul" db:"judul"`
	Slug           string    `json:"slug" db:"slug"`
	Ringkasan      *string   `json:"ringkasan,omitempty" db:"ringkasan"`
	Isi            string    `json:"isi" db:"isi"`
	GambarCoverURL *string   `json:"gambar_cover_url,omitempty" db:"gambar_cover_url"`
	Kategori       string    `json:"kategori" db:"kategori"`
	IsPublished    bool      `json:"is_published" db:"is_published"`
	DilihatCount   int       `json:"dilihat_count" db:"dilihat_count"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

// SuratPusat surat edaran atau informasi dari pemerintah pusat
type SuratPusat struct {
	ID              uuid.UUID `json:"id" db:"id"`
	AdminID         uuid.UUID `json:"admin_id" db:"admin_id"`
	NomorSurat      string    `json:"nomor_surat" db:"nomor_surat"`
	AsalInstansi    string    `json:"asal_instansi" db:"asal_instansi"`
	Perihal         string    `json:"perihal" db:"perihal"`
	RingkasanIsi    string    `json:"ringkasan_isi" db:"ringkasan_isi"`
	FileDokumenURL  *string   `json:"file_dokumen_url,omitempty" db:"file_dokumen_url"`
	TargetRT        *int      `json:"target_rt,omitempty" db:"target_rt"`
	TanggalSurat    string    `json:"tanggal_surat" db:"tanggal_surat"`
	BagikanOtomatis bool      `json:"bagikan_otomatis" db:"bagikan_otomatis"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// NotifikasiSuratWarga notifikasi surat yang masuk ke akun warga
type NotifikasiSuratWarga struct {
	ID        uuid.UUID   `json:"id" db:"id"`
	SuratID   uuid.UUID   `json:"surat_id" db:"surat_id"`
	Surat     *SuratPusat `json:"surat,omitempty"`
	WargaID   uuid.UUID   `json:"warga_id" db:"warga_id"`
	IsDibaca  bool        `json:"is_dibaca" db:"is_dibaca"`
	DibacaAt  *time.Time  `json:"dibaca_at,omitempty" db:"dibaca_at"`
	CreatedAt time.Time   `json:"created_at" db:"created_at"`
}

// KegiatanDonasi forum penggalangan dana kegiatan desa
type KegiatanDonasi struct {
	ID               uuid.UUID            `json:"id" db:"id"`
	AdminID          uuid.UUID            `json:"admin_id" db:"admin_id"`
	JudulKegiatan    string               `json:"judul_kegiatan" db:"judul_kegiatan"`
	Slug             string               `json:"slug" db:"slug"`
	Deskripsi        string               `json:"deskripsi" db:"deskripsi"`
	BannerURL        *string              `json:"banner_url,omitempty" db:"banner_url"`
	TargetNominal    float64              `json:"target_nominal" db:"target_nominal"`
	NominalTerkumpul float64              `json:"nominal_terkumpul" db:"nominal_terkumpul"`
	JumlahDonatur    int                  `json:"jumlah_donatur" db:"jumlah_donatur"`
	Status           StatusKegiatanDonasi `json:"status" db:"status"`
	TanggalMulai     string               `json:"tanggal_mulai" db:"tanggal_mulai"`
	TanggalSelesai   *string              `json:"tanggal_selesai,omitempty" db:"tanggal_selesai"`
	CreatedAt        time.Time            `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time            `json:"updated_at" db:"updated_at"`
}

// TransaksiDonasi data pembayaran donasi warga via payment gateway
type TransaksiDonasi struct {
	ID                     uuid.UUID             `json:"id" db:"id"`
	KegiatanID             uuid.UUID             `json:"kegiatan_id" db:"kegiatan_id"`
	Kegiatan               *KegiatanDonasi       `json:"kegiatan,omitempty"`
	WargaID                *uuid.UUID            `json:"warga_id,omitempty" db:"warga_id"`
	OrderID                string                `json:"order_id" db:"order_id"`
	NamaDonatur            string                `json:"nama_donatur" db:"nama_donatur"`
	IsAnonim               bool                  `json:"is_anonim" db:"is_anonim"`
	Email                  *string               `json:"email,omitempty" db:"email"`
	NomorTelepon           *string               `json:"nomor_telepon,omitempty" db:"nomor_telepon"`
	PesanDoa               *string               `json:"pesan_doa,omitempty" db:"pesan_doa"`
	JumlahDonasi           float64               `json:"jumlah_donasi" db:"jumlah_donasi"`
	StatusPembayaran       StatusTransaksiDonasi `json:"status_pembayaran" db:"status_pembayaran"`
	MetodePembayaran       *string               `json:"metode_pembayaran,omitempty" db:"metode_pembayaran"`
	PaymentURL             *string               `json:"payment_url,omitempty" db:"payment_url"`
	PaymentGatewayResponse map[string]any        `json:"payment_gateway_response,omitempty" db:"payment_gateway_response"`
	DibayarAt              *time.Time            `json:"dibayar_at,omitempty" db:"dibayar_at"`
	CreatedAt              time.Time             `json:"created_at" db:"created_at"`
	UpdatedAt              time.Time             `json:"updated_at" db:"updated_at"`
}
