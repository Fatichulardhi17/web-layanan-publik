import type { 
  Penduduk, 
  Laporan, 
  Berita, 
  SuratPusat, 
  DonasiKegiatan, 
  UserSession, 
  RTNumber, 
  LaporanStatus 
} from '../types';

const API_BASE_URL = '/api';
const TOKEN_KEY = 'sakalputung_token';

// Helper to get stored JWT token
export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

// Helper to set stored JWT token
export const setStoredToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore
  }
};

// Helper to clear stored JWT token
export const clearStoredToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore
  }
};

// Generic Fetch Wrapper with JSON and Authorization header
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const status = response.status;
    let data: any = null;

    try {
      data = await response.json();
    } catch {
      // response might be empty or non-JSON
    }

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `HTTP ${status} error`;
      return { error: errorMsg, status };
    }

    return { data, status };
  } catch (err: any) {
    return { 
      error: err?.message || 'Gagal terhubung ke server backend Sakalputung', 
      status: 0 
    };
  }
}

// =========================================================================
// MAPPERS: Backend JSON (snake_case) <---> Frontend UI (camelCase)
// =========================================================================

export function mapBackendPenduduk(item: any): Penduduk {
  return {
    id: item.id,
    nik: item.nik || '',
    nama: item.nama,
    umur: item.umur,
    jenisKelamin: (item.jenis_kelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki') as 'Laki-laki' | 'Perempuan',
    rt: (item.rt || 1) as RTNumber,
    alamatRumah: item.alamat_rumah,
    latitude: item.latitude || -6.914744,
    longitude: item.longitude || 107.60981,
    pekerjaan: item.pekerjaan || 'Warga Desa',
  };
}

export function mapBackendLaporan(item: any): Laporan {
  // Infer kategori from judul or default
  let kategori: Laporan['kategori'] = 'Infrastruktur';
  const text = ((item.judul || '') + ' ' + (item.deskripsi || '')).toLowerCase();
  if (text.includes('sampah') || text.includes('bersih')) {
    kategori = 'Kebersihan';
  } else if (text.includes('maling') || text.includes('aman') || text.includes('ronda')) {
    kategori = 'Keamanan';
  } else if (text.includes('lampu') || text.includes('pju') || text.includes('terang') || text.includes('gelap')) {
    kategori = 'Penerangan Jalan';
  } else if (text.includes('warga') || text.includes('bansos') || text.includes('sosial')) {
    kategori = 'Sosial / Warga';
  }

  const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : 'Hari ini';

  return {
    id: item.id,
    judul: item.judul,
    kategori,
    pelaporNama: item.warga?.nama_lengkap || 'Warga Sakalputung',
    pelaporTelepon: item.warga?.nomor_telepon || '081234567890',
    rt: (item.rt || 1) as RTNumber,
    lokasiSpesifik: item.alamat_lokasi || 'Lingkungan RT 0' + (item.rt || 1),
    keluhan: item.deskripsi,
    fotoUrl: item.foto_url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
    status: (item.status || 'belum_dikerjakan') as LaporanStatus,
    catatanAdmin: item.catatan_admin || undefined,
    createdAt: dateStr,
    updatedAt: item.updated_at ? new Date(item.updated_at).toLocaleDateString('id-ID') : dateStr,
  };
}

export function mapBackendBerita(item: any): Berita {
  const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : 'Baru Saja';

  return {
    id: item.id,
    slug: item.slug,
    judul: item.judul,
    kategori: (item.kategori || 'Pengumuman') as Berita['kategori'],
    ringkasan: item.ringkasan || (item.isi ? item.isi.substring(0, 120) + '...' : ''),
    konten: item.isi || '',
    penulis: item.penulis?.nama_lengkap || 'Sekretariat Desa Sakalputung',
    gambarUrl: item.gambar_cover_url || 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    views: item.dilihat_count || 0,
    tanggal: dateStr,
  };
}

export function mapBackendSurat(item: any): SuratPusat {
  // If item is from notifikasi_surat_warga, it has nested .surat
  const suratData = item.surat || item;
  const dateStr = suratData.tanggal_surat || (suratData.created_at ? new Date(suratData.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : '17 Okt 2026');

  return {
    id: item.id || suratData.id,
    nomorSurat: suratData.nomor_surat,
    instansiPusat: suratData.asal_instansi,
    perihal: suratData.perihal,
    tanggalSurat: dateStr,
    ringkasan: suratData.ringkasan_isi,
    fileUrl: suratData.file_dokumen_url,
    dibagikanOtomatis: suratData.bagikan_otomatis ?? true,
    sudahDibaca: item.is_dibaca ?? false,
    createdAt: suratData.created_at || new Date().toISOString(),
  };
}

export function mapBackendDonasi(item: any): DonasiKegiatan {
  const donaturList = (item.donatur || []).map((d: any) => ({
    id: d.id,
    namaDonatur: d.is_anonim ? 'Hamba Allah' : d.nama_donatur,
    isAnonim: d.is_anonim,
    jumlahDonasi: d.jumlah_donasi,
    pesanDoa: d.pesan_doa || '',
    metodePembayaran: d.metode_pembayaran || 'QRIS',
    tanggal: d.created_at ? new Date(d.created_at).toLocaleDateString('id-ID') : 'Baru saja',
  }));

  const isCompleted = item.status === 'tercapai' || item.status === 'selesai';

  return {
    id: item.id,
    slug: item.slug,
    judul: item.judul_kegiatan,
    deskripsi: item.deskripsi,
    targetDana: item.target_nominal,
    terkumpul: item.nominal_terkumpul || 0,
    batasWaktu: item.tanggal_selesai || '31 Desember 2026',
    status: isCompleted ? 'selesai' : 'aktif',
    penanggungJawab: 'Pengurus Desa Sakalputung',
    donatur: donaturList,
  };
}

// =========================================================================
// API CLIENT SERVICE
// =========================================================================

export const apiClient = {
  // Health check to test backend connectivity
  async checkHealth(): Promise<boolean> {
    const res = await apiRequest<{ status: string }>('/health');
    return res.status === 200 && res.data?.status === 'ok';
  },

  // -----------------------------------------------------------------------
  // 1. AUTH & ONBOARDING
  // -----------------------------------------------------------------------
  async adminLogin(username: string, password: string): Promise<{ user: UserSession; token: string }> {
    const res = await apiRequest<{ token: string; user: any; message: string }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (res.error || !res.data) {
      throw new Error(res.error || 'Login Admin gagal');
    }

    setStoredToken(res.data.token);
    const u = res.data.user;
    return {
      token: res.data.token,
      user: {
        role: 'admin',
        rt: u.rt as RTNumber,
        nama: u.nama_lengkap,
        token: res.data.token,
        nomorTelepon: u.nomor_telepon,
      },
    };
  },

  async wargaLogin(nomorTelepon: string, email?: string): Promise<{ user: UserSession; token: string; isProfileCompleted: boolean }> {
    const res = await apiRequest<{ token: string; user: any; is_profile_completed: boolean }>('/auth/warga/login', {
      method: 'POST',
      body: JSON.stringify({ nomor_telepon: nomorTelepon, email }),
    });

    if (res.error || !res.data) {
      throw new Error(res.error || 'Login Warga gagal');
    }

    setStoredToken(res.data.token);
    const u = res.data.user;
    return {
      token: res.data.token,
      isProfileCompleted: res.data.is_profile_completed,
      user: {
        role: 'warga',
        rt: (u.rt || 1) as RTNumber,
        nama: u.nama_lengkap || 'Warga Sakalputung',
        nomorTelepon: nomorTelepon,
        token: res.data.token,
        umur: u.umur,
        alamat: u.alamat_lengkap,
        latitude: u.latitude,
        longitude: u.longitude,
      },
    };
  },

  async getMe(): Promise<UserSession | null> {
    const res = await apiRequest<{ profile?: any; id?: string; role?: string }>('/auth/me');
    if (res.error || !res.data) return null;

    const p = res.data.profile || res.data;
    const isWarga = p.role === 'warga';
    return {
      role: isWarga ? 'warga' : 'admin',
      rt: (p.rt || 1) as RTNumber,
      nama: p.nama_lengkap || (isWarga ? 'Warga Sakalputung' : `Admin RT 0${p.rt || 1}`),
      nomorTelepon: p.nomor_telepon,
      umur: p.umur,
      alamat: p.alamat_lengkap,
      latitude: p.latitude,
      longitude: p.longitude,
      token: getStoredToken() || undefined,
    };
  },

  async completeProfile(data: {
    namaLengkap: string;
    umur: number;
    rt: RTNumber;
    nomorTelepon?: string;
    alamatLengkap: string;
    latitude?: number;
    longitude?: number;
  }): Promise<void> {
    const res = await apiRequest('/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify({
        nama_lengkap: data.namaLengkap,
        umur: data.umur,
        rt: data.rt,
        nomor_telepon: data.nomorTelepon,
        alamat_lengkap: data.alamatLengkap,
        latitude: data.latitude,
        longitude: data.longitude,
      }),
    });

    if (res.error) {
      throw new Error(res.error);
    }
  },

  // -----------------------------------------------------------------------
  // 2. DASHBOARD STATS
  // -----------------------------------------------------------------------
  async getAdminDashboardStats(): Promise<any> {
    const res = await apiRequest<any>('/admin/dashboard/stats');
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  // -----------------------------------------------------------------------
  // 3. PENDUDUK & MAPS
  // -----------------------------------------------------------------------
  async getPenduduk(rt?: number, query?: string): Promise<Penduduk[]> {
    let url = '/penduduk?';
    if (rt) url += `rt=${rt}&`;
    if (query) url += `q=${encodeURIComponent(query)}&`;

    const res = await apiRequest<{ data: any[] }>(url);
    if (res.error || !res.data?.data) {
      throw new Error(res.error || 'Gagal memuat data penduduk');
    }
    return res.data.data.map(mapBackendPenduduk);
  },

  async getPendudukMaps(rt?: number): Promise<any[]> {
    const url = rt ? `/penduduk/maps?rt=${rt}` : '/penduduk/maps';
    const res = await apiRequest<{ data: any[] }>(url);
    if (res.error || !res.data?.data) {
      throw new Error(res.error || 'Gagal memuat titik peta penduduk');
    }
    return res.data.data;
  },

  async addPenduduk(p: Omit<Penduduk, 'id'>): Promise<Penduduk> {
    const res = await apiRequest<any>('/penduduk', {
      method: 'POST',
      body: JSON.stringify({
        nik: p.nik,
        nama: p.nama,
        umur: p.umur,
        jenis_kelamin: p.jenisKelamin,
        rt: p.rt,
        alamat_rumah: p.alamatRumah,
        latitude: p.latitude,
        longitude: p.longitude,
        pekerjaan: p.pekerjaan,
      }),
    });

    if (res.error || !res.data) {
      throw new Error(res.error || 'Gagal menambah data penduduk');
    }
    return mapBackendPenduduk(res.data);
  },

  async updatePenduduk(id: string, p: Partial<Penduduk>): Promise<void> {
    const res = await apiRequest(`/penduduk/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        nik: p.nik,
        nama: p.nama,
        umur: p.umur,
        jenis_kelamin: p.jenisKelamin,
        rt: p.rt,
        alamat_rumah: p.alamatRumah,
        latitude: p.latitude,
        longitude: p.longitude,
        pekerjaan: p.pekerjaan,
      }),
    });

    if (res.error) throw new Error(res.error);
  },

  async deletePenduduk(id: string): Promise<void> {
    const res = await apiRequest(`/penduduk/${id}`, {
      method: 'DELETE',
    });
    if (res.error) throw new Error(res.error);
  },

  // -----------------------------------------------------------------------
  // 4. LAPORAN / PENGADUAN
  // -----------------------------------------------------------------------
  async getLaporan(rt?: number, status?: string): Promise<Laporan[]> {
    let url = '/laporan?';
    if (rt) url += `rt=${rt}&`;
    if (status) url += `status=${status}&`;

    const res = await apiRequest<{ data: any[] }>(url);
    if (res.error || !res.data?.data) {
      throw new Error(res.error || 'Gagal memuat daftar laporan');
    }
    return res.data.data.map(mapBackendLaporan);
  },

  async addLaporan(lap: Omit<Laporan, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Laporan> {
    const res = await apiRequest<any>('/laporan', {
      method: 'POST',
      body: JSON.stringify({
        judul: lap.judul,
        deskripsi: lap.keluhan,
        rt: lap.rt,
        alamat_lokasi: lap.lokasiSpesifik,
        foto_url: lap.fotoUrl,
      }),
    });

    if (res.error || !res.data) {
      throw new Error(res.error || 'Gagal mengirim laporan kendala');
    }
    return mapBackendLaporan(res.data);
  },

  async updateLaporanStatus(id: string, status: LaporanStatus, catatanAdmin?: string): Promise<void> {
    const res = await apiRequest(`/laporan/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        catatan_admin: catatanAdmin || '',
      }),
    });

    if (res.error) throw new Error(res.error);
  },

  // -----------------------------------------------------------------------
  // 5. BERITA DESA
  // -----------------------------------------------------------------------
  async getBerita(kategori?: string, query?: string): Promise<Berita[]> {
    let url = '/berita?';
    if (kategori && kategori !== 'Semua') url += `kategori=${encodeURIComponent(kategori)}&`;
    if (query) url += `q=${encodeURIComponent(query)}&`;

    const res = await apiRequest<{ data: any[] }>(url);
    if (res.error || !res.data?.data) {
      throw new Error(res.error || 'Gagal memuat berita desa');
    }
    return res.data.data.map(mapBackendBerita);
  },

  async getBeritaBySlug(slug: string): Promise<Berita> {
    const res = await apiRequest<any>(`/berita/${slug}`);
    if (res.error || !res.data) throw new Error(res.error || 'Berita tidak ditemukan');
    return mapBackendBerita(res.data);
  },

  async addBerita(b: Omit<Berita, 'id' | 'slug' | 'views' | 'tanggal'>): Promise<Berita> {
    const res = await apiRequest<any>('/berita', {
      method: 'POST',
      body: JSON.stringify({
        judul: b.judul,
        ringkasan: b.ringkasan,
        isi: b.konten,
        gambar_cover_url: b.gambarUrl,
        kategori: b.kategori,
      }),
    });

    if (res.error || !res.data) throw new Error(res.error || 'Gagal membuat berita baru');
    return mapBackendBerita(res.data);
  },

  async deleteBerita(id: string): Promise<void> {
    const res = await apiRequest(`/berita/${id}`, {
      method: 'DELETE',
    });
    if (res.error) throw new Error(res.error);
  },

  // -----------------------------------------------------------------------
  // 6. SURAT PUSAT & NOTIFIKASI
  // -----------------------------------------------------------------------
  async getSurat(): Promise<SuratPusat[]> {
    const res = await apiRequest<{ data: any[] }>('/surat');
    if (res.error || !res.data?.data) {
      throw new Error(res.error || 'Gagal memuat arsip surat');
    }
    return res.data.data.map(mapBackendSurat);
  },

  async getSuratWarga(): Promise<SuratPusat[]> {
    const res = await apiRequest<{ data: any[] }>('/surat/warga');
    if (res.error || !res.data?.data) {
      throw new Error(res.error || 'Gagal memuat surat warga');
    }
    return res.data.data.map(mapBackendSurat);
  },

  async addSurat(s: Omit<SuratPusat, 'id' | 'createdAt' | 'sudahDibaca'>): Promise<SuratPusat> {
    const res = await apiRequest<any>('/surat', {
      method: 'POST',
      body: JSON.stringify({
        nomor_surat: s.nomorSurat,
        asal_instansi: s.instansiPusat,
        perihal: s.perihal,
        ringkasan_isi: s.ringkasan,
        tanggal_surat: s.tanggalSurat,
        file_dokumen_url: s.fileUrl || '',
        bagikan_otomatis: s.dibagikanOtomatis,
      }),
    });

    if (res.error || !res.data) throw new Error(res.error || 'Gagal mengarsipkan surat');
    return mapBackendSurat(res.data);
  },

  async markSuratAsRead(notificationId: string): Promise<void> {
    const res = await apiRequest(`/surat/notifikasi/${notificationId}/read`, {
      method: 'PATCH',
    });
    if (res.error) throw new Error(res.error);
  },

  // -----------------------------------------------------------------------
  // 7. DONASI & PAYMENT GATEWAY
  // -----------------------------------------------------------------------
  async getDonasi(): Promise<DonasiKegiatan[]> {
    const res = await apiRequest<{ data: any[] }>('/donasi/kegiatan');
    if (res.error || !res.data?.data) {
      throw new Error(res.error || 'Gagal memuat forum donasi');
    }
    return res.data.data.map(mapBackendDonasi);
  },

  async getDonasiBySlug(slug: string): Promise<DonasiKegiatan> {
    const res = await apiRequest<any>(`/donasi/kegiatan/${slug}`);
    if (res.error || !res.data) throw new Error(res.error || 'Forum donasi tidak ditemukan');
    return mapBackendDonasi(res.data);
  },

  async addDonasiKegiatan(d: Omit<DonasiKegiatan, 'id' | 'slug' | 'terkumpul' | 'donatur'>): Promise<DonasiKegiatan> {
    const res = await apiRequest<any>('/donasi/kegiatan', {
      method: 'POST',
      body: JSON.stringify({
        judul_kegiatan: d.judul,
        deskripsi: d.deskripsi,
        target_nominal: d.targetDana,
        tanggal_selesai: d.batasWaktu,
        banner_url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb9?auto=format&fit=crop&w=800&q=80',
      }),
    });

    if (res.error || !res.data) throw new Error(res.error || 'Gagal membuat forum donasi');
    return mapBackendDonasi(res.data);
  },

  async submitDonasiPayment(
    kegiatanId: string,
    namaDonatur: string,
    jumlah: number,
    pesanDoa: string,
    isAnonim: boolean,
    metode: string
  ): Promise<{
    orderId: string;
    paymentUrl?: string;
    snapToken?: string;
    clientKey?: string;
    snapUrl?: string;
    warning?: string;
    qrString?: string;
  }> {
    const res = await apiRequest<any>('/donasi/bayar', {
      method: 'POST',
      body: JSON.stringify({
        kegiatan_id: kegiatanId,
        nama_donatur: namaDonatur,
        is_anonim: isAnonim,
        jumlah_donasi: jumlah,
        pesan_doa: pesanDoa,
        metode_pembayaran: metode,
      }),
    });

    if (res.error || !res.data) throw new Error(res.error || 'Gagal memproses donasi');
    return {
      orderId: res.data.order_id,
      paymentUrl: res.data.payment_url,
      snapToken: res.data.snap_token,
      clientKey: res.data.client_key,
      snapUrl: res.data.snap_url,
      warning: res.data.warning,
      qrString: res.data.qr_string,
    };
  },

  async simulateDonasiSuccess(orderId: string): Promise<void> {
    const res = await apiRequest(`/donasi/simulasi-sukses/${orderId}`, {
      method: 'POST',
    });
    if (res.error) throw new Error(res.error);
  },

  // Verifikasi apakah dana donasi sudah masuk (QRIS / Virtual Account)
  async getDonasiStatus(orderId: string): Promise<{
    isPaid: boolean;
    status: string;
    metode: string;
    qrString?: string;
    vaNumber?: string;
  } | null> {
    const res = await apiRequest<{
      is_paid: boolean;
      status_pembayaran: string;
      metode_pembayaran: string;
      qr_string?: string;
      va_number?: string;
    }>(`/donasi/transaksi/${orderId}`);
    if (res.error || !res.data) return null;
    return {
      isPaid: res.data.is_paid,
      status: res.data.status_pembayaran,
      metode: res.data.metode_pembayaran || '',
      qrString: res.data.qr_string || '',
      vaNumber: res.data.va_number || '',
    };
  },
};
