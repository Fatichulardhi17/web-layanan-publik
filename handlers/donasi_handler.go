package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"sakalputung/config"
	"sakalputung/middleware"
	"sakalputung/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DonasiHandler struct {
	cfg *config.Config
}

func NewDonasiHandler(cfg *config.Config) *DonasiHandler {
	return &DonasiHandler{cfg: cfg}
}

// CreateKegiatanDonasiRequest data input pembuatan forum donasi oleh admin
type CreateKegiatanDonasiRequest struct {
	JudulKegiatan  string  `json:"judul_kegiatan" binding:"required"`
	Deskripsi      string  `json:"deskripsi" binding:"required"`
	BannerURL      *string `json:"banner_url"`
	TargetNominal  float64 `json:"target_nominal" binding:"required,gt=0"`
	TanggalMulai   *string `json:"tanggal_mulai"`
	TanggalSelesai *string `json:"tanggal_selesai"`
}

// BayarDonasiRequest data pembayaran donasi oleh warga
type BayarDonasiRequest struct {
	KegiatanID       uuid.UUID `json:"kegiatan_id" binding:"required"`
	NamaDonatur      string    `json:"nama_donatur" binding:"required"`
	IsAnonim         bool      `json:"is_anonim"`
	Email            *string   `json:"email"`
	NomorTelepon     *string   `json:"nomor_telepon"`
	PesanDoa         *string   `json:"pesan_doa"`
	JumlahDonasi     float64   `json:"jumlah_donasi" binding:"required,gt=0"`
	MetodePembayaran *string   `json:"metode_pembayaran"` // mis. "QRIS Sakalputung", "BCA Virtual Account"
}

// ChargeViaSnap memanggil Snap API Midtrans untuk membuat token pembayaran.
// Frontend membuka halaman Snap dengan token ini; di mode sandbox tersedia panel
// simulasi (Pay success / Pay failed) sehingga alamat QRIS & VA selalu valid.
// Koneksi dipercobaan maksimal 3x karena jaringan ke gateway bisa tidak stabil.
func (h *DonasiHandler) ChargeViaSnap(orderID, nama string, email, telepon *string, jumlah float64, metode string) (snapToken string, redirectURL string, err error) {
	endpoint := "https://app.sandbox.midtrans.com/snap/v1/transactions"
	if h.cfg.MidtransIsProd {
		endpoint = "https://app.midtrans.com/snap/v1/transactions"
	}

	method := strings.ToLower(strings.TrimSpace(metode))

	// Midtrans menuntut format email/telepon valid agar charge tidak ditolak
	emailPembayar := "warga@sakalputung.desa.id"
	if email != nil && strings.TrimSpace(*email) != "" {
		emailPembayar = *email
	}
	teleponPembayar := ""
	if telepon != nil {
		teleponPembayar = *telepon
	}

	payload := map[string]interface{}{
		"transaction_details": map[string]interface{}{
			"order_id":     orderID,
			"gross_amount": int(jumlah),
		},
		"customer_details": map[string]interface{}{
			"first_name": nama,
			"email":      emailPembayar,
			"phone":      teleponPembayar,
		},
	}

	enabled := []string{}
	switch {
	case method == "" || strings.Contains(method, "qris") || strings.Contains(method, "gopay"):
		enabled = []string{"qris"}
	case strings.Contains(method, "bca"):
		enabled = []string{"bca_va"}
	case strings.Contains(method, "mandiri"):
		enabled = []string{"echannel"}
	}
	if len(enabled) > 0 {
		payload["enabled_payments"] = enabled
	}

	// Override URL webhook per transaksi (berguna saat dev, backend di localhost)
	// agar Midtrans mengirim settlement ke URL publik ini tanpa ubah dashboard
	if h.cfg.MidtransNotificationURL != "" {
		payload["notification"] = map[string]interface{}{
			"https": []string{h.cfg.MidtransNotificationURL},
		}
	}

	payloadBytes, errMarshal := json.Marshal(payload)
	if errMarshal != nil {
		return "", "", errMarshal
	}

	var lastErr error
	for attempt := 1; attempt <= 3; attempt++ {
		snapToken, redirectURL, lastErr = h.postSnap(endpoint, payloadBytes)
		if snapToken != "" {
			return snapToken, redirectURL, nil
		}
		if attempt < 3 {
			time.Sleep(time.Duration(attempt) * time.Second)
		}
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("Midtrans tidak mengembalikan snap token (charge ditolak)")
	}
	return "", "", lastErr
}

// postSnap satu kali request ke Snap API dan mem-parsing token/redirect_url
func (h *DonasiHandler) postSnap(endpoint string, payloadBytes []byte) (snapToken string, redirectURL string, err error) {
	httpReq, reqErr := http.NewRequest("POST", endpoint, bytes.NewBuffer(payloadBytes))
	if reqErr != nil {
		return "", "", reqErr
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")
	httpReq.SetBasicAuth(h.cfg.MidtransServerKey, "")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, doErr := client.Do(httpReq)
	if doErr != nil {
		return "", "", doErr
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var midtransResp struct {
		Token         string `json:"token"`
		RedirectURL   string `json:"redirect_url"`
		StatusCode    string `json:"status_code"`
		StatusMessage string `json:"status_message"`
	}
	if unmarshalErr := json.Unmarshal(body, &midtransResp); unmarshalErr != nil {
		return "", "", fmt.Errorf("respon Midtrans tidak valid (HTTP %d): %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	if resp.StatusCode != http.StatusCreated {
		return "", "", fmt.Errorf("Midtrans menolak charge (HTTP %d): %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	if midtransResp.Token == "" {
		return "", "", fmt.Errorf("respon Midtrans tanpa token: %s", strings.TrimSpace(string(body)))
	}
	return midtransResp.Token, midtransResp.RedirectURL, nil
}

// ChargeQrisCoreAPI membuat QRIS asli via Core API Midtrans (payment_type qris).
// Memilih Core API (bukan Snap) agar qr_string bisa langsung dirender di layar
// aplikasi; Snap di sandbox tidak selalu menampilkan panel QRIS di halamannya.
func (h *DonasiHandler) ChargeQrisCoreAPI(orderID, nama string, email, telepon *string, jumlah float64) (qrString string, qrPageURL string, err error) {
	endpoint := "https://api.sandbox.midtrans.com/v2/charge"
	if h.cfg.MidtransIsProd {
		endpoint = "https://api.midtrans.com/v2/charge"
	}

	emailPembayar := "warga@sakalputung.desa.id"
	if email != nil && strings.TrimSpace(*email) != "" {
		emailPembayar = *email
	}
	teleponPembayar := ""
	if telepon != nil {
		teleponPembayar = *telepon
	}

	payload := map[string]interface{}{
		"transaction_details": map[string]interface{}{
			"order_id":     orderID,
			"gross_amount": int(jumlah),
		},
		"customer_details": map[string]interface{}{
			"first_name": nama,
			"email":      emailPembayar,
			"phone":      teleponPembayar,
		},
		"payment_type": "qris",
		"qris":         map[string]interface{}{"acquirer": "gopay"},
	}
	if h.cfg.MidtransNotificationURL != "" {
		payload["notification"] = map[string]interface{}{
			"https": []string{h.cfg.MidtransNotificationURL},
		}
	}

	payloadBytes, marshalErr := json.Marshal(payload)
	if marshalErr != nil {
		return "", "", marshalErr
	}

	var lastErr error
	for attempt := 1; attempt <= 3; attempt++ {
		qrString, qrPageURL, lastErr = h.postChargeQris(endpoint, payloadBytes)
		if qrString != "" {
			return qrString, qrPageURL, nil
		}
		if attempt < 3 {
			time.Sleep(time.Duration(attempt) * time.Second)
		}
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("Midtrans tidak mengembalikan qr_string (charge ditolak)")
	}
	return "", "", lastErr
}

func (h *DonasiHandler) postChargeQris(endpoint string, payloadBytes []byte) (qrString string, qrPageURL string, err error) {
	httpReq, reqErr := http.NewRequest("POST", endpoint, bytes.NewBuffer(payloadBytes))
	if reqErr != nil {
		return "", "", reqErr
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")
	httpReq.SetBasicAuth(h.cfg.MidtransServerKey, "")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, doErr := client.Do(httpReq)
	if doErr != nil {
		return "", "", doErr
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var chargeResp struct {
		StatusCode string `json:"status_code"`
		QRString   string `json:"qr_string"`
		Actions    []struct {
			Name string `json:"name"`
			URL  string `json:"url"`
		} `json:"actions"`
	}
	if unmarshalErr := json.Unmarshal(body, &chargeResp); unmarshalErr != nil {
		return "", "", fmt.Errorf("respon Midtrans tidak valid (HTTP %d): %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	if resp.StatusCode != http.StatusCreated {
		return "", "", fmt.Errorf("Midtrans menolak charge QRIS (HTTP %d): %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	// Halaman QR (generate-qr-code-v2) dipakai sebagai payment_url cadangan
	for _, act := range chargeResp.Actions {
		if act.Name == "generate-qr-code-v2" {
			qrPageURL = act.URL
		} else if act.Name == "generate-qr-code" && qrPageURL == "" {
			qrPageURL = act.URL
		}
	}
	if chargeResp.QRString == "" {
		return "", "", fmt.Errorf("respon Midtrans tanpa qr_string: %s", strings.TrimSpace(string(body)))
	}
	return chargeResp.QRString, qrPageURL, nil
}

// CreateKegiatan admin membuat forum donasi baru untuk kegiatan desa
func (h *DonasiHandler) CreateKegiatan(c *gin.Context) {
	adminID, _ := middleware.GetCurrentUserID(c)

	var req CreateKegiatanDonasiRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Form kegiatan donasi tidak valid", "details": err.Error()})
		return
	}

	slug := generateSlug(req.JudulKegiatan)
	tglMulai := time.Now().Format("2006-01-02")
	if req.TanggalMulai != nil && *req.TanggalMulai != "" {
		tglMulai = *req.TanggalMulai
	}

	query := `
		INSERT INTO public.kegiatan_donasi (admin_id, judul_kegiatan, slug, deskripsi, banner_url, target_nominal, tanggal_mulai, tanggal_selesai)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at;
	`
	var newID uuid.UUID
	var createdAt time.Time
	err := config.DB.QueryRow(query, adminID, req.JudulKegiatan, slug, req.Deskripsi, req.BannerURL, req.TargetNominal, tglMulai, req.TanggalSelesai).Scan(&newID, &createdAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat forum donasi", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Forum kegiatan donasi desa berhasil dibuat",
		"id":      newID,
		"slug":    slug,
	})
}

// GetAllKegiatan mengambil daftar seluruh forum donasi desa yang aktif
func (h *DonasiHandler) GetAllKegiatan(c *gin.Context) {
	if config.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database tidak terhubung"})
		return
	}

	query := `
		SELECT id, admin_id, judul_kegiatan, slug, deskripsi, banner_url, target_nominal,
		       nominal_terkumpul, jumlah_donatur, status, tanggal_mulai, tanggal_selesai, created_at
		FROM public.kegiatan_donasi
		ORDER BY created_at DESC;
	`
	rows, err := config.DB.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar kegiatan donasi", "details": err.Error()})
		return
	}
	defer rows.Close()

	type KegiatanResponse struct {
		ID               uuid.UUID                   `json:"id"`
		JudulKegiatan    string                      `json:"judul_kegiatan"`
		Slug             string                      `json:"slug"`
		Deskripsi        string                      `json:"deskripsi"`
		BannerURL        *string                     `json:"banner_url"`
		TargetNominal    float64                     `json:"target_nominal"`
		NominalTerkumpul float64                     `json:"nominal_terkumpul"`
		Persentase       float64                     `json:"persentase"`
		JumlahDonatur    int                         `json:"jumlah_donatur"`
		Status           models.StatusKegiatanDonasi `json:"status"`
		TanggalMulai     string                      `json:"tanggal_mulai"`
		TanggalSelesai   *string                     `json:"tanggal_selesai"`
		CreatedAt        time.Time                   `json:"created_at"`
	}

	list := make([]KegiatanResponse, 0)
	for rows.Next() {
		var item KegiatanResponse
		var adminID uuid.UUID
		var tglMulai time.Time
		var tglSelesai sql.NullTime

		err := rows.Scan(
			&item.ID, &adminID, &item.JudulKegiatan, &item.Slug, &item.Deskripsi, &item.BannerURL,
			&item.TargetNominal, &item.NominalTerkumpul, &item.JumlahDonatur, &item.Status,
			&tglMulai, &tglSelesai, &item.CreatedAt,
		)
		if err == nil {
			item.TanggalMulai = tglMulai.Format("2006-01-02")
			if tglSelesai.Valid {
				s := tglSelesai.Time.Format("2006-01-02")
				item.TanggalSelesai = &s
			}
			if item.TargetNominal > 0 {
				item.Persentase = (item.NominalTerkumpul / item.TargetNominal) * 100
				if item.Persentase > 100 {
					item.Persentase = 100
				}
			}
			list = append(list, item)
		}
	}

	c.JSON(http.StatusOK, gin.H{"total": len(list), "data": list})
}

// GetKegiatanBySlug detail kegiatan donasi beserta daftar donatur
func (h *DonasiHandler) GetKegiatanBySlug(c *gin.Context) {
	if config.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database tidak terhubung"})
		return
	}

	slug := c.Param("slug")

	query := `
		SELECT id, admin_id, judul_kegiatan, slug, deskripsi, banner_url, target_nominal,
		       nominal_terkumpul, jumlah_donatur, status, tanggal_mulai, tanggal_selesai, created_at
		FROM public.kegiatan_donasi
		WHERE slug = $1;
	`
	var k models.KegiatanDonasi
	var tglMulai time.Time
	var tglSelesai sql.NullTime

	err := config.DB.QueryRow(query, slug).Scan(
		&k.ID, &k.AdminID, &k.JudulKegiatan, &k.Slug, &k.Deskripsi, &k.BannerURL,
		&k.TargetNominal, &k.NominalTerkumpul, &k.JumlahDonatur, &k.Status,
		&tglMulai, &tglSelesai, &k.CreatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kegiatan donasi tidak ditemukan"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil detail donasi", "details": err.Error()})
		return
	}

	k.TanggalMulai = tglMulai.Format("2006-01-02")
	if tglSelesai.Valid {
		s := tglSelesai.Time.Format("2006-01-02")
		k.TanggalSelesai = &s
	}

	// Ambil daftar donatur yang pembayarannya sudah 'berhasil'
	donaturRows, err := config.DB.Query(`
		SELECT nama_donatur, is_anonim, jumlah_donasi, pesan_doa, dibayar_at
		FROM public.transaksi_donasi
		WHERE kegiatan_id = $1 AND status_pembayaran = 'berhasil'
		ORDER BY dibayar_at DESC LIMIT 30;
	`, k.ID)

	type DonaturItem struct {
		NamaDonatur  string     `json:"nama_donatur"`
		JumlahDonasi float64    `json:"jumlah_donasi"`
		PesanDoa     *string    `json:"pesan_doa"`
		Tanggal      *time.Time `json:"tanggal"`
	}

	donaturList := make([]DonaturItem, 0)
	if err == nil {
		defer donaturRows.Close()
		for donaturRows.Next() {
			var d DonaturItem
			var isAnonim bool
			var tgl sql.NullTime
			if err := donaturRows.Scan(&d.NamaDonatur, &isAnonim, &d.JumlahDonasi, &d.PesanDoa, &tgl); err == nil {
				if isAnonim {
					d.NamaDonatur = "Hamba Allah (Anonim)"
				}
				if tgl.Valid {
					d.Tanggal = &tgl.Time
				}
				donaturList = append(donaturList, d)
			}
		}
	}

	persentase := 0.0
	if k.TargetNominal > 0 {
		persentase = (k.NominalTerkumpul / k.TargetNominal) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"kegiatan":       k,
		"persentase":     persentase,
		"daftar_donatur": donaturList,
	})
}

// BayarDonasi warga mendonasikan dana melalui Payment Gateway
func (h *DonasiHandler) BayarDonasi(c *gin.Context) {
	var req BayarDonasiRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data donasi tidak valid", "details": err.Error()})
		return
	}

	var wargaID *uuid.UUID
	if id, ok := middleware.GetCurrentUserID(c); ok {
		wargaID = &id
	}

	// Buat Order ID unik untuk payment gateway
	orderID := fmt.Sprintf("DONASI-SAKALPUTUNG-%d-%s", time.Now().Unix(), uuid.New().String()[:6])

	paymentURL := ""
	// Snap token & URL hanya tersedia jika charge Midtrans sukses.
	// Jangan pernah menyulap URL palsu: frontend akan otomatis mundur
	// ke mode demo lokal jika snap_token kosong.
	snapToken := ""
	methodPembayaran := ""
	if req.MetodePembayaran != nil {
		methodPembayaran = *req.MetodePembayaran
	}

	warning := ""
	qrString := ""
	if h.cfg.MidtransServerKey != "" {
		methodLower := strings.ToLower(strings.TrimSpace(methodPembayaran))
		if methodLower == "" || strings.Contains(methodLower, "qris") || strings.Contains(methodLower, "gopay") {
			// QRIS: Core API charge -> qr_string langsung dirender di layar aplikasi
			createdQR, qrPageURL, chargeErr := h.ChargeQrisCoreAPI(orderID, req.NamaDonatur, req.Email, req.NomorTelepon, req.JumlahDonasi)
			if chargeErr != nil {
				log.Printf("ChargeQRIS gagal untuk order %s: %v", orderID, chargeErr)
				warning = "Payment gateway Midtrans sedang tidak dapat dihubungi. Transaksi tersimpan sebagai pending; silakan coba lagi atau gunakan tombol konfirmasi manual."
			} else {
				qrString = createdQR
				if qrPageURL != "" {
					paymentURL = qrPageURL
				}
			}
		} else {
			// Virtual Account & lainnya: Snap token -> popup Midtrans
			token, redirectURL, chargeErr := h.ChargeViaSnap(orderID, req.NamaDonatur, req.Email, req.NomorTelepon, req.JumlahDonasi, methodPembayaran)
			if chargeErr != nil {
				log.Printf("ChargeSnap gagal untuk order %s: %v", orderID, chargeErr)
				warning = "Payment gateway Midtrans sedang tidak dapat dihubungi. Transaksi tersimpan sebagai pending; silakan coba lagi atau gunakan tombol konfirmasi manual."
			} else {
				snapToken = token
				if redirectURL != "" {
					paymentURL = redirectURL
				}
			}
		}
	}

	// Simpan transaksi donasi ke database dengan status pending
	query := `
		INSERT INTO public.transaksi_donasi
		(kegiatan_id, warga_id, order_id, nama_donatur, is_anonim, email, nomor_telepon, pesan_doa, jumlah_donasi, status_pembayaran, payment_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10)
		RETURNING id, created_at;
	`
	var newTxID uuid.UUID
	var createdAt time.Time
	err := config.DB.QueryRow(
		query,
		req.KegiatanID, wargaID, orderID, req.NamaDonatur, req.IsAnonim,
		req.Email, req.NomorTelepon, req.PesanDoa, req.JumlahDonasi, paymentURL,
	).Scan(&newTxID, &createdAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses transaksi donasi", "details": err.Error()})
		return
	}

	snapScriptURL := "https://app.sandbox.midtrans.com/snap/snap.js"
	if h.cfg.MidtransIsProd {
		snapScriptURL = "https://app.midtrans.com/snap/snap.js"
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Silakan lanjutkan pembayaran donasi Anda melalui payment gateway",
		"order_id":     orderID,
		"snap_token":   snapToken,
		"payment_url":  paymentURL,
		"snap_url":     snapScriptURL,
		"client_key":   h.cfg.MidtransClientKey,
		"jumlah":       req.JumlahDonasi,
		"transaksi_id": newTxID,
		"warning":      warning,
		"qr_string":    qrString,
	})
}

// PaymentWebhook menerima callback dari payment gateway (Midtrans / Xendit dll.)
func (h *DonasiHandler) PaymentWebhook(c *gin.Context) {
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload webhook tidak valid"})
		return
	}

	// Format Midtrans
	orderID, _ := payload["order_id"].(string)
	transactionStatus, _ := payload["transaction_status"].(string)
	paymentType, _ := payload["payment_type"].(string)

	if orderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order_id tidak ditemukan pada payload"})
		return
	}

	newStatus := models.StatusBayarPending
	if transactionStatus == "capture" || transactionStatus == "settlement" {
		newStatus = models.StatusBayarBerhasil
	} else if transactionStatus == "deny" || transactionStatus == "cancel" {
		newStatus = models.StatusBayarGagal
	} else if transactionStatus == "expire" {
		newStatus = models.StatusBayarKadaluarsa
	}

	jsonBytes, _ := json.Marshal(payload)

	// Update status di transaksi_donasi
	query := `
		UPDATE public.transaksi_donasi
		SET status_pembayaran = $1::status_transaksi_donasi,
		    metode_pembayaran = $2,
		    payment_gateway_response = $3,
		    dibayar_at = CASE WHEN $1::text = 'berhasil' THEN NOW() ELSE dibayar_at END,
		    updated_at = NOW()
		WHERE order_id = $4
		RETURNING kegiatan_id, jumlah_donasi;
	`
	var kegiatanID uuid.UUID
	var jumlahDonasi float64
	err := config.DB.QueryRow(query, newStatus, paymentType, string(jsonBytes), orderID).Scan(&kegiatanID, &jumlahDonasi)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order ID tidak ditemukan"})
		return
	}

	// Jika trigger database tidak aktif / fallback Go, sinkronkan nominal kegiatan
	if newStatus == models.StatusBayarBerhasil {
		_, _ = config.DB.Exec(`
			UPDATE public.kegiatan_donasi
			SET nominal_terkumpul = nominal_terkumpul + $1,
			    jumlah_donatur = jumlah_donatur + 1
			WHERE id = $2;
		`, jumlahDonasi, kegiatanID)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status pembayaran berhasil diproses", "status": newStatus})
}

// GetStatusTransaksi verifikasi apakah dana donasi sudah masuk (QRIS / Virtual Account)
// Frontend memakai endpoint ini untuk memeriksa status pembayaran berdasarkan order_id
func (h *DonasiHandler) GetStatusTransaksi(c *gin.Context) {
	if config.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database tidak terhubung"})
		return
	}

	orderID := c.Param("order_id")

	query := `
		SELECT status_pembayaran, metode_pembayaran, jumlah_donasi, dibayar_at, updated_at
		FROM public.transaksi_donasi
		WHERE order_id = $1;
	`
	var status models.StatusTransaksiDonasi
	var metode sql.NullString
	var jumlahDonasi float64
	var dibayarAt sql.NullTime
	var updatedAt time.Time

	err := config.DB.QueryRow(query, orderID).Scan(&status, &metode, &jumlahDonasi, &dibayarAt, &updatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaksi tidak ditemukan"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memverifikasi status donasi", "details": err.Error()})
		return
	}

	isPaid := status == models.StatusBayarBerhasil

	// Untuk transaksi pending, ambil QRIS / nomor VA asli dari Midtrans
	// agar frontend menampilkan kode pembayaran yang valid di layar
	qrString := ""
	vaNumber := ""
	if h.cfg.MidtransServerKey != "" && status == models.StatusBayarPending {
		qrString, vaNumber = h.FetchMidtransPaymentDetail(orderID)
	}

	c.JSON(http.StatusOK, gin.H{
		"order_id":          orderID,
		"status_pembayaran": status,
		"is_paid":           isPaid,
		"metode_pembayaran": metode.String,
		"jumlah_donasi":     jumlahDonasi,
		"dibayar_at":        dibayarAt,
		"updated_at":        updatedAt,
		"qr_string":         qrString,
		"va_number":         vaNumber,
	})
}

// FetchMidtransPaymentDetail mengkueri Core API Midtrans untuk transaksi Snap
// dan mengembalikan qr_string (QRIS) serta nomor Virtual Account-nya
func (h *DonasiHandler) FetchMidtransPaymentDetail(orderID string) (qrString string, vaNumber string) {
	endpoint := fmt.Sprintf("https://api.sandbox.midtrans.com/v2/%s/status", orderID)
	if h.cfg.MidtransIsProd {
		endpoint = fmt.Sprintf("https://api.midtrans.com/v2/%s/status", orderID)
	}

	httpReq, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return
	}
	httpReq.Header.Set("Accept", "application/json")
	httpReq.SetBasicAuth(h.cfg.MidtransServerKey, "")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var detail struct {
		StatusCode string `json:"status_code"`
		QRString   string `json:"qr_string"`
		VaNumbers  []struct {
			Bank     string `json:"bank"`
			VaNumber string `json:"va_number"`
		} `json:"va_numbers"`
	}
	if json.Unmarshal(body, &detail) == nil && detail.StatusCode == "201" {
		qrString = detail.QRString
		if len(detail.VaNumbers) > 0 {
			vaNumber = detail.VaNumbers[0].VaNumber
		}
	}
	return
}

// SimulasiPembayaranSukses endpoint developer untuk mensimulasikan pembayaran tanpa real payment gateway
func (h *DonasiHandler) SimulasiPembayaranSukses(c *gin.Context) {
	orderID := c.Param("order_id")

	query := `
		UPDATE public.transaksi_donasi
		SET status_pembayaran = 'berhasil',
		    metode_pembayaran = 'qris_simulasi',
		    dibayar_at = NOW(),
		    updated_at = NOW()
		WHERE order_id = $1 AND status_pembayaran != 'berhasil'
		RETURNING kegiatan_id, jumlah_donasi;
	`
	var kegiatanID uuid.UUID
	var jumlahDonasi float64
	err := config.DB.QueryRow(query, orderID).Scan(&kegiatanID, &jumlahDonasi)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Transaksi tidak ditemukan atau sudah berhasil"})
		return
	}

	// Update nominal kegiatan
	_, _ = config.DB.Exec(`
		UPDATE public.kegiatan_donasi
		SET nominal_terkumpul = nominal_terkumpul + $1,
		    jumlah_donatur = jumlah_donatur + 1
		WHERE id = $2;
	`, jumlahDonasi, kegiatanID)

	c.JSON(http.StatusOK, gin.H{
		"message":       "Simulasi pembayaran berhasil! Nominal donasi otomatis terupdate.",
		"order_id":      orderID,
		"jumlah_donasi": jumlahDonasi,
	})
}
