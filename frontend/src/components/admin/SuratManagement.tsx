import React, { useState } from 'react';
import type { SuratPusat } from '../../types';
import { Send, Plus, Calendar, X } from 'lucide-react';

interface SuratManagementProps {
  suratList: SuratPusat[];
  onAddSurat: (s: Omit<SuratPusat, 'id' | 'createdAt' | 'sudahDibaca'>) => void;
}

export const SuratManagement: React.FC<SuratManagementProps> = ({
  suratList,
  onAddSurat,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nomorSurat: '',
    instansiPusat: 'Kementerian Desa PDTT / Pemerintah Kabupaten',
    perihal: '',
    tanggalSurat: '17 Oktober 2026',
    ringkasan: '',
    dibagikanOtomatis: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomorSurat || !formData.perihal) return;
    onAddSurat(formData);
    setIsModalOpen(false);
    setFormData({
      nomorSurat: '',
      instansiPusat: 'Kementerian Desa PDTT / Pemerintah Kabupaten',
      perihal: '',
      tanggalSurat: '17 Oktober 2026',
      ringkasan: '',
      dibagikanOtomatis: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2232]">
            Arsip & Distribusi Surat Resmi dari Pusat
          </h1>
          <p className="text-sm text-[#585C74] mt-0.5">
            Setiap surat masuk dari kementerian atau dinas pusat dapat diarsipkan dan dibagikan otomatis ke kotak masuk warga.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-[14px] bg-[#464B71] hover:bg-[#373B5A] text-white text-xs font-semibold shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#118AB2]"
        >
          <Plus className="w-4 h-4 text-[#7CD5C7]" />
          <span>Input Surat Masuk Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {suratList.map((srt) => (
          <div
            key={srt.id}
            className="rounded-[20px] bg-[#FFFFFF] border border-[#E8E8E2] p-5 shadow-tactile shadow-tactile-hover flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold text-[#118AB2] uppercase tracking-wide">
                  {srt.instansiPusat}
                </span>
                {srt.dibagikanOtomatis && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] bg-[#E2F6F3] text-[#118AB2] text-[10px] font-bold">
                    <Send className="w-3 h-3 mr-1" />
                    Dibagikan ke Warga
                  </span>
                )}
              </div>

              <div>
                <div className="text-xs font-mono text-[#8B8FA3]">{srt.nomorSurat}</div>
                <h2 className="text-base font-bold text-[#1F2232] mt-1 leading-snug">
                  {srt.perihal}
                </h2>
              </div>

              <p className="text-xs text-[#585C74] leading-relaxed bg-[#F2F2ED] p-3 rounded-[12px] border border-[#E8E8E2]">
                {srt.ringkasan}
              </p>

              <div className="text-[11px] text-[#8B8FA3] flex items-center justify-between pt-1">
                <span className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  Tanggal Surat: {srt.tanggalSurat}
                </span>
                <span>Diinput: {srt.createdAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Input Surat Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[22px] bg-white border border-[#E8E8E2] shadow-tactile overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#F2F2ED]">
              <h2 className="text-sm font-bold text-[#1F2232]">Input Surat Resmi dari Pusat</h2>
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
                  Nomor Surat Dinas
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 440/128/Kec.Skl/X/2026"
                  value={formData.nomorSurat}
                  onChange={(e) => setFormData({ ...formData, nomorSurat: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs font-mono text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                    Instansi Asal Pengirim
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.instansiPusat}
                    onChange={(e) => setFormData({ ...formData, instansiPusat: e.target.value })}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                    Tanggal Surat
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tanggalSurat}
                    onChange={(e) => setFormData({ ...formData, tanggalSurat: e.target.value })}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  Perihal / Pokok Isi Surat
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penyaluran Bantuan Pangan Cadangan Beras..."
                  value={formData.perihal}
                  onChange={(e) => setFormData({ ...formData, perihal: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  Ringkasan Informasi Penting untuk Warga
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.ringkasan}
                  onChange={(e) => setFormData({ ...formData, ringkasan: e.target.value })}
                  placeholder="Jelaskan isi pokok surat secara ringkas agar mudah dipahami oleh seluruh warga..."
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>

              {/* Checkbox bagikan otomatis sesuai ROAD.md point 9 */}
              <div className="p-3 rounded-[12px] bg-[#E2F6F3] border border-[#7CD5C7]/50 flex items-start space-x-2.5">
                <input
                  type="checkbox"
                  id="autoShare"
                  checked={formData.dibagikanOtomatis}
                  onChange={(e) => setFormData({ ...formData, dibagikanOtomatis: e.target.checked })}
                  className="mt-0.5 rounded text-[#118AB2] focus:ring-[#118AB2]"
                />
                <label htmlFor="autoShare" className="text-xs text-[#1F2232] leading-tight cursor-pointer">
                  <span className="font-bold text-[#118AB2] block">Bagikan Kabar Otomatis ke Seluruh Warga</span>
                  Setiap warga di RT 01 - RT 05 akan langsung menerima notifikasi kabar surat ini di portal warga.
                </label>
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
                  <Send className="w-3.5 h-3.5 text-[#7CD5C7]" />
                  <span>Simpan & Bagikan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
