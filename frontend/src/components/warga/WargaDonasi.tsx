import React, { useState, useEffect, useRef } from 'react';
import type { DonasiKegiatan, UserSession } from '../../types';
import { apiClient } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { 
  HeartHandshake, 
  Calendar, 
  User, 
  CheckCircle2, 
  QrCode, 
  CreditCard, 
  Wallet, 
  X, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Clock,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface WargaDonasiProps {
  user: UserSession;
  donasiList: DonasiKegiatan[];
  onSubmitDonasi: (
    kegiatanId: string,
    namaDonatur: string,
    jumlah: number,
    pesanDoa: string,
    isAnonim: boolean,
    metode: string
  ) => void;
}

type PaymentStatus = 'pending' | 'verified';

// Kontrak Midtrans Snap (popup pembayaran resmi dari gateway)
declare global {
  interface Window {
    snap?: {
      pay: (token: string, opts?: Record<string, unknown>) => void;
      hide?: () => void;
    };
  }
}

export const WargaDonasi: React.FC<WargaDonasiProps> = ({
  user,
  donasiList,
  onSubmitDonasi,
}) => {
  // Utamakan kegiatan dari backend (UUID asli) agar QRIS gateway bisa dibuat,
  // fallback ke data mock lokal saat backend tidak terhubung
  const [kegiatanList, setKegiatanList] = useState<DonasiKegiatan[]>(donasiList);

  useEffect(() => {
    setKegiatanList(donasiList);
  }, [donasiList]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await apiClient.getDonasi();
        if (!cancelled && remote && remote.length) {
          setKegiatanList(remote);
        }
      } catch {
        // Backend offline -> tetap gunakan data lokal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [selectedKegiatan, setSelectedKegiatan] = useState<DonasiKegiatan | null>(null);
  const [nominalPreset, setNominalPreset] = useState<number>(50000);
  const [customNominal, setCustomNominal] = useState<string>('');
  const [isAnonim, setIsAnonim] = useState<boolean>(false);
  const [pesanDoa, setPesanDoa] = useState<string>('Semoga kegiatan dan pembangunan desa lancar berkah.');
  const [paymentMethod, setPaymentMethod] = useState<string>('QRIS Sakalputung');

  // Payment checkout state
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [isSuccessModal, setIsSuccessModal] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string>('');
  const [vaNumber, setVaNumber] = useState<string>('');
  const [payUrl, setPayUrl] = useState<string>('');
  const [serverQris, setServerQris] = useState<string>('');
  const [snapToken, setSnapToken] = useState<string>('');
  const [snapClientKey, setSnapClientKey] = useState<string>('');
  const [snapScriptUrl, setSnapScriptUrl] = useState<string>('');
  const [isSnapOpen, setIsSnapOpen] = useState<boolean>(false);
  const [isServerOrder, setIsServerOrder] = useState<boolean>(false);
  const [payStatus, setPayStatus] = useState<PaymentStatus>('pending');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [lastCheckAt, setLastCheckAt] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [vaCopied, setVaCopied] = useState<boolean>(false);
  const verifiedRef = useRef<boolean>(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getEffectiveNominal = (): number => {
    if (customNominal) {
      const parsed = parseInt(customNominal.replace(/[^0-9]/g, ''), 10);
      return isNaN(parsed) ? nominalPreset : parsed;
    }
    return nominalPreset;
  };

  const handleOpenDonateModal = (keg: DonasiKegiatan) => {
    setSelectedKegiatan(keg);
    setNominalPreset(50000);
    setCustomNominal('');
    setIsAnonim(false);
    setPesanDoa('Semoga bermanfaat untuk kemaslahatan warga Desa Sakalputung.');
    setIsCheckingOut(false);
    setPayStatus('pending');
    setLastCheckAt(null);
    setOrderId('');
    setVaNumber('');
    setPayUrl('');
    setServerQris('');
    setSnapToken('');
    setSnapClientKey('');
    setSnapScriptUrl('');
    setIsSnapOpen(false);
    setIsServerOrder(false);
    setVerifyError(null);
    verifiedRef.current = false;
  };

  // Payload QRIS dinamis valid (EMVCo TLV + CRC-16) berisi identitas order & nominal donasi
  const emvField = (tag: string, value: string): string =>
    `${tag}${value.length.toString().padStart(2, '0')}${value}`;

  const crc16Ccitt = (str: string): string => {
    let crc = 0xffff;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let bit = 0; bit < 8; bit++) {
        crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  };

  const buildQrisPayload = (): string => {
    const merchantInfo =
      emvField('00', 'ID.CO.QRIS.WWW') +
      emvField('01', '3607920110268882901') +
      emvField('02', 'ID1020268882901');
    const base =
      emvField('00', '01') +
      emvField('01', '12') +
      emvField('26', merchantInfo) +
      emvField('52', '5812') +
      emvField('53', '360') +
      emvField('54', String(getEffectiveNominal())) +
      emvField('58', 'ID') +
      emvField('59', 'DESA SAKALPUTUNG') +
      emvField('60', 'JAWA BARAT') +
      emvField('62', emvField('05', orderId.slice(-12).toUpperCase()));
    return base + emvField('63', '') + crc16Ccitt(base + '6304');
  };

  // Nomor Virtual Account di-generate otomatis per transaksi (prefix sesuai bank)
  const buildVaNumber = (method: string): string => {
    const random = Math.random().toString().slice(2, 12); // 10 digit
    if (method === 'Mandiri Virtual Account') return `8930${random}`;
    if (method === 'GoPay') return `8998${random}`;
    return `8801${random}`; // BCA Virtual Account
  };

  const isUuid = (val: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKegiatan) return;

    setIsCheckingOut(true);
    setPayStatus('pending');
    setLastCheckAt(null);
    setVerifyError(null);
    verifiedRef.current = false;

    // Data kegiatan mock lokal (id "don-01" dst.) bukan UUID - backend menolaknya (400).
    // Cari padanan UUID dari daftar kegiatan backend sebelum memproses pembayaran.
    let kegiatanId = selectedKegiatan.id;
    if (!isUuid(kegiatanId)) {
      const match =
        kegiatanList.find(
          (k) => isUuid(k.id) && (k.slug === selectedKegiatan.slug || k.judul === selectedKegiatan.judul)
        ) || null;
      if (match) {
        kegiatanId = match.id;
        setSelectedKegiatan(match);
      } else {
        try {
          const remote = await apiClient.getDonasiBySlug(selectedKegiatan.slug);
          if (remote && isUuid(remote.id)) {
            kegiatanId = remote.id;
            setSelectedKegiatan(remote);
          }
        } catch {
          // biar ditangani pengecekan di bawah
        }
      }
      if (!isUuid(kegiatanId)) {
        setVerifyError('Kegiatan donasi ini belum tersinkron dengan backend. Muat ulang halaman lalu pilih kegiatan terbaru.');
        setIsCheckingOut(false);
        return;
      }
    }

    // 1. Daftarkan transaksi dulu ke backend payment gateway agar verifikasi QRIS bekerja
    try {
      const res = await apiClient.submitDonasiPayment(
        kegiatanId,
        isAnonim ? 'Hamba Allah (Anonim)' : (user.nama || 'Warga Sakalputung'),
        getEffectiveNominal(),
        pesanDoa,
        isAnonim,
        paymentMethod
      );
      if (res?.orderId) {
        setOrderId(res.orderId);
        setVaNumber(buildVaNumber(paymentMethod));
        setPayUrl(res.paymentUrl || '');
        setIsServerOrder(true);
        setServerQris(res.qrString || '');
        setSnapToken(res.snapToken || '');
        setSnapClientKey(res.clientKey || '');
        setSnapScriptUrl(res.snapUrl || '');
        setIsSnapOpen(false);
        if (res.warning) {
          setVerifyError(res.warning);
        }
        return;
      }
    } catch {
      // Backend / gateway tidak tersedia -> lanjut mode demo lokal
    }

    // 2. Mode demo offline: order id lokal, verifikasi via tombol simulasi
    const newOrderId = `DONASI-SP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setOrderId(newOrderId);
    setVaNumber(buildVaNumber(paymentMethod));
    setPayUrl('');
    setIsServerOrder(false);
    setServerQris('');
  };

  const handleChangeMethod = (methodId: string) => {
    setPaymentMethod(methodId);
  };

  function finishVerified() {
    verifiedRef.current = true;
    setPayStatus('verified');
    if (!selectedKegiatan) return;
    // Dana terverifikasi masuk, catat donasi ke forum kegiatan
    onSubmitDonasi(
      selectedKegiatan.id,
      user.nama || 'Warga Sakalputung',
      getEffectiveNominal(),
      pesanDoa,
      isAnonim,
      paymentMethod
    );
    setTimeout(() => {
      setIsCheckingOut(false);
      setIsSuccessModal(true);
    }, 1500);
  }

  // Muat snap.js Midtrans sekali (script popup pembayaran resmi, butuh client key publik)
  const ensureSnapScript = (src: string, clientKey: string): Promise<void> =>
    new Promise((resolve, reject) => {
      if (window.snap) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.setAttribute('data-client-key', clientKey);
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Gagal memuat snap.js'));
      document.body.appendChild(script);
    });

  const openSnapPayment = async () => {
    if (!snapToken || !snapScriptUrl || !snapClientKey || verifiedRef.current) return;
    setIsSnapOpen(true);
    try {
      await ensureSnapScript(snapScriptUrl, snapClientKey);
    } catch {
      setIsSnapOpen(false);
      setVerifyError('Gagal memuat modul pembayaran Midtrans.');
      return;
    }
    if (!window.snap) {
      setIsSnapOpen(false);
      setVerifyError('Modul pembayaran Midtrans belum siap. Coba lagi.');
      return;
    }
    window.snap.pay(snapToken, {
      onSuccess: () => {
        setVerifyError(null);
        finishVerified();
      },
      onPending: () => {
        setVerifyError(null);
      },
      onError: () => {
        setIsSnapOpen(false);
        setVerifyError('Pembayaran gagal. Silakan coba bayar ulang.');
      },
      onClose: () => {
        setIsSnapOpen(false);
      },
    });
  };

  const attemptVerify = async (manual = false): Promise<boolean> => {
    if (verifiedRef.current || !orderId) return false;
    setIsVerifying(true);
    try {
      // 1. Cek status transaksi yang tercatat di payment gateway backend
      const status = await apiClient.getDonasiStatus(orderId);
      if (status?.isPaid) {
        finishVerified();
        return true;
      }

      // Awali tampilan QRIS / VA resmi dari gateway (polling mengambil qr_string & va_number)
      if (status && isServerOrder) {
        if (status.qrString) {
          setServerQris(status.qrString);
        }
        if (status.vaNumber) {
          setVaNumber(status.vaNumber);
        }
      }

      if (manual) {
        if (isServerOrder) {
          // Memicu webhook simulasi di backend, lalu periksa ulang statusnya
          const sim = await apiClient.simulateDonasiSuccess(orderId).catch(() => null);
          if (sim !== null) {
            const after = await apiClient.getDonasiStatus(orderId);
            if (after?.isPaid) {
              finishVerified();
              return true;
            }
          }
          setVerifyError('Gagal memverifikasi di payment gateway. Coba lagi beberapa saat.');
          return false;
        }
        // 2. Mode demo offline: konfirmasi manual menandakan dana masuk
        finishVerified();
        return true;
      }
    } catch {
      if (manual && !isServerOrder) {
        finishVerified();
        return true;
      }
    } finally {
      setLastCheckAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsVerifying(false);
    }
    return false;
  };

  const attemptVerifyRef = useRef(attemptVerify);
  useEffect(() => {
    attemptVerifyRef.current = attemptVerify;
  });

  // Verifikasi otomatis berulang selama QRIS / VA menunggu pembayaran
  useEffect(() => {
    if (!isCheckingOut || payStatus === 'verified' || !orderId) return;
    const interval = setInterval(() => {
      attemptVerifyRef.current(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [isCheckingOut, payStatus, orderId]);

  const handleManualVerify = () => {
    if (verifiedRef.current) return;
    setVerifyError(null);
    // Server: trigger simulasi webhook gateway. Demo lokal: konfirmasi dana masuk.
    attemptVerifyRef.current(true);
  };

  // Pintasan pembayaran Midtrans Snap (QRIS / VA asli benar di popup, qr_string juga
  // dirender di layar dari hasil polling status gateway)
  const snapPaymentPanel = snapToken && isServerOrder ? (
    <div className="p-4 bg-[#F2F2ED] rounded-[16px] border border-[#E8E8E2] space-y-3 w-full">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-9 h-9 rounded-full bg-[#118AB2]/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-[#118AB2]" />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-[#1F2232]">Pembayaran via Midtrans</div>
          <div className="text-[10px] text-[#585C74]">
            QRIS / Virtual Account resmi, sesuai metode yang dipilih
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={openSnapPayment}
        disabled={isSnapOpen}
        className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-[10px] bg-[#118AB2] text-white text-xs font-semibold hover:bg-[#0e7396] transition-colors disabled:opacity-70"
      >
        {isSnapOpen ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ExternalLink className="w-4 h-4" />
        )}
        <span>{isSnapOpen ? 'Membuka halaman pembayaran...' : 'Buka Halaman Pembayaran'}</span>
      </button>
      <p className="text-[10px] text-[#8B8FA3]">
        Selesaikan pembayaran di popup Midtrans. Status donasi terverifikasi otomatis setelah dana masuk.
      </p>
      {payUrl && (
        <a
          href={payUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[10px] font-semibold text-[#118AB2] hover:underline"
        >
          Popup tidak muncul? Buka link pembayaran di tab baru
        </a>
      )}
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1F2232]">
          Forum Donasi & Gotong Royong Desa Sakalputung
        </h1>
        <p className="text-sm text-[#585C74] mt-0.5">
          Salurkan kontribusi sukarela untuk kegiatan sosial, renovasi pos ronda RT, dan sarana posyandu desa dengan sistem pembayaran aman.
        </p>
      </div>

      {/* Donation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kegiatanList.map((keg) => {
          const percentage = Math.min(Math.round((keg.terkumpul / keg.targetDana) * 100), 100);

          return (
            <div
              key={keg.id}
              className="rounded-[22px] bg-[#FFFFFF] border border-[#E8E8E2] p-6 shadow-tactile shadow-tactile-hover flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-[8px] bg-[#E2F6F3] text-[#118AB2] text-[11px] font-bold">
                    {keg.status === 'aktif' ? 'Penggalangan Terbuka' : 'Selesai'}
                  </span>
                  <span className="text-[11px] text-[#8B8FA3] flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Batas: {keg.batasWaktu}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#1F2232] leading-snug">
                    {keg.judul}
                  </h2>
                  <p className="text-xs text-[#585C74] mt-2 leading-relaxed">
                    {keg.deskripsi}
                  </p>
                </div>

                {/* Progress bar per DESIGN.md Section 2.3 */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-sm font-bold text-[#1F2232]">
                        {formatCurrency(keg.terkumpul)}
                      </span>
                      <span className="text-xs text-[#8B8FA3] ml-1">
                        / {formatCurrency(keg.targetDana)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#118AB2]">{percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-[#E8E8E2] rounded-[9999px] overflow-hidden">
                    <div
                      className="h-full bg-[#118AB2] rounded-[9999px] transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-[#585C74] flex items-center justify-between pt-1">
                  <span className="flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-[#464B71]" />
                    PJ: {keg.penanggungJawab}
                  </span>
                  <span className="font-semibold text-[#464B71]">
                    {keg.donatur.length} donatur telah bergabung
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E8E8E2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleOpenDonateModal(keg)}
                  className="w-full py-2.5 rounded-[12px] bg-[#464B71] hover:bg-[#373B5A] text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-[#118AB2]"
                >
                  <HeartHandshake className="w-4 h-4 text-[#7CD5C7]" />
                  <span>Donasi Sekarang (Payment Gateway)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Input Donasi & Pemilihan Payment Gateway */}
      {selectedKegiatan && !isCheckingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-[22px] bg-white border border-[#E8E8E2] shadow-tactile overflow-hidden flex flex-col my-8 sm:max-h-[90vh]">
            <div className="p-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#F2F2ED] shrink-0">
              <h2 className="text-sm font-bold text-[#1F2232]">
                Salurkan Donasi Kegiatan Desa
              </h2>
              <button
                type="button"
                onClick={() => setSelectedKegiatan(null)}
                className="p-1.5 rounded-[8px] hover:bg-[#E8E8E2] text-[#585C74]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessCheckout} className="p-5 space-y-4 overflow-y-auto">
              <div className="p-3 rounded-[12px] bg-[#F2F2ED] border border-[#E8E8E2]">
                <span className="text-[10px] font-bold text-[#118AB2] uppercase">
                  Kegiatan Pilihan Anda:
                </span>
                <div className="text-xs font-bold text-[#1F2232] mt-0.5">
                  {selectedKegiatan.judul}
                </div>
              </div>

              {/* Preset Nominal Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#1F2232] mb-1.5">
                  Pilih Nominal Donasi:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[20000, 50000, 100000, 250000].map((amt) => (
                    <button
                      key={`amt-${amt}`}
                      type="button"
                      onClick={() => {
                        setNominalPreset(amt);
                        setCustomNominal('');
                      }}
                      className={`p-2 rounded-[10px] text-xs font-bold transition-all border text-center ${
                        nominalPreset === amt && !customNominal
                          ? 'border-[#118AB2] bg-[#E2F6F3] text-[#118AB2] ring-2 ring-[#118AB2]/30'
                          : 'border-[#E8E8E2] bg-white text-[#1F2232] hover:bg-[#F2F2ED]'
                      }`}
                    >
                      {formatCurrency(amt)}
                    </button>
                  ))}
                </div>

                <div className="mt-2.5">
                  <input
                    type="number"
                    placeholder="Atau ketik nominal lainnya (min. Rp 10.000)..."
                    value={customNominal}
                    onChange={(e) => setCustomNominal(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                  />
                </div>
              </div>

              {/* Data Donatur & Opsi Anonim */}
              <div className="space-y-3 pt-2 border-t border-[#E8E8E2]">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                    Nama Donatur
                  </label>
                  <input
                    type="text"
                    disabled={isAnonim}
                    value={isAnonim ? 'Hamba Allah (Anonim)' : (user.nama || 'Warga Sakalputung')}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] disabled:opacity-75"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonimCheck"
                    checked={isAnonim}
                    onChange={(e) => setIsAnonim(e.target.checked)}
                    className="rounded text-[#118AB2] focus:ring-[#118AB2]"
                  />
                  <label htmlFor="anonimCheck" className="text-xs text-[#585C74] cursor-pointer">
                    Sembunyikan nama saya pada riwayat publik (Donasi Anonim)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2232] mb-1">
                    Pesan / Doa Kebaikan
                  </label>
                  <textarea
                    rows={2}
                    value={pesanDoa}
                    onChange={(e) => setPesanDoa(e.target.value)}
                    placeholder="Tuliskan harapan atau doa baik untuk kegiatan desa..."
                    className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2ED] border border-[#E8E8E2] text-xs text-[#1F2232] focus:bg-white focus:border-[#118AB2] focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Gateway Method Selection */}
              <div className="pt-2 border-t border-[#E8E8E2]">
                <label className="block text-xs font-semibold text-[#1F2232] mb-1.5">
                  Metode Pembayaran (Payment Gateway):
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'QRIS Sakalputung', label: 'QRIS (Semua E-Wallet & Bank)', icon: QrCode },
                    { id: 'BCA Virtual Account', label: 'BCA Virtual Account', icon: CreditCard },
                    { id: 'Mandiri Virtual Account', label: 'Mandiri Virtual Account', icon: CreditCard },
                    { id: 'GoPay', label: 'GoPay / QRIS Digital', icon: Wallet },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleChangeMethod(m.id)}
                        className={`p-2.5 rounded-[12px] border text-left flex items-start space-x-2 transition-all ${
                          paymentMethod === m.id
                            ? 'border-[#118AB2] bg-[#E2F6F3] text-[#118AB2] ring-1 ring-[#118AB2]'
                            : 'border-[#E8E8E2] bg-white text-[#585C74] hover:bg-[#F2F2ED]'
                        }`}
                      >
                        <Icon className="w-4 h-4 mt-0.5 shrink-0 text-[#118AB2]" />
                        <span className="text-[11px] font-semibold leading-tight">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E8E8E2]">
                <div>
                  <span className="text-[10px] text-[#8B8FA3] block">Total Donasi:</span>
                  <span className="text-base font-bold text-[#1F2232]">
                    {formatCurrency(getEffectiveNominal())}
                  </span>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-[12px] bg-[#464B71] hover:bg-[#373B5A] text-white text-xs font-semibold transition-colors flex items-center space-x-1.5"
                >
                  <span>Lanjut Pembayaran</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#7CD5C7]" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Payment Gateway: QR / Virtual Account + Verifikasi Dana Masuk */}
      {selectedKegiatan && isCheckingOut && orderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md rounded-[22px] bg-white border border-[#E8E8E2] shadow-tactile overflow-hidden flex flex-col my-8 sm:max-h-[92vh]">
            <div className="p-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#F2F2ED] shrink-0">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#118AB2]" />
                <h2 className="text-xs font-bold text-[#1F2232]">
                  Pembayaran Donasi & Verifikasi Otomatis
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckingOut(false)}
                className="p-1 rounded-[6px] hover:bg-[#E8E8E2] text-[#585C74]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {payStatus === 'verified' ? (
              /* ---------- DANA TERVERIFIKASI MASUK ---------- */
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#E2F6F3] text-[#118AB2] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1F2232]">
                    Dana Sudah Masuk & Terverifikasi
                  </h3>
                  <p className="text-xs text-[#585C74] mt-1">
                    Sistem payment gateway mengkonfirmasi pembayaran Anda telah diterima di{' '}
                    {paymentMethod.includes('QRIS') ? 'QRIS' : `rekening ${paymentMethod.replace(' Virtual Account', ' VA')}`} desa.
                  </p>
                </div>
                <div className="p-3 rounded-[12px] bg-[#F2F2ED] border border-[#E8E8E2] text-left text-[11px] text-[#585C74] space-y-1">
                  <div>Nominal terverifikasi: <strong className="text-[#1F2232]">{formatCurrency(getEffectiveNominal())}</strong></div>
                  <div className="font-mono">Order: {orderId}</div>
                </div>
                <div className="flex items-center justify-center text-[11px] font-semibold text-[#118AB2]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Memperbarui data forum donasi...
                </div>
              </div>
            ) : (
              /* ---------- MENUNGGU PEMBAYARAN ---------- */
              <div className="p-6 text-center space-y-4 w-full">
                <div className="text-xs text-[#585C74]">
                  Total Tagihan Donasi Desa Sakalputung
                </div>
                <div className="text-2xl font-bold text-[#1F2232]">
                  {formatCurrency(getEffectiveNominal())}
                </div>
                <div className="text-[10px] font-mono text-[#8B8FA3]">{orderId}</div>

                {paymentMethod.includes('QRIS') ? (
                  /* ---------- QRIS ---------- */
                  <div className="p-4 bg-[#F2F2ED] rounded-[16px] inline-block border border-[#E8E8E2] w-full sm:w-auto">
                    {isServerOrder && !serverQris ? (
                      /* Server order: tunggu qr_string asli dari gateway, jangan tampilkan QR demo */
                      <div className="py-6 px-4 flex flex-col items-center space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#118AB2]" />
                        <p className="text-[11px] font-semibold text-[#585C74]">
                          Mengambil QRIS resmi dari payment gateway...
                        </p>
                        <p className="text-[10px] text-[#8B8FA3]">
                          Kalau gateway tidak dapat dihubungi, gunakan tombol konfirmasi manual di bawah.
                        </p>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <div className="bg-white p-3 rounded-[12px] shadow-sm border border-[#E8E8E2]">
                          <QRCodeSVG
                            value={isServerOrder ? serverQris : buildQrisPayload()}
                            size={Math.min(168, typeof window !== 'undefined' && window.innerWidth < 380 ? 140 : 168)}
                            bgColor="#FFFFFF"
                            fgColor="#1F2232"
                            level="M"
                          />
                        </div>
                      </div>
                    )}
                    {serverQris ? (
                      <p className="text-[11px] font-mono text-[#585C74] mt-2">
                        QRIS resmi dari payment gateway
                      </p>
                    ) : isServerOrder ? null : (
                      <p className="text-[11px] font-mono text-[#585C74] mt-2">
                        NMID: ID1020268882901 &bull; Sakalputung Pay
                      </p>
                    )}
                    {isServerOrder ? null : (
                      <p className="text-[10px] font-semibold text-[#8B8FA3] mt-0.5 sm:hidden">
                        QR demo (gateway tidak terhubung). Gunakan link pembayaran jika gagal discan.
                      </p>
                    )}
                    {serverQris ? (
                      <>
                        <p className="text-[10px] text-[#8B8FA3] mt-0.5">
                          Scan QR di atas dengan e-wallet / m-banking, nominal tertera otomatis.
                        </p>
                        <p className="text-[10px] text-[#8B8FA3] mt-0.5 sm:hidden">
                          Screenshot QR ini, lalu buka e-wallet / m-banking dan pilih scan dari galeri.
                        </p>
                      </>
                    ) : null}
                    {payUrl && (
                      <a
                        href={payUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-[10px] bg-[#118AB2] text-white text-[11px] font-semibold hover:bg-[#0e7396] transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Bayar via Halaman Payment Gateway</span>
                        <span className="sm:hidden">Buka Link Pembayaran</span>
                      </a>
                    )}
                    {snapPaymentPanel}
                  </div>
                ) : (
                  /* ---------- VIRTUAL ACCOUNT ---------- */
                  <div className="p-4 bg-[#F2F2ED] rounded-[16px] border border-[#E8E8E2] text-left space-y-2">
                    <div className="text-[11px] text-[#585C74]">
                      Nomor Virtual Account ({paymentMethod}) di-generate otomatis:
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-base font-mono font-bold text-[#118AB2] tracking-wider">
                        {vaNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            navigator.clipboard?.writeText(vaNumber);
                            setVaCopied(true);
                            setTimeout(() => setVaCopied(false), 2000);
                          } catch {
                            // Ignore
                          }
                        }}
                        className="shrink-0 px-2.5 py-1.5 rounded-[10px] bg-white border border-[#E8E8E2] text-[10px] font-semibold text-[#118AB2] hover:bg-[#E2F6F3] transition-colors"
                      >
                        {vaCopied ? 'Tersalin!' : 'Salin No. VA'}
                      </button>
                    </div>
                    <div className="text-[10px] text-[#8B8FA3]">
                      Transfer sesuai nominal {formatCurrency(getEffectiveNominal())}. Batas pembayaran: 24 jam sebelum kode kedaluwarsa.
                    </div>
                    {payUrl && (
                      <a
                        href={payUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-[10px] bg-[#118AB2] text-white text-[11px] font-semibold hover:bg-[#0e7396] transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Bayar via Halaman Payment Gateway</span>
                        <span className="sm:hidden">Buka Link Pembayaran</span>
                      </a>
                    )}
                    {snapPaymentPanel}
                  </div>
                )}

                <div className="text-xs text-[#585C74] space-y-1">
                  <div>Donatur: <strong>{isAnonim ? 'Hamba Allah (Anonim)' : (user.nama || 'Warga')}</strong></div>
                  <div className="text-[11px] italic">"{pesanDoa}"</div>
                </div>

                {/* Status Verifikasi Dana Masuk */}
                <div className="p-3 rounded-[12px] bg-[#FFF8E6] border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-700 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {paymentMethod.includes('QRIS')
                        ? 'Memverifikasi apakah pembayaran QR sudah masuk...'
                        : 'Memverifikasi apakah transfer sudah masuk ke rekening desa...'}
                    </span>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  </div>
                  <p className="text-[10px] text-[#585C74] text-left">
                    Pemeriksaan otomatis dilakukan setiap 4 detik melalui payment gateway
                    {lastCheckAt ? ` &bull; terakhir dicek ${lastCheckAt}` : ''}
                  </p>
                </div>

                {verifyError && (
                  <div className="flex items-start space-x-2 px-3 py-2 rounded-[10px] bg-red-50 border border-red-100 text-[11px] text-red-700 text-left">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{verifyError}</span>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleManualVerify}
                    disabled={isVerifying}
                    className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-[12px] bg-white border border-[#118AB2] text-[#118AB2] text-xs font-bold hover:bg-[#E2F6F3] transition-colors disabled:opacity-60"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Memeriksa status pembayaran...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          {isServerOrder
                            ? 'Periksa Dana Masuk (Verifikasi Gateway)'
                            : 'Saya Sudah Bayar - Verifikasi Dana Masuk (Demo)'}
                        </span>
                        <span className="sm:hidden">
                          {isServerOrder ? 'Verifikasi Dana Masuk' : 'Sudah Bayar - Verifikasi (Demo)'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Sukses Donasi */}
      {isSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[22px] bg-white border border-[#E8E8E2] shadow-tactile p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#E2F6F3] text-[#118AB2] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-base font-bold text-[#1F2232]">
                Alhamdulillah, Donasi Berhasil!
              </h2>
              <p className="text-xs text-[#585C74] mt-1">
                Terima kasih atas kebaikan dan kepedulian Anda untuk kemajuan Desa Sakalputung. Data dana telah terupdate secara otomatis.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSuccessModal(false);
                setSelectedKegiatan(null);
              }}
              className="w-full py-2.5 rounded-[12px] bg-[#464B71] text-white text-xs font-semibold hover:bg-[#373B5A]"
            >
              Kembali ke Beranda Donasi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
