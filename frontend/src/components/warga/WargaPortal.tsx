import React, { useState } from 'react';
import type { UserSession, Laporan, SuratPusat, DonasiKegiatan, RTNumber } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { 
  MapPin, 
  Phone, 
  AlertCircle, 
  Mail, 
  HeartHandshake, 
  FileText, 
  ArrowRight, 
  Edit2,
  UserPlus
} from 'lucide-react';

interface WargaPortalProps {
  user: UserSession;
  onUpdateProfile: (user: Partial<UserSession>) => void;
  laporanList: Laporan[];
  suratList: SuratPusat[];
  donasiList: DonasiKegiatan[];
  onNavigateTab: (tab: string) => void;
}

export const WargaPortal: React.FC<WargaPortalProps> = ({
  user,
  onUpdateProfile,
  laporanList,
  suratList,
  onNavigateTab,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nama: user.nama || '',
    umur: user.umur ? String(user.umur) : '',
    rt: (user.rt || 1) as RTNumber,
    nomorTelepon: user.nomorTelepon || '',
    alamat: user.alamat || '',
  });

  const isProfileEmpty = !user.nama && !user.alamat && !user.nomorTelepon && !user.umur;

  const unreadSurat = suratList.filter((s) => s.dibagikanOtomatis && !s.sudahDibaca);
  const myLaporan = laporanList.filter(
    (l) => l.pelaporNama.toLowerCase() === (user.nama || '').toLowerCase() || l.rt === user.rt
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      nama: profileForm.nama.trim(),
      umur: profileForm.umur ? Number(profileForm.umur) : undefined,
      rt: profileForm.rt,
      nomorTelepon: profileForm.nomorTelepon.trim(),
      alamat: profileForm.alamat.trim(),
    });
    setIsEditingProfile(false);
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Profile Card (Modern Tactile Minimal per DESIGN.md Section 1 & 2.1) */}
      <div className="rounded-[22px] bg-[#FFFFFF] border border-[#E8E8E2] p-6 sm:p-8 shadow-tactile relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-[20px] bg-[#464B71] text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
              {user.nama ? user.nama.charAt(0) : 'W'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2232]">
                  Sugeng Rawuh, {user.nama || 'Warga'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-[9999px] bg-[#E2F6F3] text-[#118AB2] text-xs font-bold">
                  Warga RT 0{user.rt || 1}
                </span>
              </div>
              <p className="text-xs text-[#585C74] max-w-xl">
                Portal terpadu warga Desa Sakalputung untuk menyampaikan pengaduan kendala desa, memantau kabar surat dinas pusat, dan bergotong royong lewat donasi kegiatan.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#585C74]">
                <span className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-[#118AB2]" />
                  {user.alamat ? user.alamat : 'Alamat belum diisi'}
                </span>
                <span className="flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-[#118AB2]" />
                  {user.nomorTelepon ? user.nomorTelepon : 'Nomor HP belum diisi'}
                </span>
                <span>{user.umur ? `Umur: ${user.umur} Tahun` : 'Umur belum diisi'}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="px-3.5 py-2 rounded-[12px] bg-[#F2F2ED] hover:bg-[#E8E8E2] text-[#464B71] text-xs font-semibold border border-[#E8E8E2] transition-colors flex items-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-[#118AB2]"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#118AB2]" />
              <span>Perbarui Profil & Alamat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Promosi melengkapi profil jika masih kosong */}
      {isProfileEmpty && (
        <div className="rounded-[18px] bg-[#E2F6F3] border border-[#7CD5C7]/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#118AB2] text-white flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#1F2232]">
                Profil Anda masih kosong
              </span>
              <p className="text-[#585C74] text-[11px] mt-0.5">
                Lengkapi nama, umur, wilayah RT, nomor HP, dan alamat rumah agar layanan dapat berjalan optimal.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingProfile(true)}
            className="px-3 py-1.5 rounded-[10px] bg-[#118AB2] text-white text-xs font-semibold hover:bg-[#0e7396] transition-colors shrink-0"
          >
            Lengkapi Profil Sekarang
          </button>
        </div>
      )}

      {/* Unread Official Letters Alert Callout if any */}
      {unreadSurat.length > 0 && (
        <div className="rounded-[18px] bg-[#FEF3C7] border border-[#FDE68A] p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#D97706] text-white flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#92400E]">
                Ada {unreadSurat.length} kabar surat penting dari dinas pusat untuk warga!
              </span>
              <p className="text-[#B45309] text-[11px] mt-0.5">
                Pengumuman resmi mengenai bantuan atau agenda kependudukan telah dibagikan oleh admin desa.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('kabar-surat')}
            className="px-3 py-1.5 rounded-[10px] bg-[#92400E] text-white text-xs font-semibold hover:bg-[#78350F] transition-colors shrink-0"
          >
            Buka Surat
          </button>
        </div>
      )}

      {/* Quick Action Grid (Content-Driven Composition per C-3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Action 1: Lapor Kendala */}
        <div 
          onClick={() => onNavigateTab('pengaduan')}
          className="rounded-[20px] bg-[#FFFFFF] border border-[#E8E8E2] p-5 shadow-tactile shadow-tactile-hover cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-[14px] bg-[#FEF3C7] flex items-center justify-center text-[#92400E] mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-[#1F2232] group-hover:text-[#118AB2] transition-colors">
              Laporkan Kendala Desa
            </h2>
            <p className="text-xs text-[#585C74] mt-1 leading-relaxed">
              Ada jalan rusak, lampu mati, atau sampah menumpuk? Laporkan disertai foto dan lokasi.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E8E8E2] flex items-center justify-between text-xs font-semibold text-[#118AB2]">
            <span>Buat Laporan</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action 2: Kabar Surat Pusat */}
        <div 
          onClick={() => onNavigateTab('kabar-surat')}
          className="rounded-[20px] bg-[#FFFFFF] border border-[#E8E8E2] p-5 shadow-tactile shadow-tactile-hover cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-[14px] bg-[#E2F6F3] flex items-center justify-center text-[#118AB2] mb-3">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-[#1F2232] group-hover:text-[#118AB2] transition-colors">
              Kabar Surat Dinas Pusat
            </h2>
            <p className="text-xs text-[#585C74] mt-1 leading-relaxed">
              Arsip surat edaran kementerian, jadwal BLT, pelayanan KTP jemput bola, dan program desa.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E8E8E2] flex items-center justify-between text-xs font-semibold text-[#118AB2]">
            <span>Lihat Kotak Masuk</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action 3: Donasi Desa */}
        <div 
          onClick={() => onNavigateTab('donasi')}
          className="rounded-[20px] bg-[#FFFFFF] border border-[#E8E8E2] p-5 shadow-tactile shadow-tactile-hover cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-[14px] bg-[#E8E8E2] flex items-center justify-center text-[#464B71] mb-3">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-[#1F2232] group-hover:text-[#118AB2] transition-colors">
              Gotong Royong Donasi
            </h2>
            <p className="text-xs text-[#585C74] mt-1 leading-relaxed">
              Salurkan donasi kegiatan sosial dan perbaikan pos ronda via QRIS, Virtual Account, & E-Wallet.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E8E8E2] flex items-center justify-between text-xs font-semibold text-[#118AB2]">
            <span>Ikut Donasi</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action 4: Berita Desa */}
        <div 
          onClick={() => onNavigateTab('berita')}
          className="rounded-[20px] bg-[#FFFFFF] border border-[#E8E8E2] p-5 shadow-tactile shadow-tactile-hover cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-[14px] bg-[#F2F2ED] flex items-center justify-center text-[#464B71] mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-[#1F2232] group-hover:text-[#118AB2] transition-colors">
              Berita & Agenda Desa
            </h2>
            <p className="text-xs text-[#585C74] mt-1 leading-relaxed">
              Baca informasi pembangunan desa, jadwal posyandu, dan agenda kerja bakti lingkungan.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E8E8E2] flex items-center justify-between text-xs font-semibold text-[#118AB2]">
            <span>Baca Berita</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Recent Activity: Riwayat Pengaduan Terkini Warga */}
      <div className="rounded-[22px] bg-[#FFFFFF] border border-[#E8E8E2] p-6 shadow-tactile">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#1F2232]">
              Status Pengaduan Terakhir di Lingkungan Anda
            </h2>
            <p className="text-xs text-[#585C74]">
              Pantau langsung tindak lanjut dari laporan kendala yang telah Anda kirimkan ke perangkat desa.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('pengaduan')}
            className="text-xs font-semibold text-[#118AB2] hover:underline"
          >
            Lihat Semua Laporan Anda &rarr;
          </button>
        </div>

        <div className="space-y-3">
          {myLaporan.length === 0 ? (
            <div className="py-8 text-center text-[#8B8FA3] text-xs">
              Belum ada pengaduan yang dikirimkan. Anda dapat melaporkan kendala lingkungan kapan saja.
            </div>
          ) : (
            myLaporan.slice(0, 3).map((lap) => (
              <div
                key={lap.id}
                className="p-4 rounded-[14px] bg-[#F2F2ED] border border-[#E8E8E2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#1F2232]">{lap.judul}</span>
                    <StatusBadge status={lap.status} />
                  </div>
                  <p className="text-[#585C74] line-clamp-1">{lap.keluhan}</p>
                  {lap.catatanAdmin && (
                    <div className="text-[11px] text-[#118AB2] font-medium">
                      Catatan Petugas: "{lap.catatanAdmin}"
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-[#8B8FA3] shrink-0 sm:text-right">
                  <div>Kategori: {lap.kategori}</div>
                  <div>Dikirim: {lap.createdAt}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Edit / Onboarding Profil Warga */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[22px] bg-white border border-[#E8E8E2] shadow-tactile overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#F2F2ED]">
              <h2 className="text-sm font-bold text-[#1F2232]">
                Lengkapi Data Diri Warga (Onboarding)
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="p-1.5 rounded-[8px] hover:bg-[#E8E8E2] text-[#585C74]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.nama}
                  onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                    Umur (Tahun)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={120}
                    value={profileForm.umur}
                    onChange={(e) => setProfileForm({ ...profileForm, umur: e.target.value })}
                    placeholder="Masukkan umur Anda"
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] placeholder-[#8B8FA3] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                    Wilayah RT
                  </label>
                  <select
                    value={profileForm.rt}
                    onChange={(e) => setProfileForm({ ...profileForm, rt: Number(e.target.value) as RTNumber })}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs font-bold text-[#464B71] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((rtNum) => (
                      <option key={`profile-rt-${rtNum}`} value={rtNum}>
                        RT 0{rtNum}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  Nomor HP / WhatsApp Aktif
                </label>
                <input
                  type="tel"
                  required
                  value={profileForm.nomorTelepon}
                  onChange={(e) => setProfileForm({ ...profileForm, nomorTelepon: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  Alamat Lengkap Rumah
                </label>
                <textarea
                  required
                  rows={3}
                  value={profileForm.alamat}
                  onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                  placeholder="Contoh: Jl. Sakalputung Raya No. 10, RT 01"
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E8E8E2]">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-[10px] bg-[#E8E8E2] text-[#585C74] text-xs font-semibold hover:bg-[#deded6]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-[10px] bg-[#464B71] text-white text-xs font-semibold hover:bg-[#373B5A]"
                >
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
