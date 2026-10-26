import React, { useState } from 'react';
import type { Laporan, LaporanStatus, RTNumber } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Filter, 
  X,
  FileCheck2
} from 'lucide-react';

interface LaporanManagementProps {
  laporanList: Laporan[];
  onUpdateStatus: (id: string, status: LaporanStatus, catatan?: string) => void;
  currentRt?: RTNumber;
}

export const LaporanManagement: React.FC<LaporanManagementProps> = ({
  laporanList,
  onUpdateStatus,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRt, setFilterRt] = useState<number>(0);
  const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<LaporanStatus>('belum_dikerjakan');
  const [catatanAdmin, setCatatanAdmin] = useState<string>('');

  const filtered = laporanList.filter((l) => {
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchRt = filterRt === 0 || l.rt === filterRt;
    return matchStatus && matchRt;
  });

  const handleOpenDetail = (l: Laporan) => {
    setSelectedLaporan(l);
    setStatusUpdate(l.status);
    setCatatanAdmin(l.catatanAdmin || '');
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLaporan) return;
    onUpdateStatus(selectedLaporan.id, statusUpdate, catatanAdmin);
    setSelectedLaporan(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2232]">
            Pengelolaan Pengaduan & Keluhan Warga
          </h1>
          <p className="text-sm text-[#585C74] mt-0.5">
            Tindak lanjuti kendala infrastruktur, kebersihan, dan fasilitas umum yang dilaporkan masyarakat.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-[20px] bg-[#FFFFFF] border border-[#E8E8E2] p-4 shadow-tactile flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs (DESIGN.md Section 5: Pill Filters) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-[#8B8FA3] mr-2 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" />
            Status:
          </span>
          {[
            { id: 'all', label: 'Semua Status' },
            { id: 'belum_dikerjakan', label: 'Belum Dikerjakan' },
            { id: 'menunggu_info_lanjut', label: 'Menunggu Info Lanjut' },
            { id: 'sudah_dikerjakan', label: 'Sudah Selesai' },
          ].map((st) => (
            <button
              key={`st-${st.id}`}
              type="button"
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1.5 rounded-[9999px] text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#118AB2] ${
                filterStatus === st.id
                  ? 'bg-[#464B71] text-white shadow-sm'
                  : 'bg-[#E8E8E2] text-[#585C74] hover:text-[#1F2232]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* RT Filter */}
        <div className="flex items-center space-x-1">
          <span className="text-xs font-semibold text-[#8B8FA3] mr-1">Wilayah RT:</span>
          {[0, 1, 2, 3, 4, 5].map((rtNum) => (
            <button
              key={`filter-rt-${rtNum}`}
              type="button"
              onClick={() => setFilterRt(rtNum)}
              className={`px-2.5 py-1 rounded-[8px] text-xs font-semibold transition-colors ${
                filterRt === rtNum
                  ? 'bg-[#118AB2] text-white'
                  : 'bg-[#F2F2ED] text-[#585C74] hover:bg-[#E8E8E2]'
              }`}
            >
              {rtNum === 0 ? 'Semua' : `0${rtNum}`}
            </button>
          ))}
        </div>
      </div>

      {/* Laporan Card Grid (Tactile Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-[20px] border border-[#E8E8E2] text-[#8B8FA3]">
            Tidak ada laporan kendala warga yang sesuai dengan kriteria filter saat ini.
          </div>
        ) : (
          filtered.map((lap) => (
            <div
              key={lap.id}
              className="rounded-[20px] bg-[#FFFFFF] border border-[#E8E8E2] overflow-hidden shadow-tactile shadow-tactile-hover flex flex-col justify-between"
            >
              <div>
                {/* Photo Preview if available */}
                {lap.fotoUrl && (
                  <div className="relative h-44 w-full bg-[#E8E8E2] overflow-hidden">
                    <img
                      src={lap.fotoUrl}
                      alt={lap.judul}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-[8px] bg-[#464B71]/90 text-white text-[11px] font-semibold backdrop-blur-xs">
                        {lap.kategori}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-[8px] bg-white/95 text-[#1F2232] text-[11px] font-bold shadow-sm">
                        RT 0{lap.rt}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={lap.status} />
                    <span className="text-[11px] text-[#8B8FA3] flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {lap.createdAt}
                    </span>
                  </div>

                  <h2 className="text-sm font-bold text-[#1F2232] leading-snug line-clamp-2">
                    {lap.judul}
                  </h2>

                  <p className="text-xs text-[#585C74] line-clamp-3 leading-relaxed">
                    {lap.keluhan}
                  </p>

                  <div className="pt-2 border-t border-[#E8E8E2] text-[11px] text-[#585C74] space-y-1">
                    <div className="flex items-center text-[#1F2232] font-semibold">
                      <span className="mr-1">Pelapor:</span> {lap.pelaporNama} ({lap.pelaporTelepon})
                    </div>
                    <div className="flex items-center text-[#8B8FA3] truncate">
                      <MapPin className="w-3 h-3 mr-1 shrink-0 text-[#118AB2]" />
                      <span className="truncate">{lap.lokasiSpesifik}</span>
                    </div>
                  </div>

                  {lap.catatanAdmin && (
                    <div className="p-2.5 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-[11px] text-[#464B71]">
                      <div className="font-semibold text-[#118AB2] mb-0.5">Tindak Lanjut Desa:</div>
                      <p className="italic">"{lap.catatanAdmin}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[#F2F2ED]/60 border-t border-[#E8E8E2]">
                <button
                  type="button"
                  onClick={() => handleOpenDetail(lap)}
                  className="w-full py-2 rounded-[12px] bg-[#464B71] hover:bg-[#373B5A] text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-[#118AB2]"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-[#7CD5C7]" />
                  <span>Tindak Lanjuti Status</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Tindak Lanjut Pengaduan */}
      {selectedLaporan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[22px] bg-white border border-[#E8E8E2] shadow-tactile overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#F2F2ED]">
              <div>
                <h2 className="text-sm font-bold text-[#1F2232]">
                  Tindak Lanjut Laporan Warga
                </h2>
                <span className="text-[11px] text-[#585C74]">ID: {selectedLaporan.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLaporan(null)}
                className="p-1.5 rounded-[8px] hover:bg-[#E8E8E2] text-[#585C74]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="p-5 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#118AB2] uppercase">
                  {selectedLaporan.kategori} &bull; RT 0{selectedLaporan.rt}
                </span>
                <h3 className="text-base font-bold text-[#1F2232]">
                  {selectedLaporan.judul}
                </h3>
                <p className="text-xs text-[#585C74] bg-[#F2F2ED] p-3 rounded-[12px] border border-[#E8E8E2]">
                  {selectedLaporan.keluhan}
                </p>
              </div>

              <div className="text-xs text-[#585C74] flex items-center justify-between border-b border-[#E8E8E2] pb-3">
                <span>Pelapor: <strong>{selectedLaporan.pelaporNama}</strong></span>
                <span>Kontak: <strong>{selectedLaporan.pelaporTelepon}</strong></span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1.5">
                  Pilih Status Penanganan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'belum_dikerjakan', label: 'Belum Dikerjakan' },
                    { id: 'menunggu_info_lanjut', label: 'Menunggu Info Lanjut' },
                    { id: 'sudah_dikerjakan', label: 'Sudah Dikerjakan' },
                  ].map((s) => (
                    <button
                      key={`modal-status-${s.id}`}
                      type="button"
                      onClick={() => setStatusUpdate(s.id as LaporanStatus)}
                      className={`p-2.5 rounded-[12px] border text-xs font-semibold transition-all text-center ${
                        statusUpdate === s.id
                          ? 'border-[#118AB2] bg-[#E2F6F3] text-[#118AB2] ring-2 ring-[#118AB2]/30'
                          : 'border-[#E8E8E2] bg-white text-[#585C74] hover:bg-[#F2F2ED]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  Catatan Tindak Lanjut Admin / Petugas:
                </label>
                <textarea
                  rows={3}
                  value={catatanAdmin}
                  onChange={(e) => setCatatanAdmin(e.target.value)}
                  placeholder="Tuliskan keterangan penanganan untuk warga (misal: 'Petugas PJU telah mengganti bohlam', dll)..."
                  className="w-full px-3 py-2 rounded-[12px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E8E8E2]">
                <button
                  type="button"
                  onClick={() => setSelectedLaporan(null)}
                  className="px-4 py-2 rounded-[10px] bg-[#E8E8E2] text-[#585C74] text-xs font-semibold hover:bg-[#deded6]"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-[10px] bg-[#464B71] text-white text-xs font-semibold hover:bg-[#373B5A] flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#7CD5C7]" />
                  <span>Simpan Tindak Lanjut</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
