package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"sakalputung/config"
	"sakalputung/middleware"
	"sakalputung/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type LaporanHandler struct{}

func NewLaporanHandler() *LaporanHandler {
	return &LaporanHandler{}
}

// CreateLaporanRequest payload warga lapor kendala desa
type CreateLaporanRequest struct {
	Judul        string   `json:"judul" binding:"required"`
	Deskripsi    string   `json:"deskripsi" binding:"required"`
	RT           int      `json:"rt" binding:"required,min=1,max=5"`
	AlamatLokasi *string  `json:"alamat_lokasi"`
	Latitude     *float64 `json:"latitude"`
	Longitude    *float64 `json:"longitude"`
	FotoURL      string   `json:"foto_url" binding:"required"` // URL foto kendala dari Supabase storage
}

// UpdateStatusLaporanRequest payload admin mengelola status laporan warga
type UpdateStatusLaporanRequest struct {
	Status       models.StatusLaporan `json:"status" binding:"required"` // belum_dikerjakan, menunggu_info_lanjut, sudah_dikerjakan
	CatatanAdmin *string              `json:"catatan_admin"`
}

// CreateLaporan warga mengirimkan laporan keluhan/kendala dengan foto
func (h *LaporanHandler) CreateLaporan(c *gin.Context) {
	wargaID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Warga harus login terlebih dahulu"})
		return
	}

	var req CreateLaporanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Form laporan belum lengkap (wajib ada foto & keluhan)", "details": err.Error()})
		return
	}

	if config.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database tidak terhubung"})
		return
	}

	query := `
		INSERT INTO public.laporan_kendala (warga_id, judul, deskripsi, rt, alamat_lokasi, latitude, longitude, foto_url, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'belum_dikerjakan')
		RETURNING id, created_at;
	`
	var newID uuid.UUID
	var createdAt time.Time
	err := config.DB.QueryRow(
		query,
		wargaID, req.Judul, req.Deskripsi, req.RT, req.AlamatLokasi, req.Latitude, req.Longitude, req.FotoURL,
	).Scan(&newID, &createdAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan laporan", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Laporan kendala berhasil dikirim dan akan segera ditinjau oleh pengurus RT",
		"id":      newID,
		"status":  models.StatusBelumDikerjakan,
	})
}

// GetLaporan mengambil daftar laporan kendala
// Jika role warga: hanya laporan miliknya
// Jika admin: seluruh laporan atau terfilter RT/status
func (h *LaporanHandler) GetLaporan(c *gin.Context) {
	if config.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database tidak terhubung"})
		return
	}

	userID, _ := middleware.GetCurrentUserID(c)
	role, _ := middleware.GetCurrentUserRole(c)
	adminRT := middleware.GetCurrentUserRT(c)

	statusParam := c.Query("status")
	rtParam := c.Query("rt")

	query := `
		SELECT l.id, l.warga_id, p.nama_lengkap, l.judul, l.deskripsi, l.rt, l.alamat_lokasi,
		       l.latitude, l.longitude, l.foto_url, l.status, l.catatan_admin, l.ditangani_oleh,
		       l.selesai_at, l.created_at, l.updated_at
		FROM public.laporan_kendala l
		LEFT JOIN public.profiles p ON l.warga_id = p.id
		WHERE 1=1
	`
	var args []interface{}
	idx := 1

	if role == models.RoleWarga {
		// Warga hanya melihat aduan mereka sendiri
		query += fmt.Sprintf(" AND l.warga_id = $%d", idx)
		args = append(args, userID)
		idx++
	} else if adminRT != nil {
		// Admin RT melihat aduan di RT mereka secara default
		query += fmt.Sprintf(" AND l.rt = $%d", idx)
		args = append(args, *adminRT)
		idx++
	} else if rtParam != "" {
		query += fmt.Sprintf(" AND l.rt = $%d", idx)
		args = append(args, rtParam)
		idx++
	}

	if statusParam != "" {
		query += fmt.Sprintf(" AND l.status = $%d", idx)
		args = append(args, statusParam)
		idx++
	}

	query += " ORDER BY l.created_at DESC"

	rows, err := config.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data laporan", "details": err.Error()})
		return
	}
	defer rows.Close()

	type LaporanResponse struct {
		ID            uuid.UUID            `json:"id"`
		WargaID       uuid.UUID            `json:"warga_id"`
		NamaPelapor   string               `json:"nama_pelapor"`
		Judul         string               `json:"judul"`
		Deskripsi     string               `json:"deskripsi"`
		RT            int                  `json:"rt"`
		AlamatLokasi  *string              `json:"alamat_lokasi"`
		Latitude      *float64             `json:"latitude"`
		Longitude     *float64             `json:"longitude"`
		FotoURL       string               `json:"foto_url"`
		Status        models.StatusLaporan `json:"status"`
		CatatanAdmin  *string              `json:"catatan_admin"`
		DitanganiOleh *uuid.UUID           `json:"ditangani_oleh"`
		SelesaiAt     *time.Time           `json:"selesai_at"`
		CreatedAt     time.Time            `json:"created_at"`
		UpdatedAt     time.Time            `json:"updated_at"`
	}

	results := make([]LaporanResponse, 0)
	for rows.Next() {
		var item LaporanResponse
		var namaPelapor sql.NullString
		err := rows.Scan(
			&item.ID, &item.WargaID, &namaPelapor, &item.Judul, &item.Deskripsi, &item.RT,
			&item.AlamatLokasi, &item.Latitude, &item.Longitude, &item.FotoURL,
			&item.Status, &item.CatatanAdmin, &item.DitanganiOleh, &item.SelesaiAt,
			&item.CreatedAt, &item.UpdatedAt,
		)
		if err == nil {
			if namaPelapor.Valid {
				item.NamaPelapor = namaPelapor.String
			} else {
				item.NamaPelapor = "Warga Sakalputung"
			}
			results = append(results, item)
		}
	}

	c.JSON(http.StatusOK, gin.H{"total": len(results), "data": results})
}

// UpdateStatusLaporan admin mengelola status laporan (belum_dikerjakan, menunggu_info_lanjut, sudah_dikerjakan)
func (h *LaporanHandler) UpdateStatusLaporan(c *gin.Context) {
	adminID, _ := middleware.GetCurrentUserID(c)
	idParam := c.Param("id")
	laporanID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID laporan tidak valid"})
		return
	}

	var req UpdateStatusLaporanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pilihan status tidak valid", "details": err.Error()})
		return
	}

	// Validasi status yang diizinkan sesuai ROAD.md
	validStatuses := map[models.StatusLaporan]bool{
		models.StatusBelumDikerjakan:    true,
		models.StatusMenungguInfoLanjut: true,
		models.StatusSudahDikerjakan:    true,
	}

	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Status harus salah satu dari: 'belum_dikerjakan', 'menunggu_info_lanjut', 'sudah_dikerjakan'",
		})
		return
	}

	var selesaiAt *time.Time
	if req.Status == models.StatusSudahDikerjakan {
		now := time.Now()
		selesaiAt = &now
	}

	query := `
		UPDATE public.laporan_kendala
		SET status = $1,
		    catatan_admin = $2,
		    ditangani_oleh = $3,
		    selesai_at = $4,
		    updated_at = NOW()
		WHERE id = $5;
	`
	res, err := config.DB.Exec(query, req.Status, req.CatatanAdmin, adminID, selesaiAt, laporanID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate status laporan", "details": err.Error()})
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Laporan tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Status laporan berhasil diperbarui",
		"status":  req.Status,
	})
}
