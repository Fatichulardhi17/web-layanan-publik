import type { Penduduk, Laporan, Berita, SuratPusat, DonasiKegiatan } from '../types';

export const initialPenduduk: Penduduk[] = [
  {
    id: 'p-1',
    nik: '3301011504850001',
    nama: 'Ahmad Supardi',
    umur: 48,
    jenisKelamin: 'Laki-laki',
    rt: 1,
    alamatRumah: 'Jl. Sakalputung Raya No. 10, RT 01',
    latitude: -6.914600,
    longitude: 107.609600,
    pekerjaan: 'Wiraswasta'
  },
  {
    id: 'p-2',
    nik: '3301015206900002',
    nama: 'Siti Aminah',
    umur: 34,
    jenisKelamin: 'Perempuan',
    rt: 1,
    alamatRumah: 'Gang Melati No. 04, RT 01',
    latitude: -6.914900,
    longitude: 107.609950,
    pekerjaan: 'Guru Honorer'
  },
  {
    id: 'p-3',
    nik: '3301012108780003',
    nama: 'Bambang Prasetyo',
    umur: 46,
    jenisKelamin: 'Laki-laki',
    rt: 2,
    alamatRumah: 'Jl. Kenanga Timur No. 12, RT 02',
    latitude: -6.913800,
    longitude: 107.611200,
    pekerjaan: 'PNS'
  },
  {
    id: 'p-4',
    nik: '3301016503950004',
    nama: 'Dewi Sartika',
    umur: 29,
    jenisKelamin: 'Perempuan',
    rt: 2,
    alamatRumah: 'Komplek Asri No. 07, RT 02',
    latitude: -6.913500,
    longitude: 107.610800,
    pekerjaan: 'Bidan Desa'
  },
  {
    id: 'p-5',
    nik: '3301011102820005',
    nama: 'Hendra Gunawan',
    umur: 42,
    jenisKelamin: 'Laki-laki',
    rt: 3,
    alamatRumah: 'Jl. Sakalputung Baru No. 25, RT 03',
    latitude: -6.915800,
    longitude: 107.608500,
    pekerjaan: 'Pedagang'
  },
  {
    id: 'p-6',
    nik: '3301014407880006',
    nama: 'Rina Marlina',
    umur: 36,
    jenisKelamin: 'Perempuan',
    rt: 3,
    alamatRumah: 'Gang Dahlia No. 02, RT 03',
    latitude: -6.916100,
    longitude: 107.608900,
    pekerjaan: 'Ibu Rumah Tangga'
  },
  {
    id: 'p-7',
    nik: '3301011905750007',
    nama: 'Sugeng Riyadi',
    umur: 49,
    jenisKelamin: 'Laki-laki',
    rt: 4,
    alamatRumah: 'Jl. Swadaya No. 18, RT 04',
    latitude: -6.912500,
    longitude: 107.612400,
    pekerjaan: 'Petani Modern'
  },
  {
    id: 'p-8',
    nik: '3301016809980008',
    nama: 'Nurul Hidayah',
    umur: 26,
    jenisKelamin: 'Perempuan',
    rt: 4,
    alamatRumah: 'Gang Salak No. 09, RT 04',
    latitude: -6.912200,
    longitude: 107.612800,
    pekerjaan: 'Karyawan Swasta'
  },
  {
    id: 'p-9',
    nik: '3301010311800009',
    nama: 'Mulyadi',
    umur: 44,
    jenisKelamin: 'Laki-laki',
    rt: 5,
    alamatRumah: 'Jl. Manggis Hilir No. 03, RT 05',
    latitude: -6.917200,
    longitude: 107.610200,
    pekerjaan: 'Mekanik Bengkel'
  },
  {
    id: 'p-10',
    nik: '3301014201860010',
    nama: 'Tri Wahyuni',
    umur: 38,
    jenisKelamin: 'Perempuan',
    rt: 5,
    alamatRumah: 'Jl. Manggis Hilir No. 15, RT 05',
    latitude: -6.917600,
    longitude: 107.610700,
    pekerjaan: 'Pengrajin Anyaman'
  }
];

export const initialLaporan: Laporan[] = [
  {
    id: 'lap-101',
    judul: 'Lampu Penerangan Jalan Umum Mati di Dekat Pos Ronda',
    kategori: 'Penerangan Jalan',
    pelaporNama: 'Bambang Prasetyo',
    pelaporTelepon: '081234567891',
    rt: 2,
    lokasiSpesifik: 'Pertigaan Gang Kenanga depan Pos Ronda RT 02',
    keluhan: 'Lampu jalan utama sudah mati selama 3 malam berturut-turut. Kondisi pertigaan sangat gelap dan rawan bagi pengendara motor yang lewat pada malam hari.',
    fotoUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
    status: 'menunggu_info_lanjut',
    catatanAdmin: 'Laporan diteruskan ke teknisi PJU desa. Sedang menunggu pengadaan bohlam LED pengganti.',
    createdAt: '2026-10-14 19:30',
    updatedAt: '2026-10-15 08:45'
  },
  {
    id: 'lap-102',
    judul: 'Saluran Drainase Tersumbat Sampah Ranting dan Plastik',
    kategori: 'Kebersihan',
    pelaporNama: 'Siti Aminah',
    pelaporTelepon: '081234567890',
    rt: 1,
    lokasiSpesifik: 'Saluran air sisi barat Jl. Sakalputung Raya No. 04',
    keluhan: 'Saat hujan kemarin sore, air parit meluap hingga bahu jalan karena gorong-gorong tertutup tumpukan ranting bambu dan sampah plastik.',
    fotoUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
    status: 'sudah_dikerjakan',
    catatanAdmin: 'Tim kebersihan desa bersama warga RT 01 telah membersihkan gorong-gorong pada kerja bakti pagi tadi. Aliran air kembali lancar.',
    createdAt: '2026-10-12 16:15',
    updatedAt: '2026-10-13 11:20'
  },
  {
    id: 'lap-103',
    judul: 'Aspal Ambles dan Berlubang di Dekat Jembatan Penghubung',
    kategori: 'Infrastruktur',
    pelaporNama: 'Sugeng Riyadi',
    pelaporTelepon: '081234567895',
    rt: 4,
    lokasiSpesifik: 'Jalan Swadaya 20 meter sebelum jembatan kali kecil RT 04',
    keluhan: 'Ada lubang aspal sedalam 15 cm dengan diameter sekitar 60 cm. Sudah ada 2 pengendara motor yang terperosok saat hujan deras.',
    fotoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
    status: 'belum_dikerjakan',
    catatanAdmin: '',
    createdAt: '2026-10-16 07:45',
    updatedAt: '2026-10-16 07:45'
  }
];

export const initialBerita: Berita[] = [
  {
    id: 'news-1',
    slug: 'musrenbangdes-sakalputung-2027',
    judul: 'Musrenbangdes Sakalputung: Fokus Prioritas Drainase dan Peningkatan Ekonomi UMKM',
    kategori: 'Pembangunan',
    ringkasan: 'Pemerintah Desa Sakalputung bersama perwakilan RT 01 - 05 menggelar Musyawarah Perencanaan Pembangunan Desa tahun anggaran mendatang.',
    konten: 'Bertempat di Balai Pertemuan Desa Sakalputung, rapat koordinasi Musrenbangdes dihadiri oleh ketua RT 01 sampai RT 05, tokoh masyarakat, dan tim pendamping desa. Kesepakatan utama mencakup revitalisasi drainase pencegah banjir serta bantuan permodalan bergulir bagi pengrajin anyaman dan olahan pangan desa.',
    penulis: 'Sekretariat Desa Sakalputung',
    gambarUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    views: 342,
    tanggal: '15 Okt 2026'
  },
  {
    id: 'news-2',
    slug: 'jadwal-posyandu-balita-lansia-oktober',
    judul: 'Jadwal Layanan Posyandu Mawar Balita & Lansia Bulan Oktober',
    kategori: 'Kesehatan',
    ringkasan: 'Pemeriksaan kesehatan gratis, penimbangan balita, dan pemberian vitamin A bagi warga RT 01 hingga RT 05.',
    konten: 'Kader Posyandu Mawar mengumumkan pelaksanaan penimbangan bulanan, imunisasi dasar lengkap, serta konsultasi nutrisi lansia pada hari Selasa mendatang di Pos Sehat RT 03 mulai pukul 08.30 WIB.',
    penulis: 'Kader Posyandu Mawar',
    gambarUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    views: 189,
    tanggal: '13 Okt 2026'
  },
  {
    id: 'news-3',
    slug: 'pelatihan-digital-marketing-umkm-desa',
    judul: 'Pelatihan Pemasaran Digital untuk Produk Kerajinan & Olahan Lokal',
    kategori: 'Sosial',
    ringkasan: 'Mendorong pelaku usaha rumah tangga di desa Sakalputung agar dapat menjangkau pasar nasional melalui platform digital.',
    konten: 'Sebanyak 25 perwakilan pelaku UMKM desa Sakalputung mengikuti lokakarya fotografi produk sederhana menggunakan ponsel cerdas dan pembuatan etalase toko online.',
    penulis: 'Pokja Ekonomi Desa',
    gambarUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    views: 220,
    tanggal: '10 Okt 2026'
  }
];

export const initialSurat: SuratPusat[] = [
  {
    id: 'srt-01',
    nomorSurat: '440/128/Kec.Skl/X/2026',
    instansiPusat: 'Kecamatan Sakalputung / Kemendesa PDTT',
    perihal: 'Jadwal Verifikasi Faktual Penyaluran Bantuan Langsung Tunai (BLT-Dana Desa)',
    tanggalSurat: '14 Oktober 2026',
    ringkasan: 'Diberitahukan kepada seluruh warga penerima manfaat bahwa verifikasi berkas KTP dan KK akan dilaksanakan di aula balai desa pada hari Jumat, 23 Oktober 2026 pukul 09.00 WIB.',
    fileUrl: '#',
    dibagikanOtomatis: true,
    sudahDibaca: false,
    createdAt: '2026-10-15 09:00'
  },
  {
    id: 'srt-02',
    nomorSurat: '470/89/Disdukcapil/2026',
    instansiPusat: 'Dinas Kependudukan dan Pencatatan Sipil',
    perihal: 'Layanan Jemput Bola Perekaman KTP Elektronik & Aktivasi IKD',
    tanggalSurat: '10 Oktober 2026',
    ringkasan: 'Petugas Disdukcapil akan hadir di Desa Sakalputung melayani perekaman KTP pemula (usia 16-17 tahun) dan aktivasi Identitas Kependudukan Digital (IKD) tanpa dipungut biaya.',
    fileUrl: '#',
    dibagikanOtomatis: true,
    sudahDibaca: true,
    createdAt: '2026-10-11 11:30'
  }
];

export const initialDonasi: DonasiKegiatan[] = [
  {
    id: 'don-01',
    slug: 'renovasi-pos-kamling-rt03',
    judul: 'Renovasi Pos Kamling Terpadu & Pengadaan Alat Kentongan RT 03',
    deskripsi: 'Pos kamling RT 03 mengalami kerusakan atap bocor dan dinding lapuk. Penggalangan ini untuk renovasi atap seng, pengecatan ulang, serta penyediaan senter patroli dan perlengkapan P3K lingkungan.',
    targetDana: 3500000,
    terkumpul: 2450000,
    batasWaktu: '30 November 2026',
    status: 'aktif',
    penanggungJawab: 'Bpk. Hendra Gunawan (Ketua RT 03)',
    donatur: [
      {
        id: 'dn-1',
        namaDonatur: 'Hamba Allah',
        isAnonim: true,
        jumlahDonasi: 150000,
        pesanDoa: 'Semoga pos ronda baru membawa ketenangan dan kerukunan warga.',
        metodePembayaran: 'QRIS Sakalputung',
        tanggal: '16 Okt 2026'
      },
      {
        id: 'dn-2',
        namaDonatur: 'Bambang Prasetyo',
        isAnonim: false,
        jumlahDonasi: 300000,
        pesanDoa: 'Semoga segera rampung sebelum musim penghujan lebat.',
        metodePembayaran: 'BCA Virtual Account',
        tanggal: '15 Okt 2026'
      },
      {
        id: 'dn-3',
        namaDonatur: 'Ibu Hj. Aminah',
        isAnonim: false,
        jumlahDonasi: 500000,
        pesanDoa: 'InsyaAllah berkah untuk seluruh masyarakat RT 03.',
        metodePembayaran: 'GoPay',
        tanggal: '14 Okt 2026'
      }
    ]
  },
  {
    id: 'don-02',
    slug: 'timbangan-digital-posyandu-mawar',
    judul: 'Pengadaan Timbangan Digital & Alat Ukur Panjang Badan Balita Posyandu',
    deskripsi: 'Membantu kader Posyandu Mawar mendapatkan timbangan digital akurat dan stadiometer modern untuk deteksi dini stunting pada anak balita desa Sakalputung.',
    targetDana: 2200000,
    terkumpul: 1850000,
    batasWaktu: '15 Desember 2026',
    status: 'aktif',
    penanggungJawab: 'Ibu Dewi Sartika (Bidan Desa)',
    donatur: [
      {
        id: 'dn-4',
        namaDonatur: 'Keluarga Bpk. Sugeng',
        isAnonim: false,
        jumlahDonasi: 250000,
        pesanDoa: 'Demi kesehatan anak cucu kita di desa tercinta.',
        metodePembayaran: 'Mandiri Virtual Account',
        tanggal: '16 Okt 2026'
      }
    ]
  }
];
