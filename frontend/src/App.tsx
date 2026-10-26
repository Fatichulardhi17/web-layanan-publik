import React, { useState, useEffect } from 'react';
import { storageService } from './services/storage';
import type { UserSession, Penduduk, Laporan, Berita, SuratPusat, DonasiKegiatan } from './types';
import { Navbar } from './components/common/Navbar';
import { LoginScreen } from './components/common/LoginScreen';
import { LandingPage } from './components/common/LandingPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PendudukManagement } from './components/admin/PendudukManagement';
import { LaporanManagement } from './components/admin/LaporanManagement';
import { BeritaManagement } from './components/admin/BeritaManagement';
import { SuratManagement } from './components/admin/SuratManagement';
import { DonasiManagement } from './components/admin/DonasiManagement';
import { WargaPortal } from './components/warga/WargaPortal';
import { WargaPengaduan } from './components/warga/WargaPengaduan';
import { WargaSuratInbox } from './components/warga/WargaSuratInbox';
import { WargaBerita } from './components/warga/WargaBerita';
import { WargaDonasi } from './components/warga/WargaDonasi';
import { Building2, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<UserSession | null>(storageService.getUser());
  const [penduduk, setPenduduk] = useState<Penduduk[]>(storageService.getPenduduk());
  const [laporan, setLaporan] = useState<Laporan[]>(storageService.getLaporan());
  const [berita, setBerita] = useState<Berita[]>(storageService.getBerita());
  const [surat, setSurat] = useState<SuratPusat[]>(storageService.getSurat());
  const [donasi, setDonasi] = useState<DonasiKegiatan[]>(storageService.getDonasi());

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>(user?.role === 'admin' ? 'dashboard' : 'beranda');

  // Halaman publik: 'landing' (halaman utama) atau 'login' (halaman login terpisah)
  const [publicView, setPublicView] = useState<'landing' | 'login'>('landing');
  const [loginMode, setLoginMode] = useState<'admin' | 'warga'>('admin');

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setUser(storageService.getUser());
      setPenduduk(storageService.getPenduduk());
      setLaporan(storageService.getLaporan());
      setBerita(storageService.getBerita());
      setSurat(storageService.getSurat());
      setDonasi(storageService.getDonasi());
    });
    return unsubscribe;
  }, []);

  // Halaman publik: landing page dulu, login di halaman terpisah
  if (!user) {
    if (publicView === 'landing') {
      return (
        <LandingPage
          onGoToLogin={(mode) => {
            setLoginMode(mode);
            setPublicView('login');
          }}
        />
      );
    }
    return (
      <div className="min-h-screen bg-[#F2F2ED] text-[#1F2232] selection:bg-[#7CD5C7]/30">
        <LoginScreen
          mode={loginMode}
          onModeChange={(m) => setLoginMode(m)}
          onAdminLogin={(authenticated) => {
            storageService.loginAdmin(authenticated);
            setUser(authenticated);
            setActiveTab(authenticated.role === 'admin' ? 'dashboard' : 'beranda');
          }}
          onWargaLogin={() => {
            setActiveTab('beranda');
          }}
          onBack={() => setPublicView('landing')}
        />
      </div>
    );
  }

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setActiveTab('beranda');
    setPublicView('landing');
  };

  const unreadSuratCount = surat.filter((s) => s.dibagikanOtomatis && !s.sudahDibaca).length;

  return (
    <div className="min-h-screen bg-[#F2F2ED] text-[#1F2232] flex flex-col justify-between selection:bg-[#7CD5C7]/30">
      <div>
        {/* Navigation Bar */}
        <Navbar
          user={user}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onLogout={handleLogout}
          unreadSuratCount={unreadSuratCount}
        />

        {/* Main Content Viewport */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {user.role === 'admin' ? (
            <>
              {activeTab === 'dashboard' && (
                <AdminDashboard
                  penduduk={penduduk}
                  laporan={laporan}
                  surat={surat}
                  donasi={donasi}
                  onNavigateTab={(t) => setActiveTab(t)}
                  currentRt={user.rt}
                />
              )}

              {activeTab === 'penduduk' && (
                <PendudukManagement
                  pendudukList={penduduk}
                  onAddPenduduk={(p) => storageService.addPenduduk(p)}
                  onUpdatePenduduk={(id, p) => storageService.updatePenduduk(id, p)}
                  onDeletePenduduk={(id) => storageService.deletePenduduk(id)}
                  initialRt={user.rt || 1}
                />
              )}

              {activeTab === 'laporan' && (
                <LaporanManagement
                  laporanList={laporan}
                  onUpdateStatus={(id, st, cat) => storageService.updateLaporanStatus(id, st, cat)}
                  currentRt={user.rt}
                />
              )}

              {activeTab === 'berita' && (
                <BeritaManagement
                  beritaList={berita}
                  onAddBerita={(b) => storageService.addBerita(b)}
                />
              )}

              {activeTab === 'surat' && (
                <SuratManagement
                  suratList={surat}
                  onAddSurat={(s) => storageService.addSurat(s)}
                />
              )}

              {activeTab === 'donasi' && (
                <DonasiManagement
                  donasiList={donasi}
                  onAddDonasi={(d) => storageService.addDonasiKegiatan(d)}
                />
              )}
            </>
          ) : (
            <>
              {activeTab === 'beranda' && (
                <WargaPortal
                  user={user}
                  onUpdateProfile={(updated) => storageService.setUser({ ...user, ...updated })}
                  laporanList={laporan}
                  suratList={surat}
                  donasiList={donasi}
                  onNavigateTab={(t) => setActiveTab(t)}
                />
              )}

              {activeTab === 'pengaduan' && (
                <WargaPengaduan
                  user={user}
                  laporanList={laporan}
                  onSubmitLaporan={(lap) => storageService.addLaporan(lap)}
                />
              )}

              {activeTab === 'kabar-surat' && (
                <WargaSuratInbox
                  suratList={surat}
                  onMarkAsRead={(id) => storageService.markSuratAsRead(id)}
                />
              )}

              {activeTab === 'berita' && (
                <WargaBerita
                  beritaList={berita}
                  onReadBerita={(id) => storageService.incrementBeritaViews(id)}
                />
              )}

              {activeTab === 'donasi' && (
                <WargaDonasi
                  user={user}
                  donasiList={donasi}
                  onSubmitDonasi={(kegId, nama, jml, doa, anon, met) =>
                    storageService.submitDonasiPayment(kegId, nama, jml, doa, anon, met)
                  }
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Footer Content-Driven (per antislop C-3 and R-05) */}
      <footer className="mt-12 bg-[#FFFFFF] border-t border-[#E8E8E2] py-6 text-xs text-[#585C74]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-[8px] bg-[#464B71] text-white flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-[#7CD5C7]" />
            </div>
            <span className="font-bold text-[#1F2232]">
              Sakalputung &bull; Sistem Layanan Publik Desa
            </span>
            <span className="text-[#8B8FA3]">RT 01 s/d RT 05</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <span>Terhubung dengan Supabase PostgreSQL & Backend Go (Gin)</span>
            <span className="flex items-center text-[#118AB2] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#7CD5C7]" />
              Modern Tactile Minimal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
