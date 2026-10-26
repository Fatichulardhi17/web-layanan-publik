package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"sakalputung/config"
	"sakalputung/middleware"
	"sakalputung/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PendudukHandler struct{}

func NewPendudukHandler() *PendudukHandler {
	return &PendudukHandler{}
}

// CreatePendudukRequest data input untuk tambah penduduk
type CreatePendudukRequest struct {
	NIK            *string  `json:"nik"`
	Nama           string   `json:"nama" binding:"required"`
	Umur           int      `json:"umur" binding:"required,min=0"`
	JenisKelamin   *string  `json:"jenis_kelamin"`
	RT             int      `json:"rt" binding:"required,min=1,max=5"` // Wajib RT 1 - RT 5
	RW             string   `json:"rw"`
	AlamatRumah    string   `json:"alamat_rumah" binding:"required"` // Wajib ada alamat rumah
	Latitude       float64  `json:"latitude" binding:"required"`     // Wajib untuk koordinat maps
	Longitude      float64  `json:"longitude" binding:"required"`    // Wajib untuk koordinat maps
	StatusKeluarga *string  `json:"status_keluarga"`
	Pekerjaan      *string  `json:"pekerjaan"`
}

// GetAllPenduduk mengambil data penduduk desa Sakalputung dari RT 1-5 (bisa difilter per RT)
func (h *PendudukHandler) GetAllPenduduk(c *gin.Context) {
	if config.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database tidak terhubung"})
		return
	}

	rtParam := c.Query("rt")
	search := c.Query("q")

	baseQuery := `
		SELECT id, user_id, nik, nama, umur, jenis_kelamin, rt, rw, alamat_rumah, latitude, longitude, status_keluarga, pekerjaan, created_at, updated_at
		FROM public.data_penduduk
		WHERE 1=1
	`
	var args []interface{}
	argIdx := 1

	if rtParam != "" {
		if rtVal, err := strconv.Atoi(rtParam); err == nil && rtVal >= 1 && rtVal <= 5 {
			baseQuery += " AND rt = $" + strconv.Itoa(argIdx)
			args = append(args, rtVal)
			argIdx++
		}
	}

	if search != "" {
		baseQuery += " AND (nama ILIKE $" + strconv.Itoa(argIdx) + " OR alamat_rumah ILIKE $" + strconv.Itoa(argIdx) + ")"
		args = append(args, "%"+search+"%")
		argIdx++
	}

	baseQuery += " ORDER BY rt ASC, nama ASC"

	rows, err := config.DB.Query(baseQuery, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data penduduk", "details": err.Error()})
		return
	}
	defer rows.Close()

	list := make([]models.DataPenduduk, 0)
	for rows.Next() {
		var p models.DataPenduduk
		err := rows.Scan(
			&p.ID, &p.UserID, &p.NIK, &p.Nama, &p.Umur, &p.JenisKelamin,
			&p.RT, &p.RW, &p.AlamatRumah, &p.Latitude, &p.Longitude,
			&p.StatusKeluarga, &p.Pekerjaan, &p.CreatedAt, &p.UpdatedAt,
		)
		if err == nil {
			list = append(list, p)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total": len(list),
		"data":  list,
	})
}

// GetMapsPenduduk titik koordinat maps seluruh penduduk (nama, umur, RT, alamat rumah, lat, lng)
func (h *PendudukHandler) GetMapsPenduduk(c *gin.Context) {
	if config.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database tidak terhubung"})
		return
	}

	rtParam := c.Query("rt")

	query := `
		SELECT id, nama, umur, rt, alamat_rumah, latitude, longitude
		FROM public.data_penduduk
		WHERE latitude IS NOT NULL AND longitude IS NOT NULL
	`
	var args []interface{}
	if rtParam != "" {
		if rtVal, err := strconv.Atoi(rtParam); err == nil && rtVal >= 1 && rtVal <= 5 {
			query += " AND rt = $1"
			args = append(args, rtVal)
		}
	}

	rows, err := config.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil titik maps penduduk", "details": err.Error()})
		return
	}
	defer rows.Close()

	type MapPoint struct {
		ID          uuid.UUID `json:"id"`
		Nama        string    `json:"nama"`
		Umur        int       `json:"umur"`
		RT          int       `json:"rt"`
		AlamatRumah string    `json:"alamat_rumah"`
		Latitude    float64   `json:"latitude"`
		Longitude   float64   `json:"longitude"`
	}

	points := make([]MapPoint, 0)
	for rows.Next() {
		var pt MapPoint
		if err := rows.Scan(&pt.ID, &pt.Nama, &pt.Umur, &pt.RT, &pt.AlamatRumah, &pt.Latitude, &pt.Longitude); err == nil {
			points = append(points, pt)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total_points": len(points),
		"points":       points,
	})
}

// CreatePenduduk menambahkan data penduduk baru (admin)
func (h *PendudukHandler) CreatePenduduk(c *gin.Context) {
	adminID, _ := middleware.GetCurrentUserID(c)

	var req CreatePendudukRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data penduduk tidak lengkap", "details": err.Error()})
		return
	}

	rw := req.RW
	if rw == "" {
		rw = "01"
	}
	statusKeluarga := "Kepala Keluarga"
	if req.StatusKeluarga != nil && *req.StatusKeluarga != "" {
		statusKeluarga = *req.StatusKeluarga
	}

	query := `
		INSERT INTO public.data_penduduk 
		(nik, nama, umur, jenis_kelamin, rt, rw, alamat_rumah, latitude, longitude, status_keluarga, pekerjaan, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, created_at, updated_at;
	`

	var newID uuid.UUID
	var createdAt, updatedAt sql.NullTime

	err := config.DB.QueryRow(
		query,
		req.NIK, req.Nama, req.Umur, req.JenisKelamin, req.RT, rw,
		req.AlamatRumah, req.Latitude, req.Longitude, statusKeluarga, req.Pekerjaan, adminID,
	).Scan(&newID, &createdAt, &updatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan data penduduk", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Data penduduk berhasil ditambahkan beserta titik maps alamat",
		"id":      newID,
	})
}

// UpdatePenduduk mengubah data penduduk
func (h *PendudukHandler) UpdatePenduduk(c *gin.Context) {
	idParam := c.Param("id")
	pendudukID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID penduduk tidak valid"})
		return
	}

	var req CreatePendudukRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data input tidak valid", "details": err.Error()})
		return
	}

	query := `
		UPDATE public.data_penduduk
		SET nik = $1, nama = $2, umur = $3, jenis_kelamin = $4, rt = $5,
		    alamat_rumah = $6, latitude = $7, longitude = $8, status_keluarga = $9,
		    pekerjaan = $10, updated_at = NOW()
		WHERE id = $11;
	`
	statusKeluarga := "Kepala Keluarga"
	if req.StatusKeluarga != nil {
		statusKeluarga = *req.StatusKeluarga
	}

	res, err := config.DB.Exec(query, req.NIK, req.Nama, req.Umur, req.JenisKelamin, req.RT, req.AlamatRumah, req.Latitude, req.Longitude, statusKeluarga, req.Pekerjaan, pendudukID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update data penduduk", "details": err.Error()})
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data penduduk tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data penduduk berhasil diperbarui"})
}

// DeletePenduduk menghapus data penduduk
func (h *PendudukHandler) DeletePenduduk(c *gin.Context) {
	idParam := c.Param("id")
	pendudukID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}

	res, err := config.DB.Exec("DELETE FROM public.data_penduduk WHERE id = $1", pendudukID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data penduduk", "details": err.Error()})
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data penduduk tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data penduduk berhasil dihapus"})
}
