export type RTNumber = 1 | 2 | 3 | 4 | 5;

export type LaporanStatus = 'belum_dikerjakan' | 'menunggu_info_lanjut' | 'sudah_dikerjakan';

export interface UserSession {
  role: 'admin' | 'warga';
  rt?: RTNumber;
  nama: string;
  nomorTelepon?: string;
  umur?: number;
  alamat?: string;
  latitude?: number;
  longitude?: number;
  token?: string;
  username?: string;
}

export interface WargaAccount {
  username: string;
  password: string;
  createdAt: string;
}

export interface Penduduk {
  id: string;
  nik: string;
  nama: string;
  umur: number;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  rt: RTNumber;
  alamatRumah: string;
  latitude: number;
  longitude: number;
  pekerjaan: string;
}

export interface Laporan {
  id: string;
  judul: string;
  kategori: 'Infrastruktur' | 'Kebersihan' | 'Keamanan' | 'Penerangan Jalan' | 'Sosial / Warga';
  pelaporNama: string;
  pelaporTelepon: string;
  rt: RTNumber;
  lokasiSpesifik: string;
  keluhan: string;
  fotoUrl: string;
  status: LaporanStatus;
  catatanAdmin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Berita {
  id: string;
  slug: string;
  judul: string;
  kategori: 'Pembangunan' | 'Kesehatan' | 'Pengumuman' | 'Kegiatan RT' | 'Sosial';
  ringkasan: string;
  konten: string;
  penulis: string;
  gambarUrl: string;
  views: number;
  tanggal: string;
}

export interface SuratPusat {
  id: string;
  nomorSurat: string;
  instansiPusat: string;
  perihal: string;
  tanggalSurat: string;
  ringkasan: string;
  fileUrl?: string;
  dibagikanOtomatis: boolean;
  sudahDibaca?: boolean;
  createdAt: string;
}

export interface DonaturItem {
  id: string;
  namaDonatur: string;
  isAnonim: boolean;
  jumlahDonasi: number;
  pesanDoa: string;
  metodePembayaran: string;
  tanggal: string;
}

export interface DonasiKegiatan {
  id: string;
  slug: string;
  judul: string;
  deskripsi: string;
  targetDana: number;
  terkumpul: number;
  batasWaktu: string;
  status: 'aktif' | 'selesai';
  penanggungJawab: string;
  donatur: DonaturItem[];
}
