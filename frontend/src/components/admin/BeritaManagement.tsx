import React, { useState } from 'react';
import type { Berita } from '../../types';
import { Plus, Eye, Calendar, User, X, Check } from 'lucide-react';

interface BeritaManagementProps {
  beritaList: Berita[];
  onAddBerita: (b: Omit<Berita, 'id' | 'slug' | 'views' | 'tanggal'>) => void;
}

export const BeritaManagement: React.FC<BeritaManagementProps> = ({
  beritaList,
  onAddBerita,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    judul: '',
    kategori: 'Pembangunan' as Berita['kategori'],
    ringkasan: '',
    konten: '',
    penulis: 'Sekretariat Desa Sakalputung',
    gambarUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul || !formData.konten) return;
    onAddBerita(formData);
    setIsModalOpen(false);
    setFormData({
      judul: '',
      kategori: 'Pembangunan',
      ringkasan: '',
      konten: '',
      penulis: 'Sekretariat Desa Sakalputung',
      gambarUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2232]">
            Publikasi Berita & Agenda Desa
          </h1>
          <p className="text-sm text-[#585C74] mt-0.5">
            Kelola pengumuman, program pembangunan, dan kegiatan kemasyarakatan di Sakalputung.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-[14px] bg-[#464B71] hover:bg-[#373B5A] text-white text-xs font-semibold shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#118AB2]"
        >
          <Plus className="w-4 h-4 text-[#7CD5C7]" />
          <span>Tulis Berita Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {beritaList.map((item) => (
          <article
            key={item.id}
            className="rounded-[20px] bg-[#FFFFFF] border border-[#E8E8E2] overflow-hidden shadow-tactile shadow-tactile-hover flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 w-full bg-[#E8E8E2]">
                <img
                  src={item.gambarUrl}
                  alt={item.judul}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-[8px] bg-[#464B71]/90 text-white text-[11px] font-semibold backdrop-blur-xs">
                    {item.kategori}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-[#8B8FA3]">
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {item.tanggal}
                  </span>
                  <span className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {item.views} pembaca
                  </span>
                </div>

                <h2 className="text-base font-bold text-[#1F2232] leading-snug line-clamp-2">
                  {item.judul}
                </h2>

                <p className="text-xs text-[#585C74] line-clamp-3 leading-relaxed">
                  {item.ringkasan || item.konten}
                </p>

                <div className="pt-2 text-[11px] text-[#8B8FA3] flex items-center">
                  <User className="w-3 h-3 mr-1 text-[#118AB2]" />
                  <span>{item.penulis}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#F2F2ED]/60 border-t border-[#E8E8E2] flex items-center justify-between text-xs">
              <span className="text-[#118AB2] font-semibold">Tampil di portal warga</span>
              <span className="text-[11px] text-[#585C74]">Slug: /{item.slug}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Modal Tambah Berita */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[22px] bg-white border border-[#E8E8E2] shadow-tactile overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#F2F2ED]">
              <h2 className="text-sm font-bold text-[#1F2232]">Publikasikan Berita Desa Baru</h2>
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
                  Judul Berita / Kegiatan
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Contoh: Kerja Bakti Massal RT 01 - 05..."
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as Berita['kategori'] })}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                  >
                    <option value="Pembangunan">Pembangunan</option>
                    <option value="Kesehatan">Kesehatan</option>
                    <option value="Pengumuman">Pengumuman</option>
                    <option value="Kegiatan RT">Kegiatan RT</option>
                    <option value="Sosial">Sosial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                    Penulis / Pengirim
                  </label>
                  <input
                    type="text"
                    value={formData.penulis}
                    onChange={(e) => setFormData({ ...formData, penulis: e.target.value })}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  URL Gambar Banner
                </label>
                <input
                  type="url"
                  value={formData.gambarUrl}
                  onChange={(e) => setFormData({ ...formData, gambarUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  Ringkasan Singkat (Lead Paragraph)
                </label>
                <textarea
                  rows={2}
                  value={formData.ringkasan}
                  onChange={(e) => setFormData({ ...formData, ringkasan: e.target.value })}
                  placeholder="Ringkasan satu atau dua kalimat..."
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  Isi Lengkap Berita
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.konten}
                  onChange={(e) => setFormData({ ...formData, konten: e.target.value })}
                  placeholder="Tuliskan isi berita secara lengkap di sini..."
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
                  <span>Publikasikan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
