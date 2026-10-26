import React, { useState } from 'react';
import type { Penduduk, RTNumber } from '../../types';
import { InteractiveMap } from '../common/InteractiveMap';
import { 
  Users, 
  MapPin, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Map as MapIcon, 
  ListFilter
} from 'lucide-react';

interface PendudukManagementProps {
  pendudukList: Penduduk[];
  onAddPenduduk: (p: Omit<Penduduk, 'id'>) => void;
  onUpdatePenduduk: (id: string, p: Partial<Penduduk>) => void;
  onDeletePenduduk: (id: string) => void;
  initialRt?: RTNumber;
}

export const PendudukManagement: React.FC<PendudukManagementProps> = ({
  pendudukList,
  onAddPenduduk,
  onUpdatePenduduk,
  onDeletePenduduk,
  initialRt = 1,
}) => {
  const [filterRt, setFilterRt] = useState<number>(0); // 0 means All RTs
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'table' | 'map'>('split');
  const [selectedPenduduk, setSelectedPenduduk] = useState<Penduduk | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nik: '',
    nama: '',
    umur: 30,
    jenisKelamin: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    rt: initialRt as RTNumber,
    alamatRumah: '',
    latitude: -6.914600,
    longitude: 107.609600,
    pekerjaan: 'Wiraswasta',
  });

  // Filtered list
  const filteredList = pendudukList.filter((p) => {
    const matchRt = filterRt === 0 || p.rt === filterRt;
    const matchQuery =
      searchQuery === '' ||
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nik.includes(searchQuery) ||
      p.alamatRumah.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRt && matchQuery;
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      nik: `330101${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      nama: '',
      umur: 35,
      jenisKelamin: 'Laki-laki',
      rt: initialRt,
      alamatRumah: `Jl. Sakalputung No. ${Math.floor(1 + Math.random() * 50)}, RT 0${initialRt}`,
      latitude: -6.914600 + (Math.random() - 0.5) * 0.005,
      longitude: 107.609600 + (Math.random() - 0.5) * 0.005,
      pekerjaan: 'Wiraswasta',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Penduduk) => {
    setEditingId(p.id);
    setFormData({
      nik: p.nik,
      nama: p.nama,
      umur: p.umur,
      jenisKelamin: p.jenisKelamin,
      rt: p.rt,
      alamatRumah: p.alamatRumah,
      latitude: p.latitude,
      longitude: p.longitude,
      pekerjaan: p.pekerjaan,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.alamatRumah) return;

    if (editingId) {
      onUpdatePenduduk(editingId, formData);
    } else {
      onAddPenduduk(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2232]">
            Data Penduduk & Pemetaan Rumah (RT 01 - 05)
          </h1>
          <p className="text-sm text-[#585C74] mt-0.5">
            Setiap warga tercatat lengkap dengan identitas kependudukan dan koordinat rumah pada peta digital desa.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-[14px] bg-[#464B71] hover:bg-[#373B5A] text-white text-xs font-semibold shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#118AB2]"
        >
          <Plus className="w-4 h-4 text-[#7CD5C7]" />
          <span>Tambah Data Penduduk</span>
        </button>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="rounded-[20px] bg-[#FFFFFF] border border-[#E8E8E2] p-4 shadow-tactile flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* RT Filter Tabs (Pill Filters per DESIGN.md Section 5) */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-[#8B8FA3] mr-2 flex items-center">
            <ListFilter className="w-3.5 h-3.5 mr-1" />
            RT:
          </span>
          {[0, 1, 2, 3, 4, 5].map((rtNum) => (
            <button
              key={`filter-rt-${rtNum}`}
              type="button"
              onClick={() => setFilterRt(rtNum)}
              className={`px-3 py-1.5 rounded-[9999px] text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#118AB2] ${
                filterRt === rtNum
                  ? 'bg-[#464B71] text-white shadow-sm'
                  : 'bg-[#E8E8E2] text-[#585C74] hover:text-[#1F2232]'
              }`}
            >
              {rtNum === 0 ? 'Semua RT' : `RT 0${rtNum}`}
            </button>
          ))}
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8FA3]" />
            <input
              type="text"
              placeholder="Cari NIK, Nama, Alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-[12px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] placeholder-[#8B8FA3] focus:bg-white focus:border-[#118AB2] focus:outline-none"
            />
          </div>

          <div className="flex rounded-[12px] bg-[#E8E8E2] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-[10px] transition-colors ${
                viewMode === 'split' ? 'bg-white text-[#464B71] shadow-sm' : 'text-[#585C74]'
              }`}
            >
              Kombinasi
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-[10px] transition-colors ${
                viewMode === 'table' ? 'bg-white text-[#464B71] shadow-sm' : 'text-[#585C74]'
              }`}
            >
              Tabel
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-[10px] transition-colors ${
                viewMode === 'map' ? 'bg-white text-[#464B71] shadow-sm' : 'text-[#585C74]'
              }`}
            >
              Peta
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Table View */}
        {(viewMode === 'split' || viewMode === 'table') && (
          <div className={`rounded-[22px] bg-[#FFFFFF] border border-[#E8E8E2] shadow-tactile overflow-hidden flex flex-col ${
            viewMode === 'split' ? 'lg:col-span-7' : 'w-full'
          }`}>
            <div className="p-4 border-b border-[#E8E8E2] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#464B71]" />
                <h2 className="text-sm font-bold text-[#1F2232]">
                  Daftar Penduduk Terdata ({filteredList.length} Orang)
                </h2>
              </div>
              <span className="text-xs text-[#585C74]">Klik baris untuk menyorot di peta</span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F2F2ED] text-[#585C74] border-b border-[#E8E8E2]">
                    <th className="py-2.5 px-4 font-semibold">Nama & NIK</th>
                    <th className="py-2.5 px-3 font-semibold">RT</th>
                    <th className="py-2.5 px-3 font-semibold">Umur / JK</th>
                    <th className="py-2.5 px-3 font-semibold">Alamat Rumah</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E2]">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#8B8FA3]">
                        Tidak ada data penduduk yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((p) => {
                      const isSelected = selectedPenduduk?.id === p.id;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedPenduduk(p)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#E2F6F3]/40' : 'hover:bg-[#F2F2ED]/60'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#1F2232]">{p.nama}</div>
                            <div className="text-[11px] text-[#8B8FA3] font-mono">{p.nik}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-[6px] bg-[#E8E8E2] text-[#464B71] font-semibold text-[11px]">
                              RT 0{p.rt}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#585C74]">
                            <div>{p.umur} thn</div>
                            <div className="text-[10px] text-[#8B8FA3]">{p.jenisKelamin}</div>
                          </td>
                          <td className="py-3 px-3 text-[#585C74] max-w-[180px]">
                            <div className="truncate font-medium">{p.alamatRumah}</div>
                            <div className="text-[10px] text-[#118AB2] flex items-center">
                              <MapPin className="w-3 h-3 mr-0.5 inline" />
                              {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                title="Edit Data"
                                className="p-1.5 rounded-[8px] hover:bg-[#E8E8E2] text-[#464B71] transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Yakin ingin menghapus data ${p.nama}?`)) {
                                    onDeletePenduduk(p.id);
                                  }
                                }}
                                title="Hapus Data"
                                className="p-1.5 rounded-[8px] hover:bg-[#FEE2E2] text-[#991B1B] transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Map View */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className={`space-y-4 ${viewMode === 'split' ? 'lg:col-span-5' : 'w-full'}`}>
            <div className="rounded-[22px] bg-[#FFFFFF] border border-[#E8E8E2] p-4 shadow-tactile">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <MapIcon className="w-4 h-4 text-[#118AB2]" />
                  <h2 className="text-sm font-bold text-[#1F2232]">
                    Peta Persebaran Rumah Penduduk
                  </h2>
                </div>
                <span className="text-[11px] text-[#585C74]">
                  {filteredList.length} titik koordinat
                </span>
              </div>

              <InteractiveMap
                pendudukList={filteredList}
                selectedPenduduk={selectedPenduduk}
                onSelectPenduduk={(p) => setSelectedPenduduk(p)}
                height={viewMode === 'split' ? '460px' : '580px'}
              />

              {/* Selected Penduduk Info Callout */}
              {selectedPenduduk && (
                <div className="mt-3 p-3 rounded-[14px] bg-[#F2F2ED] border border-[#E8E8E2] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#1F2232]">{selectedPenduduk.nama} (RT 0{selectedPenduduk.rt})</div>
                    <div className="text-[#585C74] text-[11px]">{selectedPenduduk.alamatRumah}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedPenduduk)}
                    className="px-2.5 py-1 rounded-[8px] bg-[#464B71] text-white text-[11px] font-semibold hover:bg-[#373B5A]"
                  >
                    Edit Koordinat
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Penduduk */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[22px] bg-white border border-[#E8E8E2] shadow-tactile overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#F2F2ED]">
              <h2 className="text-sm font-bold text-[#1F2232]">
                {editingId ? 'Perbarui Data Penduduk' : 'Tambah Data Penduduk Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-[8px] hover:bg-[#E8E8E2] text-[#585C74]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                    NIK (Nomor Induk Kependudukan)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs font-mono text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama warga..."
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                    Umur (Tahun)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={formData.umur}
                    onChange={(e) => setFormData({ ...formData, umur: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as 'Laki-laki' | 'Perempuan' })}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                    Wilayah RT
                  </label>
                  <select
                    value={formData.rt}
                    onChange={(e) => setFormData({ ...formData, rt: Number(e.target.value) as RTNumber })}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs font-bold text-[#464B71] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((rtNum) => (
                      <option key={`rt-opt-${rtNum}`} value={rtNum}>
                        RT 0{rtNum}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  Pekerjaan / Mata Pencaharian
                </label>
                <input
                  type="text"
                  value={formData.pekerjaan}
                  onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                  placeholder="Misal: Wiraswasta, Petani, Guru..."
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                  Alamat Lengkap Rumah
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.alamatRumah}
                  onChange={(e) => setFormData({ ...formData, alamatRumah: e.target.value })}
                  placeholder="Contoh: Jl. Sakalputung Raya No. 12..."
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-[14px] bg-[#F2F2ED] border border-[#E8E8E2] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#464B71] flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-[#118AB2]" />
                    Titik Koordinat Rumah (Maps)
                  </span>
                  <span className="text-[10px] text-[#585C74]">Gunakan peta untuk set titik</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#585C74]">Latitude:</span>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-[8px] bg-white border border-[#E8E8E2] font-mono text-xs text-[#1F2232]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#585C74]">Longitude:</span>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-[8px] bg-white border border-[#E8E8E2] font-mono text-xs text-[#1F2232]"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <InteractiveMap
                    pendudukList={[]}
                    height="180px"
                    isPickerMode={true}
                    onPickCoordinates={(lat, lng) => {
                      setFormData({ ...formData, latitude: lat, longitude: lng });
                    }}
                  />
                </div>
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
                  <span>{editingId ? 'Simpan Perubahan' : 'Tambahkan Penduduk'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
