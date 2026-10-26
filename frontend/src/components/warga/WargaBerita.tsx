import React, { useState } from 'react';
import type { Berita } from '../../types';
import { Calendar, Eye, User, Search, X, ArrowRight } from 'lucide-react';

interface WargaBeritaProps {
  beritaList: Berita[];
  onReadBerita: (id: string) => void;
}

export const WargaBerita: React.FC<WargaBeritaProps> = ({
  beritaList,
  onReadBerita,
}) => {
  const [selectedBerita, setSelectedBerita] = useState<Berita | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');

  const kategoriList = ['Semua', 'Pembangunan', 'Kesehatan', 'Pengumuman', 'Kegiatan RT', 'Sosial'];

  const filtered = beritaList.filter((b) => {
    const matchKat = selectedKategori === 'Semua' || b.kategori === selectedKategori;
    const matchQuery =
      searchQuery === '' ||
      b.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.konten.toLowerCase().includes(searchQuery.toLowerCase());
    return matchKat && matchQuery;
  });

  const handleOpenBerita = (b: Berita) => {
    setSelectedBerita(b);
    onReadBerita(b.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1F2232]">
          Kabar & Warta Desa Sakalputung
        </h1>
        <p className="text-sm text-[#585C74] mt-0.5">
          Informasi pembangunan desa, penyuluhan kesehatan, kerja bakti, dan agenda kemasyarakatan terkini.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-[20px] bg-[#FFFFFF] border border-[#E8E8E2] p-4 shadow-tactile flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {kategoriList.map((kat) => (
            <button
              key={`kat-${kat}`}
              type="button"
              onClick={() => setSelectedKategori(kat)}
              className={`px-3 py-1.5 rounded-[9999px] text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#118AB2] ${
                selectedKategori === kat
                  ? 'bg-[#464B71] text-white shadow-sm'
                  : 'bg-[#E8E8E2] text-[#585C74] hover:text-[#1F2232]'
              }`}
            >
              {kat}
            </button>
          ))}
        </div>

        <div className="relative md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8FA3]" />
          <input
            type="text"
            placeholder="Cari berita..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-[12px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] placeholder-[#8B8FA3] focus:bg-white focus:border-[#118AB2] focus:outline-none"
          />
        </div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <article
            key={item.id}
            onClick={() => handleOpenBerita(item)}
            className="rounded-[22px] bg-[#FFFFFF] border border-[#E8E8E2] overflow-hidden shadow-tactile shadow-tactile-hover cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-48 w-full bg-[#E8E8E2] overflow-hidden">
                <img
                  src={item.gambarUrl}
                  alt={item.judul}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    {item.tanggal}
                  </span>
                  <span className="flex items-center">
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    {item.views} pembaca
                  </span>
                </div>

                <h2 className="text-base font-bold text-[#1F2232] leading-snug group-hover:text-[#118AB2] transition-colors line-clamp-2">
                  {item.judul}
                </h2>

                <p className="text-xs text-[#585C74] line-clamp-3 leading-relaxed">
                  {item.ringkasan || item.konten}
                </p>

                <div className="pt-2 text-[11px] text-[#8B8FA3] flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-[#118AB2]" />
                  <span>{item.penulis}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#F2F2ED]/60 border-t border-[#E8E8E2] flex items-center justify-between text-xs font-semibold text-[#118AB2]">
              <span>Baca Selengkapnya</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </article>
        ))}
      </div>

      {/* Modal Detail Berita */}
      {selectedBerita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-[22px] bg-white border border-[#E8E8E2] shadow-tactile overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative h-60 w-full bg-[#E8E8E2]">
              <img
                src={selectedBerita.gambarUrl}
                alt={selectedBerita.judul}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedBerita(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-xs transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 rounded-[8px] bg-[#464B71] text-white text-xs font-semibold">
                  {selectedBerita.kategori}
                </span>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center space-x-3 text-xs text-[#8B8FA3]">
                <span className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {selectedBerita.tanggal}
                </span>
                <span>&bull;</span>
                <span className="flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-[#118AB2]" />
                  {selectedBerita.penulis}
                </span>
                <span>&bull;</span>
                <span>{selectedBerita.views} kali dibaca</span>
              </div>

              <h2 className="text-xl font-bold text-[#1F2232] leading-snug">
                {selectedBerita.judul}
              </h2>

              <div className="text-xs sm:text-sm text-[#1F2232] leading-relaxed space-y-3 font-normal pt-2 border-t border-[#E8E8E2]">
                <p className="font-semibold text-[#585C74]">{selectedBerita.ringkasan}</p>
                <p className="whitespace-pre-line">{selectedBerita.konten}</p>
              </div>
            </div>

            <div className="p-4 bg-[#F2F2ED]/60 border-t border-[#E8E8E2] text-right">
              <button
                type="button"
                onClick={() => setSelectedBerita(null)}
                className="px-5 py-2 rounded-[10px] bg-[#464B71] text-white text-xs font-semibold hover:bg-[#373B5A]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
