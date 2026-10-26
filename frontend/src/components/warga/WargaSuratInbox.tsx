import React, { useState } from 'react';
import type { SuratPusat } from '../../types';
import { Mail, Calendar, FileText, CheckCircle2, X } from 'lucide-react';

interface WargaSuratInboxProps {
  suratList: SuratPusat[];
  onMarkAsRead: (id: string) => void;
}

export const WargaSuratInbox: React.FC<WargaSuratInboxProps> = ({
  suratList,
  onMarkAsRead,
}) => {
  const [selectedSurat, setSelectedSurat] = useState<SuratPusat | null>(null);

  const sharedSurat = suratList.filter((s) => s.dibagikanOtomatis);

  const handleOpenDetail = (srt: SuratPusat) => {
    setSelectedSurat(srt);
    if (!srt.sudahDibaca) {
      onMarkAsRead(srt.id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1F2232]">
          Kotak Masuk Kabar Surat Resmi dari Pusat
        </h1>
        <p className="text-sm text-[#585C74] mt-0.5">
          Surat edaran, pengumuman bantuan pusat, dan instruksi kedinasan yang telah diteruskan oleh pengurus desa kepada warga.
        </p>
      </div>

      <div className="space-y-4">
        {sharedSurat.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-[22px] border border-[#E8E8E2] text-[#8B8FA3] text-xs">
            Belum ada surat dinas dari pusat yang dibagikan.
          </div>
        ) : (
          sharedSurat.map((srt) => (
            <div
              key={srt.id}
              onClick={() => handleOpenDetail(srt)}
              className={`p-5 rounded-[20px] bg-[#FFFFFF] border transition-all cursor-pointer shadow-tactile shadow-tactile-hover flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                srt.sudahDibaca ? 'border-[#E8E8E2]' : 'border-[#118AB2]/40 ring-1 ring-[#118AB2]/20'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 ${
                  srt.sudahDibaca ? 'bg-[#E8E8E2] text-[#585C74]' : 'bg-[#E2F6F3] text-[#118AB2]'
                }`}>
                  <Mail className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#118AB2]">
                      {srt.instansiPusat}
                    </span>
                    <span className="text-[11px] font-mono text-[#8B8FA3]">
                      &bull; {srt.nomorSurat}
                    </span>
                    {!srt.sudahDibaca && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#991B1B] text-[10px] font-bold">
                        Surat Baru
                      </span>
                    )}
                  </div>

                  <h2 className="text-sm font-bold text-[#1F2232]">
                    {srt.perihal}
                  </h2>

                  <p className="text-xs text-[#585C74] line-clamp-2 max-w-3xl">
                    {srt.ringkasan}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center space-x-3 text-xs">
                <span className="text-[11px] text-[#8B8FA3] flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {srt.tanggalSurat}
                </span>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-[10px] bg-[#464B71] hover:bg-[#373B5A] text-white font-semibold transition-colors"
                >
                  Buka Detail
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Detail Surat Dinas */}
      {selectedSurat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[22px] bg-white border border-[#E8E8E2] shadow-tactile overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#F2F2ED]">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#118AB2]" />
                <h2 className="text-sm font-bold text-[#1F2232]">Surat Resmi Instansi Pusat</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSurat(null)}
                className="p-1.5 rounded-[8px] hover:bg-[#E8E8E2] text-[#585C74]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="p-3.5 rounded-[14px] bg-[#F2F2ED] border border-[#E8E8E2] space-y-1">
                <div className="text-[11px] text-[#8B8FA3] uppercase font-bold tracking-wider">
                  Pengirim Resmi:
                </div>
                <div className="font-bold text-[#464B71] text-sm">
                  {selectedSurat.instansiPusat}
                </div>
                <div className="text-[11px] font-mono text-[#585C74]">
                  Nomor: {selectedSurat.nomorSurat}
                </div>
                <div className="text-[11px] text-[#585C74]">
                  Tanggal Diterbitkan: {selectedSurat.tanggalSurat}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-[#1F2232] text-sm mb-2">
                  Perihal: {selectedSurat.perihal}
                </h3>
                <div className="p-4 rounded-[12px] bg-white border border-[#E8E8E2] text-[#1F2232] leading-relaxed text-xs space-y-2">
                  <p>{selectedSurat.ringkasan}</p>
                  <p className="text-[11px] text-[#8B8FA3] pt-2 border-t border-[#E8E8E2]">
                    Surat ini telah diverifikasi oleh Sekretariat Desa Sakalputung dan diteruskan otomatis ke seluruh warga desa.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#F2F2ED]/60 border-t border-[#E8E8E2] flex items-center justify-between">
              <span className="text-[11px] text-[#118AB2] font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Status: Sudah Dibaca
              </span>
              <button
                type="button"
                onClick={() => setSelectedSurat(null)}
                className="px-4 py-2 rounded-[10px] bg-[#464B71] text-white font-semibold text-xs hover:bg-[#373B5A]"
              >
                Tutup Surat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
