import React, { useState } from 'react';
import { apiClient } from '../../services/api';
import { storageService } from '../../services/storage';
import type { UserSession } from '../../types';
import {
  Building2,
  ShieldCheck,
  UserCheck,
  UserPlus,
  LogIn,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface LoginScreenProps {
  onAdminLogin: (user: UserSession) => void;
  onWargaLogin: () => void;
  onBack?: () => void;
  mode: 'admin' | 'warga';
  onModeChange: (mode: 'admin' | 'warga') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onAdminLogin,
  onWargaLogin,
  onBack,
  mode,
  onModeChange,
}) => {
  // ---- State Admin ----
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ---- State Warga ----
  const [wargaTab, setWargaTab] = useState<'masuk' | 'daftar'>('masuk');
  const [wargaUsername, setWargaUsername] = useState('');
  const [wargaPassword, setWargaPassword] = useState('');
  const [wargaConfirm, setWargaConfirm] = useState('');
  const [wargaSuccess, setWargaSuccess] = useState<string | null>(null);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user } = await apiClient.adminLogin(username, password);
      onAdminLogin(user);
    } catch (err: any) {
      setError(err?.message || 'Login gagal, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const resetWargaForm = () => {
    setWargaUsername('');
    setWargaPassword('');
    setWargaConfirm('');
    setError(null);
    setWargaSuccess(null);
  };

  const handleWargaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWargaSuccess(null);
    try {
      if (wargaTab === 'daftar') {
        if (wargaPassword !== wargaConfirm) {
          setError('Konfirmasi password tidak sama.');
          return;
        }
        storageService.registerWarga(wargaUsername, wargaPassword);
        setWargaSuccess(`Akun "${wargaUsername}" berhasil dibuat! Silakan masuk.`);
        resetWargaForm();
        setWargaTab('masuk');
      } else {
        storageService.loginWarga(wargaUsername, wargaPassword);
        onWargaLogin();
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan, coba lagi.');
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-[14px] bg-[#F2F2ED] border border-[#E8E8E2] text-sm text-[#1F2232] placeholder-[#8B8FA3] focus:outline-none focus:ring-2 focus:ring-[#118AB2] disabled:opacity-60';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 flex items-center space-x-1.5 text-xs font-semibold text-[#585C74] hover:text-[#464B71] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </button>
        )}
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-[18px] bg-[#464B71] flex items-center justify-center text-white shadow-tactile mb-3">
            <Building2 className="w-7 h-7 text-[#7CD5C7]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#1F2232]">
            Sakalputung
          </h1>
          <p className="text-xs text-[#585C74] font-medium mt-1">
            Sistem Layanan Publik Desa &bull; RT 01 s/d RT 05
          </p>
        </div>

        {/* Pemilih Mode Login Admin / Warga */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => onModeChange('admin')}
            className={`flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-[14px] text-xs sm:text-sm font-semibold transition-colors ${
              mode === 'admin'
                ? 'bg-[#464B71] text-white shadow-sm'
                : 'bg-white border border-[#E8E8E2] text-[#585C74] hover:bg-[#F2F2ED]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin RT</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('warga')}
            className={`flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-[14px] text-xs sm:text-sm font-semibold transition-colors ${
              mode === 'warga'
                ? 'bg-[#464B71] text-white shadow-sm'
                : 'bg-white border border-[#E8E8E2] text-[#585C74] hover:bg-[#F2F2ED]'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Warga</span>
          </button>
        </div>

        {mode === 'admin' ? (
          /* ---------------- LOGIN ADMIN RT ---------------- */
          <div className="bg-white rounded-[20px] border border-[#E8E8E2] shadow-tactile p-6 sm:p-8">
            <div className="flex items-center space-x-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-[#464B71]" />
              <h2 className="text-sm font-bold text-[#1F2232]">
                Login Admin RT
              </h2>
            </div>
            <p className="text-xs text-[#585C74] mb-5">
              Masukkan username dan password yang diberikan untuk RT Anda.
            </p>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold text-[#464B71] mb-1.5"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="misal: rt1 s/d rt5"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#464B71] mb-1.5"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password RT Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className={inputClass}
                />
              </div>

              {error && (
                <div className="flex items-start space-x-2 px-3 py-2.5 rounded-[12px] bg-red-50 border border-red-100 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-[14px] bg-[#464B71] hover:bg-[#3a3f5e] text-white text-sm font-semibold shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#118AB2] disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memeriksa kredensial...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-[#7CD5C7]" />
                    <span>Masuk</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* ---------------- REGISTER & LOGIN WARGA ---------------- */
          <div className="bg-white rounded-[20px] border border-[#E8E8E2] shadow-tactile p-6 sm:p-8">
            <div className="flex items-center space-x-2 mb-1">
              <UserCheck className="w-4 h-4 text-[#464B71]" />
              <h2 className="text-sm font-bold text-[#1F2232]">
                Portal Warga
              </h2>
            </div>
            <p className="text-xs text-[#585C74] mb-4">
              Buat akun dulu dengan username dan password, lalu masuk ke portal warga.
            </p>

            {/* Tab Daftar / Masuk */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-[14px] bg-[#F2F2ED] mb-5">
              {(['daftar', 'masuk'] as const).map((tab) => (
                <button
                  key={`warga-tab-${tab}`}
                  type="button"
                  onClick={() => {
                    setWargaTab(tab);
                    setError(null);
                    setWargaSuccess(null);
                  }}
                  className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold transition-colors ${
                    wargaTab === tab
                      ? 'bg-white text-[#464B71] shadow-sm'
                      : 'text-[#8B8FA3] hover:text-[#585C74]'
                  }`}
                >
                  {tab === 'daftar' ? (
                    <UserPlus className="w-3.5 h-3.5" />
                  ) : (
                    <LogIn className="w-3.5 h-3.5" />
                  )}
                  <span>{tab === 'daftar' ? 'Daftar Akun' : 'Masuk'}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleWargaSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="warga-username"
                  className="block text-xs font-semibold text-[#464B71] mb-1.5"
                >
                  Username
                </label>
                <input
                  id="warga-username"
                  type="text"
                  autoComplete="username"
                  placeholder={wargaTab === 'daftar' ? 'Buat username Anda' : 'Username Anda'}
                  value={wargaUsername}
                  onChange={(e) => setWargaUsername(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="warga-password"
                  className="block text-xs font-semibold text-[#464B71] mb-1.5"
                >
                  Password
                </label>
                <input
                  id="warga-password"
                  type="password"
                  autoComplete={wargaTab === 'daftar' ? 'new-password' : 'current-password'}
                  placeholder={wargaTab === 'daftar' ? 'Minimal 6 karakter' : 'Password Anda'}
                  value={wargaPassword}
                  onChange={(e) => setWargaPassword(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              {wargaTab === 'daftar' && (
                <div>
                  <label
                    htmlFor="warga-confirm"
                    className="block text-xs font-semibold text-[#464B71] mb-1.5"
                  >
                    Konfirmasi Password
                  </label>
                  <input
                    id="warga-confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Ulangi password Anda"
                    value={wargaConfirm}
                    onChange={(e) => setWargaConfirm(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              )}

              {error && (
                <div className="flex items-start space-x-2 px-3 py-2.5 rounded-[12px] bg-red-50 border border-red-100 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {wargaSuccess && (
                <div className="flex items-start space-x-2 px-3 py-2.5 rounded-[12px] bg-[#E2F6F3] border border-[#7CD5C7]/40 text-xs text-[#118AB2]">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{wargaSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-[14px] bg-[#464B71] hover:bg-[#3a3f5e] text-white text-sm font-semibold shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#118AB2]"
              >
                {wargaTab === 'daftar' ? (
                  <>
                    <UserPlus className="w-4 h-4 text-[#7CD5C7]" />
                    <span>Daftar Sekarang</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-[#7CD5C7]" />
                    <span>Masuk Portal Warga</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
