import React from 'react';
import type { Penduduk, Laporan, SuratPusat, DonasiKegiatan, RTNumber } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Users, 
  AlertCircle, 
  Mail, 
  HeartHandshake, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface AdminDashboardProps {
  penduduk: Penduduk[];
  laporan: Laporan[];
  surat: SuratPusat[];
  donasi: DonasiKegiatan[];
  onNavigateTab: (tab: string) => void;
  currentRt?: RTNumber;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  penduduk,
  laporan,
  surat,
  donasi,
  onNavigateTab,
  currentRt = 1
}) => {
  // Aggregate real statistics
  const totalPenduduk = penduduk.length;
  const rtStats = [1, 2, 3, 4, 5].map((rtNum) => {
    return {
      rt: rtNum,
      count: penduduk.filter((p) => p.rt === rtNum).length,
    };
  });

  const maxRtCount = Math.max(...rtStats.map((r) => r.count), 1);

  const laporanPending = laporan.filter((l) => l.status === 'belum_dikerjakan').length;
  const laporanDiproses = laporan.filter((l) => l.status === 'menunggu_info_lanjut').length;
  const laporanSelesai = laporan.filter((l) => l.status === 'sudah_dikerjakan').length;

  const totalDonasiTerkumpul = donasi.reduce((acc, curr) => acc + curr.terkumpul, 0);
  const totalTargetDonasi = donasi.reduce((acc, curr) => acc + curr.targetDana, 0);

  const suratTerkirim = surat.filter((s) => s.dibagikanOtomatis).length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2232]">
            Dashboard Administrasi Desa Sakalputung
          </h1>
          <p className="text-sm text-[#585C74] mt-0.5">
            Pusat monitoring kependudukan RT 01 - 05, tindak lanjut keluhan warga, dan arsip kedinasan.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-[9999px] bg-[#E8E8E2] text-[#464B71] border border-[#D5D5CE]">
            Kewenangan Aktif: RT 0{currentRt} Sakalputung
          </span>
        </div>
      </div>

      {/* Row 1: Dark Highlight Card (DESIGN.md Section 2.1 & 5) */}
      <div className="rounded-[22px] bg-gradient-to-r from-[#464B71] to-[#373B5A] text-white p-6 sm:p-8 shadow-dark-card relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-[8px] bg-white/10 text-[#7CD5C7] text-xs font-semibold mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Kinerja Layanan Publik Terpadu</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Desa Sakalputung: Transparan, Responsif, dan Guyub Rukun
          </h2>
          <p className="text-sm text-white/80 leading-relaxed mb-6">
            Seluruh data penduduk dari RT 01 sampai RT 05 telah terhubung dengan koordinat spasial peta, 
            kabar surat resmi pusat terdistribusi otomatis, dan pengaduan warga dipantau secara berkala.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/15">
            <div>
              <div className="text-xs text-white/70">Total Penduduk</div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{totalPenduduk} Jiwa</div>
              <div className="text-[11px] text-[#7CD5C7] mt-0.5">Tersebar di 5 RT</div>
            </div>
            <div>
              <div className="text-xs text-white/70">Keluhan Dituntaskan</div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                {laporan.length > 0 ? `${Math.round((laporanSelesai / laporan.length) * 100)}%` : '0%'}
              </div>
              <div className="text-[11px] text-[#7CD5C7] mt-0.5">{laporanSelesai} dari {laporan.length} laporan</div>
            </div>
            <div>
              <div className="text-xs text-white/70">Donasi Warga Terkumpul</div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                {formatCurrency(totalDonasiTerkumpul)}
              </div>
              <div className="text-[11px] text-[#7CD5C7] mt-0.5">Target: {formatCurrency(totalTargetDonasi)}</div>
            </div>
            <div>
              <div className="text-xs text-white/70">Surat Pusat Dibagikan</div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{suratTerkirim} Surat</div>
              <div className="text-[11px] text-[#7CD5C7] mt-0.5">Notifikasi warga aktif</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Metric Stat Cards (DESIGN.md Section 2.1 & 4.2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Penduduk */}
        <div className="rounded-[20px] bg-[#FFFFFF] border border-[#E8E8E2] p-5 shadow-tactile shadow-tactile-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#585C74]">Data Kependudukan</span>
            <div className="w-8 h-8 rounded-[12px] bg-[#E8E8E2] flex items-center justify-center text-[#464B71]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#1F2232]">{totalPenduduk}</div>
            <div className="text-xs text-[#585C74] mt-1">RT 01 sampai RT 05</div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('penduduk')}
            className="mt-4 pt-3 border-t border-[#E8E8E2] text-xs font-semibold text-[#118AB2] flex items-center justify-between hover:text-[#464B71] transition-colors"
          >
            <span>Buka Data & Peta</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Laporan Kendala */}
        <div className="rounded-[20px] bg-[#FFFFFF] border border-[#E8E8E2] p-5 shadow-tactile shadow-tactile-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#585C74]">Status Pengaduan</span>
            <div className="w-8 h-8 rounded-[12px] bg-[#FEF3C7] flex items-center justify-center text-[#92400E]">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#1F2232]">{laporanPending + laporanDiproses}</div>
            <div className="text-xs text-[#585C74] mt-1">
              {laporanPending} menunggu pengerjaan, {laporanDiproses} diproses
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('laporan')}
            className="mt-4 pt-3 border-t border-[#E8E8E2] text-xs font-semibold text-[#118AB2] flex items-center justify-between hover:text-[#464B71] transition-colors"
          >
            <span>Kelola Tindak Lanjut</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Surat Pusat */}
        <div className="rounded-[20px] bg-[#FFFFFF] border border-[#E8E8E2] p-5 shadow-tactile shadow-tactile-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#585C74]">Surat Dinas Pusat</span>
            <div className="w-8 h-8 rounded-[12px] bg-[#E2F6F3] flex items-center justify-center text-[#118AB2]">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#1F2232]">{surat.length}</div>
            <div className="text-xs text-[#585C74] mt-1">{suratTerkirim} terdistribusi otomatis</div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('surat')}
            className="mt-4 pt-3 border-t border-[#E8E8E2] text-xs font-semibold text-[#118AB2] flex items-center justify-between hover:text-[#464B71] transition-colors"
          >
            <span>Arsip Surat & Notifikasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: Donasi Desa */}
        <div className="rounded-[20px] bg-[#FFFFFF] border border-[#E8E8E2] p-5 shadow-tactile shadow-tactile-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#585C74]">Forum Donasi Desa</span>
            <div className="w-8 h-8 rounded-[12px] bg-[#E8E8E2] flex items-center justify-center text-[#464B71]">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#1F2232]">{donasi.length} Kegiatan</div>
            <div className="text-xs text-[#585C74] mt-1">
              {Math.round((totalDonasiTerkumpul / (totalTargetDonasi || 1)) * 100)}% dari target dana tercapai
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('donasi')}
            className="mt-4 pt-3 border-t border-[#E8E8E2] text-xs font-semibold text-[#118AB2] flex items-center justify-between hover:text-[#464B71] transition-colors"
          >
            <span>Pantau Donatur</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 3: Bar Chart of Population per RT & Priority Action List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column (DESIGN.md Section 5: Chart Bars) */}
        <div className="lg:col-span-2 rounded-[22px] bg-[#FFFFFF] border border-[#E8E8E2] p-6 shadow-tactile">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#1F2232]">
                Distribusi Penduduk per Rukun Tetangga (RT 01 - RT 05)
              </h2>
              <p className="text-xs text-[#585C74]">
                Sebaran warga terdaftar dengan titik koordinat rumah di sistem informasi desa.
              </p>
            </div>
          </div>

          {/* Tactile Bar Chart */}
          <div className="space-y-4 pt-2">
            {rtStats.map((item) => {
              const percentage = Math.round((item.count / maxRtCount) * 100);
              const isSelectedRt = currentRt === item.rt;

              return (
                <div key={`rt-bar-${item.rt}`} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${isSelectedRt ? 'text-[#118AB2]' : 'text-[#1F2232]'}`}>
                      RT 0{item.rt} Sakalputung {isSelectedRt && '(Kewenangan Anda)'}
                    </span>
                    <span className="font-bold text-[#1F2232]">{item.count} Warga</span>
                  </div>
                  <div className="w-full h-4 bg-[#E8E8E2] rounded-[9999px] overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-[9999px] transition-all duration-500 ${
                        isSelectedRt ? 'bg-[#7CD5C7]' : 'bg-[#464B71]'
                      }`}
                      style={{ width: `${Math.max(percentage, 12)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-[#E8E8E2] flex items-center justify-between text-xs text-[#585C74]">
            <span>Batang biru/mint menandakan RT aktif yang sedang dikelola.</span>
            <button
              type="button"
              onClick={() => onNavigateTab('penduduk')}
              className="text-[#118AB2] font-semibold hover:underline"
            >
              Lihat Persebaran di Peta &rarr;
            </button>
          </div>
        </div>

        {/* Right Column: Laporan Butuh Tindak Lanjut Segera */}
        <div className="rounded-[22px] bg-[#FFFFFF] border border-[#E8E8E2] p-6 shadow-tactile flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[#92400E] mb-2">
              <ShieldAlert className="w-4 h-4" />
              <h2 className="text-sm font-bold text-[#1F2232]">
                Pengaduan Perlu Respon Cepat
              </h2>
            </div>
            <p className="text-xs text-[#585C74] mb-4">
              Laporan warga yang belum ditangani atau membutuhkan konfirmasi lapangan.
            </p>

            <div className="space-y-3">
              {laporan.slice(0, 3).map((lap) => (
                <div
                  key={lap.id}
                  className="p-3 rounded-[14px] bg-[#F2F2ED] border border-[#E8E8E2] space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[#1F2232] line-clamp-1">
                      {lap.judul}
                    </span>
                    <StatusBadge status={lap.status} />
                  </div>
                  <div className="text-[11px] text-[#585C74] flex items-center space-x-2">
                    <span>RT 0{lap.rt}</span>
                    <span>&bull;</span>
                    <span>Oleh: {lap.pelaporNama}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('laporan')}
            className="w-full mt-4 py-2.5 rounded-[12px] bg-[#464B71] text-white text-xs font-semibold hover:bg-[#373B5A] transition-colors focus-visible:ring-2 focus-visible:ring-[#118AB2]"
          >
            Buka Semua Pengaduan Warga
          </button>
        </div>
      </div>
    </div>
  );
};
