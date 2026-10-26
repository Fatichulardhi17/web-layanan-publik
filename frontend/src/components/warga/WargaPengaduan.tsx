import React, { useState } from 'react';
import type { Laporan, UserSession, RTNumber } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { CameraCapture } from '../common/CameraCapture';
import { 
  AlertCircle, 
  Send, 
  MapPin, 
  Clock, 
  CheckCircle2
} from 'lucide-react';

interface WargaPengaduanProps {
  user: UserSession;
  laporanList: Laporan[];
  onSubmitLaporan: (lap: Omit<Laporan, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
}

export const WargaPengaduan: React.FC<WargaPengaduanProps> = ({
  user,
  laporanList,
  onSubmitLaporan,
}) => {
  const [formData, setFormData] = useState({
    judul: '',
    kategori: 'Infrastruktur' as Laporan['kategori'],
    rt: (user.rt || 1) as RTNumber,
    lokasiSpesifik: '',
    keluhan: '',
    fotoUrl: '',
  });

  const [isSuccessAlert, setIsSuccessAlert] = useState(false);
  const [fotoError, setFotoError] = useState<string | null>(null);

  // Filter laporan milik warga / RT warga
  const myReports = laporanList.filter(
    (l) => l.pelaporNama.toLowerCase() === (user.nama || '').toLowerCase() || l.rt === user.rt
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul || !formData.keluhan || !formData.lokasiSpesifik) return;

    // Foto dari kamera wajib dilampirkan (tanpa URL)
    if (!formData.fotoUrl) {
      setFotoError('Foto bukti dari kamera wajib dilampirkan sebelum laporan dikirim.');
      return;
    }
    setFotoError(null);

    onSubmitLaporan({
      ...formData,
      pelaporNama: user.nama || 'Warga Sakalputung',
      pelaporTelepon: user.nomorTelepon || '081234567890',
    });

    setIsSuccessAlert(true);
    setFormData({
      judul: '',
      kategori: 'Infrastruktur',
      rt: (user.rt || 1) as RTNumber,
      lokasiSpesifik: '',
      keluhan: '',
      fotoUrl: '',
    });

    setTimeout(() => {
      setIsSuccessAlert(false);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1F2232]">
          Layanan Pengaduan Kendala Lingkungan Warga
        </h1>
        <p className="text-sm text-[#585C74] mt-0.5">
          Sampaikan keluhan fasilitas rusak, saluran mampet, atau keamanan desa untuk segera ditindaklanjuti pengurus RT dan desa.
        </p>
      </div>

      {isSuccessAlert && (
        <div className="p-4 rounded-[16px] bg-[#E2F6F3] border border-[#7CD5C7] text-xs text-[#118AB2] flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-bold">
            Pengaduan Anda berhasil dikirim ke pengurus RT dan pemerintah desa Sakalputung! Petugas akan segera memverifikasi laporan Anda.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Pengaduan (Lefthand Column) */}
        <div className="lg:col-span-5 rounded-[22px] bg-[#FFFFFF] border border-[#E8E8E2] p-6 shadow-tactile">
          <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-[#E8E8E2]">
            <AlertCircle className="w-5 h-5 text-[#118AB2]" />
            <h2 className="text-base font-bold text-[#1F2232]">
              Formulir Pengaduan Baru
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                Kategori Kendala
              </label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value as Laporan['kategori'] })}
                className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs font-semibold text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
              >
                <option value="Infrastruktur">Infrastruktur (Jalan, Jembatan, Trotoar)</option>
                <option value="Penerangan Jalan">Penerangan Jalan Umum (PJU Mati)</option>
                <option value="Kebersihan">Kebersihan & Drainase (Sampah, Selokan Mampet)</option>
                <option value="Keamanan">Keamanan & Ketertiban Lingkungan</option>
                <option value="Sosial / Warga">Pelayanan Sosial & Kemasyarakatan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                Judul Keluhan Singkat
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Aspal Ambles di Dekat Balai RT 01..."
                value={formData.judul}
                onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  Wilayah RT Lokasi
                </label>
                <select
                  value={formData.rt}
                  onChange={(e) => setFormData({ ...formData, rt: Number(e.target.value) as RTNumber })}
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs font-bold text-[#464B71] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                >
                  {[1, 2, 3, 4, 5].map((rtNum) => (
                    <option key={`rt-lapor-${rtNum}`} value={rtNum}>
                      RT 0{rtNum}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  Titik Patokan Lokasi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Depan rumah No. 12..."
                  value={formData.lokasiSpesifik}
                  onChange={(e) => setFormData({ ...formData, lokasiSpesifik: e.target.value })}
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                Rincian Keluhan / Kendala yang Terjadi
              </label>
              <textarea
                required
                rows={4}
                placeholder="Jelaskan detail kondisi di lapangan dan bahayanya bagi warga..."
                value={formData.keluhan}
                onChange={(e) => setFormData({ ...formData, keluhan: e.target.value })}
                className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
              />
            </div>

            <CameraCapture
              currentPhoto={formData.fotoUrl}
              error={fotoError || undefined}
              onCapture={(dataUrl) => {
                setFormData({ ...formData, fotoUrl: dataUrl });
                if (dataUrl) {
                  setFotoError(null);
                }
              }}
            />

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-[12px] bg-[#464B71] hover:bg-[#373B5A] text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-[#118AB2]"
              >
                <Send className="w-4 h-4 text-[#7CD5C7]" />
                <span>Kirim Laporan Pengaduan</span>
              </button>
            </div>
          </form>
        </div>

        {/* Riwayat Pengaduan (Righthand Column) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-[22px] bg-[#FFFFFF] border border-[#E8E8E2] p-6 shadow-tactile">
            <h2 className="text-base font-bold text-[#1F2232] mb-1">
              Riwayat Pengaduan di Lingkungan Anda
            </h2>
            <p className="text-xs text-[#585C74] mb-4">
              Semua laporan warga diproses secara berjenjang oleh pengurus RT dan tim sarana desa.
            </p>

            <div className="space-y-4">
              {myReports.length === 0 ? (
                <div className="py-12 text-center text-[#8B8FA3] text-xs">
                  Belum ada pengaduan yang dikirim. Formulir di sebelah kiri dapat digunakan kapan saja.
                </div>
              ) : (
                myReports.map((lap) => (
                  <div
                    key={lap.id}
                    className="p-4 rounded-[16px] bg-[#F2F2ED] border border-[#E8E8E2] space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-[#118AB2] block">
                          {lap.kategori} &bull; RT 0{lap.rt}
                        </span>
                        <h3 className="text-sm font-bold text-[#1F2232] mt-0.5">
                          {lap.judul}
                        </h3>
                      </div>
                      <StatusBadge status={lap.status} />
                    </div>

                    <p className="text-xs text-[#585C74] leading-relaxed">
                      {lap.keluhan}
                    </p>

                    {lap.fotoUrl && (
                      <div className="w-24 h-16 rounded-[8px] overflow-hidden bg-[#E8E8E2] border border-[#D5D5CE]">
                        <img
                          src={lap.fotoUrl}
                          alt="Foto bukti"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {lap.catatanAdmin && (
                      <div className="p-3 rounded-[10px] bg-white border border-[#E8E8E2] text-xs text-[#1F2232]">
                        <div className="font-bold text-[#118AB2] text-[11px] mb-0.5">
                          Tanggapan Petugas Desa:
                        </div>
                        <p className="italic text-[#585C74]">"{lap.catatanAdmin}"</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#E8E8E2] text-[11px] text-[#8B8FA3] flex items-center justify-between">
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-[#118AB2]" />
                        {lap.lokasiSpesifik}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {lap.createdAt}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
