import type { Penduduk, Laporan, Berita, SuratPusat, DonasiKegiatan, UserSession, WargaAccount, LaporanStatus } from '../types';
import { initialPenduduk, initialLaporan, initialBerita, initialSurat, initialDonasi } from './mockData';

const STORAGE_KEYS = {
  USER: 'sakalputung_user',
  PENDUDUK: 'sakalputung_penduduk',
  LAPORAN: 'sakalputung_laporan',
  BERITA: 'sakalputung_berita',
  SURAT: 'sakalputung_surat',
  DONASI: 'sakalputung_donasi',
  API_MODE: 'sakalputung_api_mode',
  WARGA_ACCOUNTS: 'sakalputung_warga_accounts',
};

class StorageService {
  private user: UserSession | null;
  private penduduk: Penduduk[];
  private laporan: Laporan[];
  private berita: Berita[];
  private surat: SuratPusat[];
  private donasi: DonasiKegiatan[];
  private listeners: (() => void)[] = [];

  constructor() {
    // Sesi tersimpan: admin via token, warga via akun username/password
    const storedUser = this.loadFromStorage<UserSession | null>(STORAGE_KEYS.USER, null);
    this.user = storedUser && (storedUser.token || storedUser.role === 'warga') ? storedUser : null;

    this.penduduk = this.loadFromStorage(STORAGE_KEYS.PENDUDUK, initialPenduduk);
    this.laporan = this.loadFromStorage(STORAGE_KEYS.LAPORAN, initialLaporan);
    this.berita = this.loadFromStorage(STORAGE_KEYS.BERITA, initialBerita);
    this.surat = this.loadFromStorage(STORAGE_KEYS.SURAT, initialSurat);
    this.donasi = this.loadFromStorage(STORAGE_KEYS.DONASI, initialDonasi);
  }

  private loadFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Fallback
    }
    return defaultValue;
  }

  private saveToStorage(key: string, data: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      this.notifyListeners();
    } catch {
      // Ignore
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l());
  }

  // User & Auth
  public getUser(): UserSession | null {
    return this.user;
  }

  public setUser(user: UserSession | null) {
    this.user = user;
    this.saveToStorage(STORAGE_KEYS.USER, user);
  }

  // Simpan sesi Admin RT hasil login (username + password) dari backend
  public loginAdmin(user: UserSession) {
    this.user = user;
    this.saveToStorage(STORAGE_KEYS.USER, user);
  }

  // ---- Akun Warga (register & login dengan username + password) ----

  private getWargaAccounts(): WargaAccount[] {
    return this.loadFromStorage<WargaAccount[]>(STORAGE_KEYS.WARGA_ACCOUNTS, []);
  }

  private saveWargaAccounts(accounts: WargaAccount[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.WARGA_ACCOUNTS, JSON.stringify(accounts));
    } catch {
      // Ignore
    }
  }

  // Registrasi akun warga baru: hanya username dan password
  public registerWarga(username: string, password: string) {
    const key = username.trim().toLowerCase();
    if (key.length < 3) {
      throw new Error('Username minimal 3 karakter.');
    }
    if (password.length < 6) {
      throw new Error('Password minimal 6 karakter.');
    }
    const accounts = this.getWargaAccounts();
    if (accounts.some((a) => a.username === key)) {
      throw new Error(`Username "${username}" sudah terdaftar. Silakan masuk.`);
    }
    accounts.push({
      username: key,
      password,
      createdAt: new Date().toISOString(),
    });
    this.saveWargaAccounts(accounts);
    return { username: key };
  }

  // Login warga menggunakan username & password yang telah didaftarkan
  public loginWarga(username: string, password: string): UserSession {
    const key = username.trim().toLowerCase();
    if (!key || !password) {
      throw new Error('Username dan password wajib diisi.');
    }
    const account = this.getWargaAccounts().find((a) => a.username === key);
    if (!account) {
      throw new Error('Akun tidak ditemukan. Silakan daftar terlebih dahulu.');
    }
    if (account.password !== password) {
      throw new Error('Password salah. Silakan coba lagi.');
    }

    // Profil sengaja dikosongkan - warga melengkapinya sendiri via Portal
    this.user = {
      role: 'warga',
      rt: 1,
      nama: '',
      username: key,
    };
    this.saveToStorage(STORAGE_KEYS.USER, this.user);
    return this.user;
  }

  // Keluar dari akun, kembalikan ke halaman login
  public logout() {
    this.user = null;
    this.saveToStorage(STORAGE_KEYS.USER, null);
    try {
      localStorage.removeItem('sakalputung_token');
    } catch {
      // Ignore
    }
  }

  // Penduduk
  public getPenduduk(filterRt?: number): Penduduk[] {
    if (filterRt && filterRt > 0) {
      return this.penduduk.filter(p => p.rt === filterRt);
    }
    return this.penduduk;
  }

  public addPenduduk(p: Omit<Penduduk, 'id'>): Penduduk {
    const newP: Penduduk = {
      ...p,
      id: `p-${Date.now()}`
    };
    this.penduduk = [newP, ...this.penduduk];
    this.saveToStorage(STORAGE_KEYS.PENDUDUK, this.penduduk);
    return newP;
  }

  public updatePenduduk(id: string, updated: Partial<Penduduk>) {
    this.penduduk = this.penduduk.map(p => p.id === id ? { ...p, ...updated } : p);
    this.saveToStorage(STORAGE_KEYS.PENDUDUK, this.penduduk);
  }

  public deletePenduduk(id: string) {
    this.penduduk = this.penduduk.filter(p => p.id !== id);
    this.saveToStorage(STORAGE_KEYS.PENDUDUK, this.penduduk);
  }

  // Laporan
  public getLaporan(filterRt?: number): Laporan[] {
    if (filterRt && filterRt > 0) {
      return this.laporan.filter(l => l.rt === filterRt);
    }
    return this.laporan;
  }

  public addLaporan(lap: Omit<Laporan, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Laporan {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');
    const newLap: Laporan = {
      ...lap,
      id: `lap-${Date.now()}`,
      status: 'belum_dikerjakan',
      createdAt: dateStr,
      updatedAt: dateStr
    };
    this.laporan = [newLap, ...this.laporan];
    this.saveToStorage(STORAGE_KEYS.LAPORAN, this.laporan);
    return newLap;
  }

  public updateLaporanStatus(id: string, status: LaporanStatus, catatanAdmin?: string) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');
    this.laporan = this.laporan.map(lap => {
      if (lap.id === id) {
        return {
          ...lap,
          status,
          catatanAdmin: catatanAdmin !== undefined ? catatanAdmin : lap.catatanAdmin,
          updatedAt: dateStr
        };
      }
      return lap;
    });
    this.saveToStorage(STORAGE_KEYS.LAPORAN, this.laporan);
  }

  // Berita
  public getBerita(): Berita[] {
    return this.berita;
  }

  public addBerita(b: Omit<Berita, 'id' | 'slug' | 'views' | 'tanggal'>): Berita {
    const slug = b.judul.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    const newBerita: Berita = {
      ...b,
      id: `news-${Date.now()}`,
      slug,
      views: 1,
      tanggal: dateStr
    };
    this.berita = [newBerita, ...this.berita];
    this.saveToStorage(STORAGE_KEYS.BERITA, this.berita);
    return newBerita;
  }

  public incrementBeritaViews(id: string) {
    this.berita = this.berita.map(b => b.id === id ? { ...b, views: b.views + 1 } : b);
    this.saveToStorage(STORAGE_KEYS.BERITA, this.berita);
  }

  // Surat
  public getSurat(): SuratPusat[] {
    return this.surat;
  }

  public addSurat(s: Omit<SuratPusat, 'id' | 'createdAt' | 'sudahDibaca'>): SuratPusat {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');
    const newSurat: SuratPusat = {
      ...s,
      id: `srt-${Date.now()}`,
      createdAt: dateStr,
      sudahDibaca: false
    };
    this.surat = [newSurat, ...this.surat];
    this.saveToStorage(STORAGE_KEYS.SURAT, this.surat);
    return newSurat;
  }

  public markSuratAsRead(id: string) {
    this.surat = this.surat.map(s => s.id === id ? { ...s, sudahDibaca: true } : s);
    this.saveToStorage(STORAGE_KEYS.SURAT, this.surat);
  }

  // Donasi
  public getDonasi(): DonasiKegiatan[] {
    return this.donasi;
  }

  public addDonasiKegiatan(d: Omit<DonasiKegiatan, 'id' | 'slug' | 'terkumpul' | 'donatur'>): DonasiKegiatan {
    const slug = d.judul.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newDonasi: DonasiKegiatan = {
      ...d,
      id: `don-${Date.now()}`,
      slug,
      terkumpul: 0,
      donatur: []
    };
    this.donasi = [newDonasi, ...this.donasi];
    this.saveToStorage(STORAGE_KEYS.DONASI, this.donasi);
    return newDonasi;
  }

  public submitDonasiPayment(
    kegiatanId: string,
    namaDonatur: string,
    jumlah: number,
    pesanDoa: string,
    isAnonim: boolean,
    metode: string
  ) {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    this.donasi = this.donasi.map(keg => {
      if (keg.id === kegiatanId) {
        const newDonatur = {
          id: `dn-${Date.now()}`,
          namaDonatur: isAnonim ? 'Hamba Allah' : (namaDonatur || 'Warga Sakalputung'),
          isAnonim,
          jumlahDonasi: jumlah,
          pesanDoa: pesanDoa || 'Semoga bermanfaat bagi desa kita tercinta.',
          metodePembayaran: metode,
          tanggal: dateStr
        };
        return {
          ...keg,
          terkumpul: keg.terkumpul + jumlah,
          donatur: [newDonatur, ...keg.donatur]
        };
      }
      return keg;
    });
    this.saveToStorage(STORAGE_KEYS.DONASI, this.donasi);
  }

  // Reset to initial
  public resetToDefault() {
    this.penduduk = initialPenduduk;
    this.laporan = initialLaporan;
    this.berita = initialBerita;
    this.surat = initialSurat;
    this.donasi = initialDonasi;
    this.saveToStorage(STORAGE_KEYS.PENDUDUK, this.penduduk);
    this.saveToStorage(STORAGE_KEYS.LAPORAN, this.laporan);
    this.saveToStorage(STORAGE_KEYS.BERITA, this.berita);
    this.saveToStorage(STORAGE_KEYS.SURAT, this.surat);
    this.saveToStorage(STORAGE_KEYS.DONASI, this.donasi);
  }
}

export const storageService = new StorageService();
