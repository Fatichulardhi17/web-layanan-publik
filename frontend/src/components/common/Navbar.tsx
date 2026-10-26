import React from 'react';
import type { UserSession } from '../../types';
import { 
  Building2, 
  Users, 
  AlertCircle, 
  FileText, 
  Mail, 
  HeartHandshake, 
  Home,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  user: UserSession;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  unreadSuratCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onTabChange,
  onLogout,
  unreadSuratCount
}) => {

  interface NavTab {
    id: string;
    label: string;
    icon: typeof Building2;
    badge?: number;
  }

  const adminTabs: NavTab[] = [
    { id: 'dashboard', label: 'Ringkasan', icon: Building2 },
    { id: 'penduduk', label: 'Penduduk & Peta', icon: Users },
    { id: 'laporan', label: 'Kelola Laporan', icon: AlertCircle },
    { id: 'berita', label: 'Publikasi Berita', icon: FileText },
    { id: 'surat', label: 'Surat Masuk Pusat', icon: Mail },
    { id: 'donasi', label: 'Forum Donasi', icon: HeartHandshake },
  ];

  const wargaTabs: NavTab[] = [
    { id: 'beranda', label: 'Beranda Warga', icon: Home },
    { id: 'pengaduan', label: 'Buat Pengaduan', icon: AlertCircle },
    { 
      id: 'kabar-surat', 
      label: 'Kabar Surat Pusat', 
      icon: Mail, 
      badge: unreadSuratCount > 0 ? unreadSuratCount : undefined 
    },
    { id: 'berita', label: 'Kabar Desa', icon: FileText },
    { id: 'donasi', label: 'Donasi Desa', icon: HeartHandshake },
  ];

  const currentTabs = user.role === 'admin' ? adminTabs : wargaTabs;

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E8E8E2] shadow-[0_2px_10px_-2px_rgba(70,75,113,0.05)]">
      {/* Top Bar: Brand, Role Indicator, User Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-[14px] bg-[#464B71] flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5 text-[#7CD5C7]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-[#1F2232]">
                  Sakalputung
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-[9999px] bg-[#E2F6F3] text-[#118AB2]">
                  {user.role === 'admin' ? `Admin RT 0${user.rt || 1}` : 'Portal Warga'}
                </span>
              </div>
              <p className="text-[11px] text-[#585C74] font-medium hidden sm:block">
                Layanan Publik & Administrasi Kependudukan Desa
              </p>
            </div>
          </div>

          {/* Logout & User Status */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-[14px] bg-[#F2F2ED] hover:bg-red-50 text-[#464B71] hover:text-red-600 text-xs font-semibold border border-[#E8E8E2] transition-colors focus-visible:ring-2 focus-visible:ring-[#118AB2]"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>

            {/* Active User Chip */}
            <div className="hidden md:flex items-center space-x-2 pl-3 border-l border-[#E8E8E2]">
              <div className="w-8 h-8 rounded-full bg-[#464B71] text-white flex items-center justify-center text-xs font-bold">
                {user.role === 'admin' ? `RT` : user.nama ? user.nama.charAt(0).toUpperCase() : 'W'}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-[#1F2232] leading-tight">
                  {user.role === 'admin' ? user.nama : user.nama || 'Warga'}
                </div>
                <div className="text-[11px] text-[#8B8FA3] leading-none">
                  {user.role === 'admin' ? `Kewenangan RT 0${user.rt}` : `Domisili RT 0${user.rt}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Design System Section 5: Pill Filters & Tabs) */}
        <nav 
          className="flex space-x-1.5 overflow-x-auto py-2.5 no-scrollbar"
          aria-label="Tabs"
        >
          {currentTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-[9999px] text-xs font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-[#118AB2] ${
                  isActive
                    ? 'bg-[#464B71] text-white shadow-sm'
                    : 'bg-[#E8E8E2] text-[#585C74] hover:text-[#1F2232] hover:bg-[#deded6]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#7CD5C7]' : 'text-[#585C74]'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#118AB2] text-white text-[10px] font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
