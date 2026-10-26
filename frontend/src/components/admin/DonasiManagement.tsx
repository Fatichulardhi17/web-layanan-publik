import React, { useState } from 'react';
import type { DonasiKegiatan } from '../../types';
import { Plus, Calendar, User, X, Check } from 'lucide-react';

interface DonasiManagementProps {
  donasiList: DonasiKegiatan[];
  onAddDonasi: (d: Omit<DonasiKegiatan, 'id' | 'slug' | 'terkumpul' | 'donatur'>) => void;
}

export const DonasiManagement: React.FC<DonasiManagementProps> = ({
  donasiList,
  onAddDonasi,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDonasi, setSelectedDonasi] = useState<DonasiKegiatan | null>(null);

  const [formData, setFormData] = useState({
    judul: '',
    deskripsi: '',
    targetDana: 5000000,
    batasWaktu: '31 Desember 2026',
    status: 'aktif' as const,
    penanggungJawab: 'Ketua Pengurus Kegiatan Desa Sakalputung',
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul || formData.targetDana <= 0) return;
    onAddDonasi(formData);
    setIsModalOpen(false);
    setFormData({
      judul: '',
      deskripsi: '',
      targetDana: 5000000,
      batasWaktu: '31 Desember 2026',
      status: 'aktif',
      penanggungJawab: 'Ketua Pengurus Kegiatan Desa Sakalputung',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2232]">
            Kelola Forum Donasi Kegiatan Desa
          </h1>
          <p className="text-sm text-[#585C74] mt-0.5">
            Buat penggalangan dana terpadu untuk pos ronda, posyandu, dan sarana warga dengan payment gateway.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-[14px] bg-[#464B71] hover:bg-[#373B5A] text-white text-xs font-semibold shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#118AB2]"
        >
          <Plus className="w-4 h-4 text-[#7CD5C7]" />
          <span>Buat Forum Donasi Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {donasiList.map((keg) => {
          const percentage = Math.min(Math.round((keg.terkumpul / keg.targetDana) * 100), 100);

          return (
            <div
              key={keg.id}
              className="rounded-[22px] bg-[#FFFFFF] border border-[#E8E8E2] p-6 shadow-tactile shadow-tactile-hover flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-[8px] bg-[#E2F6F3] text-[#118AB2] text-[11px] font-bold">
                    {keg.status === 'aktif' ? 'Penggalangan Terbuka' : 'Selesai'}
                  </span>
                  <span className="text-[11px] text-[#8B8FA3] flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Batas: {keg.batasWaktu}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#1F2232] leading-snug">
                    {keg.judul}
                  </h2>
                  <p className="text-xs text-[#585C74] mt-2 leading-relaxed">
                    {keg.deskripsi}
                  </p>
                </div>

                {/* Progress Bar (DESIGN.md Section 2.3: Accent Primary #118AB2) */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-sm font-bold text-[#1F2232]">
                        {formatCurrency(keg.terkumpul)}
                      </span>
                      <span className="text-xs text-[#8B8FA3] ml-1">
                        / {formatCurrency(keg.targetDana)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#118AB2]">{percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-[#E8E8E2] rounded-[9999px] overflow-hidden">
                    <div
                      className="h-full bg-[#118AB2] rounded-[9999px] transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-[#585C74] flex items-center justify-between pt-1">
                  <span className="flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-[#464B71]" />
                    PJ: {keg.penanggungJawab}
                  </span>
                  <span className="font-semibold text-[#464B71]">
                    {keg.donatur.length} donatur berpartisipasi
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E8E8E2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedDonasi(keg)}
                  className="text-xs font-semibold text-[#118AB2] hover:underline"
                >
                  Lihat Riwayat Donatur ({keg.donatur.length}) &rarr;
                </button>
                <span className="text-[11px] text-[#8B8FA3]">Siap Payment Gateway</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Riwayat Donatur */}
      {selectedDonasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[22px] bg-white border border-[#E8E8E2] shadow-tactile overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#F2F2ED]">
              <div>
                <h2 className="text-sm font-bold text-[#1F2232]">Riwayat Donatur Terverifikasi</h2>
                <div className="text-[11px] text-[#585C74] truncate max-w-sm">{selectedDonasi.judul}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDonasi(null)}
                className="p-1.5 rounded-[8px] hover:bg-[#E8E8E2] text-[#585C74]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto">
              {selectedDonasi.donatur.length === 0 ? (
                <div className="py-8 text-center text-[#8B8FA3] text-xs">
                  Belum ada donatur pada kegiatan ini.
                </div>
              ) : (
                selectedDonasi.donatur.map((dn) => (
                  <div
                    key={dn.id}
                    className="p-3 rounded-[14px] bg-[#F2F2ED] border border-[#E8E8E2] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1F2232]">
                        {dn.isAnonim ? 'Hamba Allah (Anonim)' : dn.namaDonatur}
                      </span>
                      <span className="font-bold text-[#118AB2]">
                        {formatCurrency(dn.jumlahDonasi)}
                      </span>
                    </div>
                    <p className="text-[#585C74] italic">"{dn.pesanDoa}"</p>
                    <div className="text-[10px] text-[#8B8FA3] flex items-center justify-between pt-1">
                      <span>Metode: {dn.metodePembayaran}</span>
                      <span>{dn.tanggal}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-[#F2F2ED]/60 border-t border-[#E8E8E2] text-right">
              <button
                type="button"
                onClick={() => setSelectedDonasi(null)}
                className="px-4 py-2 rounded-[10px] bg-[#464B71] text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Forum Donasi Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[22px] bg-white border border-[#E8E8E2] shadow-tactile overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#F2F2ED]">
              <h2 className="text-sm font-bold text-[#1F2232]">Buat Forum Donasi Kegiatan Desa</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-[8px] hover:bg-[#E8E8E2] text-[#585C74]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  Nama / Judul Kegiatan Desa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengadaan Kursi Roda untuk Posyandu Lansia..."
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                    Target Dana (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={100000}
                    step={50000}
                    value={formData.targetDana}
                    onChange={(e) => setFormData({ ...formData, targetDana: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs font-bold text-[#464B71] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                    Batas Waktu Penggalangan
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.batasWaktu}
                    onChange={(e) => setFormData({ ...formData, batasWaktu: e.target.value })}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  Penanggung Jawab Kegiatan
                </label>
                <input
                  type="text"
                  required
                  value={formData.penanggungJawab}
                  onChange={(e) => setFormData({ ...formData, penanggungJawab: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  Deskripsi & Rincian Kebutuhan
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Jelaskan tujuan donasi, transparansi penggunaan anggaran, dan manfaat untuk warga desa..."
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E8E8E2]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-[10px] bg-[#E8E8E2] text-[#585C74] text-xs font-semibold hover:bg-[#deded6]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-[10px] bg-[#464B71] text-white text-xs font-semibold hover:bg-[#373B5A] flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-[#7CD5C7]" />
                  <span>Buka Forum Donasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
