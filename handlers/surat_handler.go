package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"sakalputung/config"
	"sakalputung/middleware"
	"sakalputung/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SuratHandler struct{}

func NewSuratHandler() *SuratHandler {
	return &SuratHandler{}
}

// CreateSuratRequest data input surat dari pusat oleh admin
type CreateSuratRequest struct {
	NomorSurat      string  `json:"nomor_surat" binding:"required"`
	AsalInstansi    string  `json:"asal_instansi"`
	Perihal         string  `json:"perihal" binding:"required"`
	RingkasanIsi    string  `json:"ringkasan_isi" binding:"required"`
	FileDokumenURL  *string `json:"file_dokumen_url"`
	TargetRT        *int    `json:"target_rt"` // null = Seluruh RT 1-5, atau 1-5
	TanggalSurat    *string `json:"tanggal_surat"`
	BagikanOtomatis *bool   `json:"bagikan_otomatis"`
}

// CreateSurat admin menginput surat pusat dan otomatis menyebarkan kabar ke seluruh warga
func (h *SuratHandler) CreateSurat(c *gin.Context) {
	adminID, _ := middleware.GetCurrentUserID(c)

	var req CreateSuratRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Informasi surat tidak lengkap", "details": err.Error()})
		return
	}

	asalInstansi := "Pemerintah Pusat"
	if req.AsalInstansi != "" {
		asalInstansi = req.AsalInstansi
	}
	bagikanOtomatis := true
	if req.BagikanOtomatis != nil {
		bagikanOtomatis = *req.BagikanOtomatis
	}

	query := `
		INSERT INTO public.surat_pusat (admin_id, nomor_surat, asal_instansi, perihal, ringkasan_isi, file_dokumen_url, target_rt, bagikan_otomatis)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at;
	`
	var newID uuid.UUID
	var createdAt time.Time

	err := config.DB.QueryRow(
		query,
		adminID, req.NomorSurat, asalInstansi, req.Perihal, req.RingkasanIsi, req.FileDokumenURL, req.TargetRT, bagikanOtomatis,
	).Scan(&newID, &createdAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan surat pusat", "details": err.Error()})
		return
	}

	// Jika trigger database tidak aktif / fallback Go, pastikan notifikasi dibagikan otomatis ke warga
	if bagikanOtomatis {
		go func(suratID uuid.UUID, targetRT *int) {
			if config.DB == nil {
				return
			}
			notifQuery := `
				INSERT INTO public.notifikasi_surat_warga (surat_id, warga_id)
				SELECT $1, p.id
				FROM public.profiles p
				WHERE p.role = 'warga'
				  AND ($2::int IS NULL OR p.rt = $2)
				ON CONFLICT (surat_id, warga_id) DO NOTHING;
			`
			_, _ = config.DB.Exec(notifQuery, suratID, targetRT)
		}(newID, req.TargetRT)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":          "Surat dari pusat berhasil ditambahkan dan otomatis dikabarkan kepada warga!",
		"id":               newID,
		"bagikan_otomatis": bagikanOtomatis,
	})
}

// GetAllSurat mengambil daftar arsip surat masuk dari pusat (untuk admin dan portal warga)
func (h *SuratHandler) GetAllSurat(c *gin.Context) {
	if config.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database tidak terhubung"})
		return
	}

	query := `
		SELECT s.id, s.admin_id, s.nomor_surat, s.asal_instansi, s.perihal, s.ringkasan_isi,
		       s.file_dokumen_url, s.target_rt, s.tanggal_surat, s.bagikan_otomatis, s.created_at
		FROM public.surat_pusat s
		ORDER BY s.tanggal_surat DESC, s.created_at DESC
	`
	rows, err := config.DB.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar surat", "details": err.Error()})
		return
	}
	defer rows.Close()

	list := make([]models.SuratPusat, 0)
	for rows.Next() {
		var s models.SuratPusat
		var targetRT sql.NullInt32
		var tglSurat time.Time
		err := rows.Scan(
			&s.ID, &s.AdminID, &s.NomorSurat, &s.AsalInstansi, &s.Perihal, &s.RingkasanIsi,
			&s.FileDokumenURL, &targetRT, &tglSurat, &s.BagikanOtomatis, &s.CreatedAt,
		)
		if err == nil {
			if targetRT.Valid {
				rtVal := int(targetRT.Int32)
				s.TargetRT = &rtVal
			}
			s.TanggalSurat = tglSurat.Format("2006-01-02")
			list = append(list, s)
		}
	}

	c.JSON(http.StatusOK, gin.H{"total": len(list), "data": list})
}

// GetNotifikasiWarga warga melihat pesan/notifikasi masuk mengenai surat dari pusat
func (h *SuratHandler) GetNotifikasiWarga(c *gin.Context) {
	wargaID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak terotentikasi"})
		return
	}

	query := `
		SELECT n.id, n.surat_id, s.nomor_surat, s.asal_instansi, s.perihal, s.ringkasan_isi,
		       s.file_dokumen_url, s.tanggal_surat, n.is_dibaca, n.dibaca_at, n.created_at
		FROM public.notifikasi_surat_warga n
		JOIN public.surat_pusat s ON n.surat_id = s.id
		WHERE n.warga_id = $1
		ORDER BY n.created_at DESC;
	`
	rows, err := config.DB.Query(query, wargaID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil pesan surat warga", "details": err.Error()})
		return
	}
	defer rows.Close()

	type NotifItem struct {
		ID             uuid.UUID `json:"id"`
		SuratID        uuid.UUID `json:"surat_id"`
		NomorSurat     string    `json:"nomor_surat"`
		AsalInstansi   string    `json:"asal_instansi"`
		Perihal        string    `json:"perihal"`
		RingkasanIsi   string    `json:"ringkasan_isi"`
		FileDokumenURL *string   `json:"file_dokumen_url"`
		TanggalSurat   string    `json:"tanggal_surat"`
		IsDibaca       bool      `json:"is_dibaca"`
		DibacaAt       *time.Time `json:"dibaca_at"`
		CreatedAt      time.Time `json:"created_at"`
	}

	list := make([]NotifItem, 0)
	for rows.Next() {
		var item NotifItem
		var tgl time.Time
		err := rows.Scan(
			&item.ID, &item.SuratID, &item.NomorSurat, &item.AsalInstansi, &item.Perihal,
			&item.RingkasanIsi, &item.FileDokumenURL, &tgl, &item.IsDibaca, &item.DibacaAt, &item.CreatedAt,
		)
		if err == nil {
			item.TanggalSurat = tgl.Format("2006-01-02")
			list = append(list, item)
		}
	}

	c.JSON(http.StatusOK, gin.H{"total": len(list), "data": list})
}

// MarkAsRead menandai bahwa pesan surat telah dibaca oleh warga
func (h *SuratHandler) MarkAsRead(c *gin.Context) {
	wargaID, _ := middleware.GetCurrentUserID(c)
	notifIDParam := c.Param("id")
	notifID, err := uuid.Parse(notifIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID notifikasi tidak valid"})
		return
	}

	query := `
		UPDATE public.notifikasi_surat_warga
		SET is_dibaca = true, dibaca_at = NOW()
		WHERE id = $1 AND warga_id = $2;
	`
	res, err := config.DB.Exec(query, notifID, wargaID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update status dibaca"})
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesan surat tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pesan surat berhasil ditandai sudah dibaca"})
}
