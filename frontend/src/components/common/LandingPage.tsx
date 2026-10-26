import React from 'react';
import {
  Building2,
  FileText,
  Megaphone,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  LogIn,
  Users,
  Clock,
  BadgeCheck,
} from 'lucide-react';

interface LandingPageProps {
  onGoToLogin: (mode: 'admin' | 'warga') => void;
}

const benefits = [
  {
    icon: FileText,
    title: 'Pengajuan Surat Digital',
    desc: 'Ajukan surat keterangan domisili, SKCK, dan lainnya langsung dari rumah tanpa antre.',
    color: '#464B71',
  },
  {
    icon: Megaphone,
    title: 'Pengaduan Cepat & Transparan',
    desc: 'Laporkan masalah lingkungan atau fasilitas warga, pantau statusnya hingga selesai.',
    color: '#118AB2',
  },
  {
    icon: Users,
    title: 'Data Kependudukan Terpusat',
    desc: 'Admin RT mengelola data penduduk tiap RT secara rapi dan selalu mutakhir.',
    color: '#06D6A0',
  },
  {
    icon: HeartHandshake,
    title: 'Donasi Kegiatan Warga',
    desc: 'Berpartisipasi dalam donasi kegiatan kampung dengan pembayaran yang mudah.',
    color: '#EF476F',
  },
  {
    icon: MapPin,
    title: 'Peta Interaktif Wilayah',
    desc: 'Lihat peta sebaran warga dan fasilitas desa Sakalputung secara visual.',
    color: '#7CD5C7',
  },
  {
    icon: BadgeCheck,
    title: 'Notifikasi Surat Otomatis',
    desc: 'Surat yang dibagikan otomatis langsung sampai ke kotak masuk warga.',
    color: '#FFD166',
  },
];

const stats = [
  { value: '5', label: 'RT Terhubung' },
  { value: '100%', label: 'Layanan Digital' },
  { value: '< 24j', label: 'Respons Pengaduan' },
  { value: 'Free', label: 'Biaya Akses Warga' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin }) => {
  return (
    <div className="min-h-screen bg-[#F2F2ED] text-[#1F2232]">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-[12px] bg-[#464B71] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#7CD5C7]" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight block leading-tight">
              Sakalputung
            </span>
            <span className="text-[10px] text-[#585C74] font-medium">
              Sistem Layanan Publik Desa
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => onGoToLogin('warga')}
            className="px-3 sm:px-4 py-2 rounded-[12px] text-xs sm:text-sm font-semibold text-[#118AB2] hover:bg-[#E2F6F3]/60 transition-colors"
          >
            Portal Warga
          </button>
          <button
            onClick={() => onGoToLogin('admin')}
            className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-[12px] bg-[#464B71] hover:bg-[#3a3f5e] text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
          >
            <LogIn className="w-3.5 h-3.5 text-[#7CD5C7]" />
            <span className="hidden sm:inline">Login Admin RT</span>
            <span className="sm:hidden">Admin</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-12 text-center">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E8E2] text-[11px] font-semibold text-[#118AB2] mb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-[#7CD5C7]" />
          <span>Aman, gratis, dan mudah digunakan</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight max-w-3xl mx-auto">
          Layanan Publik Desa{' '}
          <span className="text-[#118AB2]">kini dalam genggaman</span> Anda
        </h1>
        <p className="mt-4 text-sm sm:text-base text-[#585C74] max-w-2xl mx-auto leading-relaxed">
          Sakalputung menghubungkan warga RT 01 s/d RT 05 dengan pengurus RT
          dalam satu platform &mdash; surat, pengaduan, berita, dan donasi
          semuanya jadi lebih mudah.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onGoToLogin('warga')}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-[14px] bg-[#464B71] hover:bg-[#3a3f5e] text-white text-sm font-semibold shadow-tactile transition-colors"
          >
            <UserCheck className="w-4 h-4 text-[#7CD5C7]" />
            <span>Masuk sebagai Warga</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onGoToLogin('admin')}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-[14px] bg-white border border-[#E8E8E2] hover:bg-[#E2F6F3]/50 text-sm font-semibold text-[#118AB2] transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Login Admin RT</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-[16px] border border-[#E8E8E2] shadow-tactile px-4 py-4"
            >
              <div className="text-xl sm:text-2xl font-bold text-[#464B71]">
                {s.value}
              </div>
              <div className="text-[11px] text-[#585C74] font-medium mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Keuntungan Menggunakan Sakalputung
          </h2>
          <p className="mt-2 text-sm text-[#585C74]">
            Semua kebutuhan administrasi warga dan pengelolaan RT
            terdigitalisasi.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="bg-white rounded-[20px] border border-[#E8E8E2] shadow-tactile p-6 hover:shadow-lg transition-shadow"
            >
              <div
                className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-4"
                style={{ backgroundColor: `${b.color}1A` }}
              >
                <b.icon className="w-5 h-5" style={{ color: b.color }} />
              </div>
              <h3 className="text-sm font-bold mb-1.5">{b.title}</h3>
              <p className="text-xs text-[#585C74] leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-[#464B71] rounded-[24px] p-8 sm:p-12 text-center text-white">
          <Clock className="w-8 h-8 text-[#7CD5C7] mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Tidak perlu antre lagi
          </h2>
          <p className="mt-2 text-sm text-white/70 max-w-xl mx-auto">
            Masuk sekarang dan nikmati kemudahan pengajuan surat, pengaduan,
            dan informasi desa &mdash; langsung dari perangkat Anda.
          </p>
          <button
            onClick={() => onGoToLogin('warga')}
            className="mt-6 inline-flex items-center space-x-2 px-6 py-3 rounded-[14px] bg-[#7CD5C7] hover:bg-[#5cc4b4] text-[#1F2232] text-sm font-semibold transition-colors"
          >
            <span>Mulai Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8E8E2] py-6 text-xs text-[#585C74]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-[8px] bg-[#464B71] flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-[#7CD5C7]" />
            </div>
            <span className="font-bold text-[#1F2232]">
              Sakalputung &bull; Sistem Layanan Publik Desa
            </span>
          </div>
          <span>RT 01 s/d RT 05 &bull; Served by Go (Gin) + PostgreSQL</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
