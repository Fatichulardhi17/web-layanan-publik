package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"sakalputung/config"
	"sakalputung/routes"
)

const (
	colorReset  = "\033[0m"
	colorGreen  = "\033[32m"
	colorRed    = "\033[31m"
	colorYellow = "\033[33m"
	colorCyan   = "\033[36m"
	colorBold   = "\033[1m"
)

var (
	baseURL   = "http://localhost:8080/api"
	client    = &http.Client{Timeout: 10 * time.Second}
	passCount = 0
	failCount = 0
)

func request(method, path string, body interface{}, token string) (int, map[string]interface{}, error) {
	var bodyReader io.Reader
	if body != nil {
		jsonBytes, err := json.Marshal(body)
		if err != nil {
			return 0, nil, err
		}
		bodyReader = bytes.NewBuffer(jsonBytes)
	}

	req, err := http.NewRequest(method, baseURL+path, bodyReader)
	if err != nil {
		return 0, nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := client.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return resp.StatusCode, nil, err
	}

	var respMap map[string]interface{}
	_ = json.Unmarshal(respBytes, &respMap)

	return resp.StatusCode, respMap, nil
}

func printTest(num int, title, method, path string, status int, expectedStatus int, resp map[string]interface{}) {
	isPass := (status == expectedStatus) || (expectedStatus == 200 && (status == 200 || status == 201))
	if isPass {
		passCount++
		fmt.Printf("%s[LULUS %02d]%s %s%-45s%s %s%s %s%s (Status: %d)\n",
			colorGreen, num, colorReset,
			colorBold, title, colorReset,
			colorYellow, method, colorCyan, path, status)
	} else {
		failCount++
		fmt.Printf("%s[GAGAL %02d]%s %s%-45s%s %s%s %s%s (Status: %d, Harapan: %d)\n",
			colorRed, num, colorReset,
			colorBold, title, colorReset,
			colorYellow, method, colorCyan, path, status, expectedStatus)
		if resp != nil {
			respJSON, _ := json.Marshal(resp)
			fmt.Printf("   %sResponse: %s%s\n", colorRed, string(respJSON), colorReset)
		}
	}
}

func main() {
	fmt.Println(colorBold + "======================================================================" + colorReset)
	fmt.Println(colorCyan + colorBold + " 🚀 MENJALANKAN SELURUH UJI COBA REQUEST BACKEND SAKALPUTUNG" + colorReset)
	fmt.Println(colorBold + "======================================================================" + colorReset)

	// Inisialisasi Server Internal jika belum running
	cfg := config.LoadConfig()
	_, _ = config.InitDatabase(cfg.DatabaseURL)
	r := routes.SetupRouter(cfg)

	go func() {
		_ = r.Run(":" + cfg.Port)
	}()
	time.Sleep(1 * time.Second)

	// Variabel penyimpan state testing
	var adminToken string
	var wargaToken string
	var createdLaporanID string
	var createdBeritaSlug string
	var createdNotifSuratID string
	var createdKegiatanSlug string
	var createdOrderID string

	// -------------------------------------------------------------------------
	// 1. HEALTH CHECK
	// -------------------------------------------------------------------------
	st, resp, _ := request("GET", "/health", nil, "")
	printTest(1, "Health Check Server", "GET", "/api/health", st, 200, resp)

	// -------------------------------------------------------------------------
	// 2. AUTENTIKASI ADMIN RT 1-5 (ROAD.md: nama rt 1-5)
	// -------------------------------------------------------------------------
	st, resp, _ = request("POST", "/auth/admin/login", map[string]interface{}{
		"username": "rt1",
		"password": "admin123desa",
	}, "")
	if resp != nil && resp["token"] != nil {
		adminToken = resp["token"].(string)
	}
	printTest(2, "Login Admin RT 01", "POST", "/api/auth/admin/login", st, 200, resp)

	// -------------------------------------------------------------------------
	// 3. AUTENTIKASI WARGA (ROAD.md: login nomor/email)
	// -------------------------------------------------------------------------
	st, resp, _ = request("POST", "/auth/warga/login", map[string]interface{}{
		"nomor_telepon": "081234567899",
		"email":         "warga.test@gmail.com",
	}, "")
	if resp != nil && resp["token"] != nil {
		wargaToken = resp["token"].(string)
	}
	printTest(3, "Login Warga via No. HP/Email", "POST", "/api/auth/warga/login", st, 200, resp)

	// -------------------------------------------------------------------------
	// 4. ONBOARDING PROFIL WARGA (ROAD.md: nama, umur, rt, alamat -> maps)
	// -------------------------------------------------------------------------
	st, resp, _ = request("POST", "/auth/onboarding", map[string]interface{}{
		"nama_lengkap":   "Budi Hartono",
		"umur":           38,
		"rt":             1,
		"nomor_telepon":  "081234567899",
		"alamat_lengkap": "Jl. Sakalputung No. 12, RT 01 RW 01",
		"latitude":       -6.914800,
		"longitude":      107.609750,
	}, wargaToken)
	printTest(4, "Onboarding Profil Warga", "POST", "/api/auth/onboarding", st, 200, resp)

	// -------------------------------------------------------------------------
	// 5. GET PROFIL ME
	// -------------------------------------------------------------------------
	st, resp, _ = request("GET", "/auth/me", nil, wargaToken)
	printTest(5, "Get Profil User Login", "GET", "/api/auth/me", st, 200, resp)

	// -------------------------------------------------------------------------
	// 6. DASHBOARD ADMIN STATS (ROAD.md: dashboard admin)
	// -------------------------------------------------------------------------
	st, resp, _ = request("GET", "/admin/dashboard/stats", nil, adminToken)
	printTest(6, "Statistik Dashboard Admin", "GET", "/api/admin/dashboard/stats", st, 200, resp)

	// -------------------------------------------------------------------------
	// 7. TAMBAH DATA PENDUDUK (ROAD.md: nama, umur, rt, alamat rumah melalui maps)
	// -------------------------------------------------------------------------
	st, resp, _ = request("POST", "/penduduk", map[string]interface{}{
		"nik":          fmt.Sprintf("330101990%d", time.Now().Unix()%10000000),
		"nama":         "Pak Surya Atmaja",
		"umur":         52,
		"rt":           1,
		"alamat_rumah": "Jl. Sakalputung No. 25, RT 01",
		"latitude":     -6.914620,
		"longitude":    107.609650,
		"pekerjaan":    "Wiraswasta",
	}, adminToken)
	printTest(7, "Admin Tambah Data Penduduk", "POST", "/api/penduduk", st, 201, resp)

	// -------------------------------------------------------------------------
	// 8. LIHAT DATA PENDUDUK (ROAD.md: data penduduk rt 1-5)
	// -------------------------------------------------------------------------
	st, resp, _ = request("GET", "/penduduk?rt=1", nil, adminToken)
	printTest(8, "Lihat Data Penduduk RT 1-5", "GET", "/api/penduduk?rt=1", st, 200, resp)

	// -------------------------------------------------------------------------
	// 9. MAPS TITIK ALAMAT PENDUDUK (ROAD.md: alamat rumah melalui maps)
	// -------------------------------------------------------------------------
	st, resp, _ = request("GET", "/penduduk/maps", nil, adminToken)
	printTest(9, "Ambil Titik Maps Alamat Warga", "GET", "/api/penduduk/maps", st, 200, resp)

	// -------------------------------------------------------------------------
	// 10. LAPORAN KENDALA WARGA + FOTO (ROAD.md: lapor kendala + foto & keluhan)
	// -------------------------------------------------------------------------
	st, resp, _ = request("POST", "/laporan", map[string]interface{}{
		"judul":         "Saluran Air Tersumbat Sampah di RT 01",
		"deskripsi":     "Drainase di depan gang mampet air meluap ke jalan saat hujan deras.",
		"rt":            1,
		"alamat_lokasi": "Gang Sakalputung Indah RT 01",
		"latitude":      -6.914750,
		"longitude":     107.609800,
		"foto_url":      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
	}, wargaToken)
	if resp != nil && resp["id"] != nil {
		createdLaporanID = resp["id"].(string)
	}
	printTest(10, "Warga Kirim Laporan Kendala + Foto", "POST", "/api/laporan", st, 201, resp)

	// -------------------------------------------------------------------------
	// 11. LIHAT DAFTAR LAPORAN
	// -------------------------------------------------------------------------
	st, resp, _ = request("GET", "/laporan", nil, adminToken)
	printTest(11, "Lihat Daftar Laporan Kendala", "GET", "/api/laporan", st, 200, resp)

	// -------------------------------------------------------------------------
	// 12. ADMIN KELOLA STATUS LAPORAN (ROAD.md: belum, menunggu info, sudah dikerjakan)
	// -------------------------------------------------------------------------
	if createdLaporanID != "" {
		st, resp, _ = request("PATCH", "/laporan/"+createdLaporanID+"/status", map[string]interface{}{
			"status":        "sudah_dikerjakan",
			"catatan_admin": "Petugas kebersihan telah membersihkan saluran air.",
		}, adminToken)
		printTest(12, "Admin Update Status Laporan Selesai", "PATCH", "/api/laporan/:id/status", st, 200, resp)
	}

	// -------------------------------------------------------------------------
	// 13. TAMBAH BERITA DESA (ROAD.md: admin menambahkan berita desa)
	// -------------------------------------------------------------------------
	st, resp, _ = request("POST", "/berita", map[string]interface{}{
		"judul":            "Pembangunan Posyandu Terpadu RT 01 - RT 05 Sakalputung",
		"ringkasan":        "Gedung posyandu baru siap melayani cek kesehatan balita dan lansia.",
		"isi":              "Pemerintah Desa Sakalputung meresmikan gedung posyandu baru yang berlokasi strategis untuk seluruh warga.",
		"gambar_cover_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800",
		"kategori":         "Kegiatan",
	}, adminToken)
	if resp != nil && resp["slug"] != nil {
		createdBeritaSlug = resp["slug"].(string)
	}
	printTest(13, "Admin Publikasikan Berita Desa", "POST", "/api/berita", st, 201, resp)

	// -------------------------------------------------------------------------
	// 14. WARGA MELIHAT BERITA DESA (ROAD.md: warga dapat melihat berita)
	// -------------------------------------------------------------------------
	st, resp, _ = request("GET", "/berita", nil, "")
	printTest(14, "Melihat Daftar Berita Desa", "GET", "/api/berita", st, 200, resp)

	// -------------------------------------------------------------------------
	// 15. BACA DETAIL BERITA DESA
	// -------------------------------------------------------------------------
	if createdBeritaSlug != "" {
		st, resp, _ = request("GET", "/berita/"+createdBeritaSlug, nil, "")
		printTest(15, "Baca Detail Isi Berita Desa", "GET", "/api/berita/:slug", st, 200, resp)
	}

	// -------------------------------------------------------------------------
	// 16. SURAT PUSAT & BAGIKAN OTOMATIS (ROAD.md: surat pusat dibagikan otomatis)
	// -------------------------------------------------------------------------
	st, resp, _ = request("POST", "/surat", map[string]interface{}{
		"nomor_surat":      fmt.Sprintf("SRT/%d/KEMENDES/2026", time.Now().Unix()%10000),
		"asal_instansi":    "Kementerian Desa PDTT",
		"perihal":          "Sosialisasi Bantuan Modal Usaha UMKM Warga Desa",
		"ringkasan_isi":    "Pendaftaran program pendampingan usaha dan permodalan UMKM dibuka hingga akhir bulan.",
		"file_dokumen_url": "https://example.com/dokumen/surat-kemendes.pdf",
		"target_rt":        nil, // Seluruh RT 1-5
		"bagikan_otomatis": true,
	}, adminToken)
	printTest(16, "Admin Input Surat Pusat (Auto-Broadcast)", "POST", "/api/surat", st, 201, resp)

	// -------------------------------------------------------------------------
	// 17. ARSIP SURAT PUSAT
	// -------------------------------------------------------------------------
	st, resp, _ = request("GET", "/surat", nil, adminToken)
	printTest(17, "Lihat Arsip Seluruh Surat Masuk", "GET", "/api/surat", st, 200, resp)

	// -------------------------------------------------------------------------
	// 18. PESAN SURAT DITERIMA WARGA (ROAD.md: warga dapat pesan surat dari pusat)
	// -------------------------------------------------------------------------
	time.Sleep(500 * time.Millisecond) // jeda broadcast
	st, resp, _ = request("GET", "/surat/warga", nil, wargaToken)
	if resp != nil && resp["data"] != nil {
		arr := resp["data"].([]interface{})
		if len(arr) > 0 {
			firstItem := arr[0].(map[string]interface{})
			if firstItem["id"] != nil {
				createdNotifSuratID = firstItem["id"].(string)
			}
		}
	}
	printTest(18, "Warga Terima Pesan Kabar Surat", "GET", "/api/surat/warga", st, 200, resp)

	// -------------------------------------------------------------------------
	// 19. TANDAI SURAT DIBACA
	// -------------------------------------------------------------------------
	if createdNotifSuratID != "" {
		st, resp, _ = request("PATCH", "/surat/notifikasi/"+createdNotifSuratID+"/read", nil, wargaToken)
		printTest(19, "Warga Tandai Surat Sudah Dibaca", "PATCH", "/api/surat/notifikasi/:id/read", st, 200, resp)
	}

	// -------------------------------------------------------------------------
	// 20. FORUM DONASI KEGIATAN DESA (ROAD.md: admin membuat forum donasi)
	// -------------------------------------------------------------------------
	st, resp, _ = request("POST", "/donasi/kegiatan", map[string]interface{}{
		"judul_kegiatan": fmt.Sprintf("Santunan Ramadhan & Yatim Piatu RT 1-5 (%d)", time.Now().Unix()%1000),
		"deskripsi":      "Program pembagian paket sembako dan santunan anak yatim di lingkungan desa Sakalputung.",
		"banner_url":     "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800",
		"target_nominal": 10000000.0,
	}, adminToken)
	var kegiatanID string
	if resp != nil {
		if resp["slug"] != nil {
			createdKegiatanSlug = resp["slug"].(string)
		}
		if resp["id"] != nil {
			kegiatanID = resp["id"].(string)
		}
	}
	printTest(20, "Admin Buat Forum Donasi Kegiatan Desa", "POST", "/api/donasi/kegiatan", st, 201, resp)

	// -------------------------------------------------------------------------
	// 21. WARGA MELIHAT FORUM DONASI
	// -------------------------------------------------------------------------
	st, resp, _ = request("GET", "/donasi/kegiatan", nil, "")
	printTest(21, "Lihat Forum Kegiatan Donasi Aktif", "GET", "/api/donasi/kegiatan", st, 200, resp)

	// -------------------------------------------------------------------------
	// 22. LIHAT DETAIL FORUM DONASI
	// -------------------------------------------------------------------------
	if createdKegiatanSlug != "" {
		st, resp, _ = request("GET", "/donasi/kegiatan/"+createdKegiatanSlug, nil, "")
		printTest(22, "Lihat Detail Donasi & Daftar Donatur", "GET", "/api/donasi/kegiatan/:slug", st, 200, resp)
	}

	// -------------------------------------------------------------------------
	// 23. WARGA BERDONASI VIA PAYMENT GATEWAY (ROAD.md: payment gateway)
	// -------------------------------------------------------------------------
	if kegiatanID != "" {
		st, resp, _ = request("POST", "/donasi/bayar", map[string]interface{}{
			"kegiatan_id":   kegiatanID,
			"nama_donatur":  "Hamba Allah",
			"is_anonim":     true,
			"jumlah_donasi": 150000.0,
			"pesan_doa":     "Semoga berkah dan bermanfaat untuk warga Sakalputung.",
		}, wargaToken)
		if resp != nil && resp["order_id"] != nil {
			createdOrderID = resp["order_id"].(string)
		}
		printTest(23, "Warga Bayar Donasi via Payment Gateway", "POST", "/api/donasi/bayar", st, 201, resp)
	}

	// -------------------------------------------------------------------------
	// 24. SIMULASI PEMBAYARAN SUKSES
	// -------------------------------------------------------------------------
	if createdOrderID != "" {
		st, resp, _ = request("POST", "/donasi/simulasi-sukses/"+createdOrderID, nil, "")
		printTest(24, "Simulasi Pembayaran Donasi Berhasil", "POST", "/api/donasi/simulasi-sukses/:order_id", st, 200, resp)
	}

	// -------------------------------------------------------------------------
	// 25. WEBHOOK PAYMENT GATEWAY (MIDTRANS CALLBACK)
	// -------------------------------------------------------------------------
	var webhookOrderID string
	if kegiatanID != "" {
		_, respDonasi2, _ := request("POST", "/donasi/bayar", map[string]interface{}{
			"kegiatan_id":   kegiatanID,
			"nama_donatur":  "Donatur Webhook",
			"is_anonim":     false,
			"jumlah_donasi": 75000.0,
			"pesan_doa":     "Uji coba notifikasi webhook payment gateway.",
		}, "")
		if respDonasi2 != nil && respDonasi2["order_id"] != nil {
			webhookOrderID = respDonasi2["order_id"].(string)
		}
	}

	if webhookOrderID != "" {
		st, resp, _ = request("POST", "/donasi/webhook", map[string]interface{}{
			"order_id":           webhookOrderID,
			"transaction_status": "settlement",
			"payment_type":       "qris",
			"gross_amount":       "75000.00",
		}, "")
		printTest(25, "Webhook Notifikasi Payment Gateway", "POST", "/api/donasi/webhook", st, 200, resp)
	}

	// Ringkasan
	fmt.Println(colorBold + "======================================================================" + colorReset)
	total := passCount + failCount
	fmt.Printf("%sHASIL AKHIR: %d Total Request | %s%d LULUS (PASS)%s | %s%d GAGAL (FAIL)%s\n",
		colorBold, total, colorGreen, passCount, colorReset, colorRed, failCount, colorReset)
	fmt.Println(colorBold + "======================================================================" + colorReset)
}
