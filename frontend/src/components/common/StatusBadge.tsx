import React from 'react';
import type { LaporanStatus } from '../../types';

interface StatusBadgeProps {
  status: LaporanStatus | 'aktif' | 'selesai' | 'dibaca' | 'belum_dibaca';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'belum_dikerjakan':
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-[#E8E8E2] text-[#464B71] border border-[#D5D5CE] ${className}`}>
          Belum Dikerjakan
        </span>
      );
    case 'menunggu_info_lanjut':
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] ${className}`}>
          Menunggu Info Lanjut
        </span>
      );
    case 'sudah_dikerjakan':
    case 'selesai':
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-[#E2F6F3] text-[#118AB2] border border-[#7CD5C7]/50 ${className}`}>
          Sudah Dikerjakan
        </span>
      );
    case 'aktif':
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-[#E2F6F3] text-[#118AB2] border border-[#7CD5C7]/50 ${className}`}>
          Penggalangan Aktif
        </span>
      );
    case 'belum_dibaca':
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] ${className}`}>
          Surat Baru
        </span>
      );
    case 'dibaca':
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-[#E8E8E2] text-[#585C74] border border-[#D5D5CE] ${className}`}>
          Sudah Dibaca
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-[#E8E8E2] text-[#1F2232] ${className}`}>
          {status}
        </span>
      );
  }
};
