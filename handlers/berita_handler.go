package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"sakalputung/config"
	"sakalputung/middleware"
	"sakalputung/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BeritaHandler struct{}

func NewBeritaHandler() *BeritaHandler {
	return &BeritaHandler{}
}

// CreateBeritaRequest data input berita baru oleh admin
type CreateBeritaRequest struct {
	Judul          string  `json:"judul" binding:"required"`
	Ringkasan      *string `json:"ringkasan"`
	Isi            string  `json:"isi" binding:"required"`
	GambarCoverURL *string `json:"gambar_cover_url"`
	Kategori       string  `json:"kategori"`
	IsPublished    *bool   `json:"is_published"`
}

// generateSlug membuat slug URL friendly dari judul berita
func generateSlug(title string) string {
	re := regexp.MustCompile("[^a-z0-9]+")
	slug := strings.ToLower(title)
	slug = re.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = "berita"
	}
	return fmt.Sprintf("%s-%d", slug, time.Now().Unix())
}

// GetAllBerita mengambil daftar berita desa untuk warga dan umum
func (h *BeritaHandler) GetAllBerita(c *gin.Context) {
	if config.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database tidak terhubung"})
		return
	}

	search := c.Query("q")
	kategori := c.Query("kategori")

	query := `
		SELECT b.id, b.penulis_id, p.nama_lengkap, b.judul, b.slug, b.ringkasan,
		       b.gambar_cover_url, b.kategori, b.dilihat_count, b.is_published, b.created_at
		FROM public.berita_desa b
		LEFT JOIN public.profiles p ON b.penulis_id = p.id
		WHERE b.is_published = true
	`
	var args []interface{}
	idx := 1

	if search != "" {
		query += fmt.Sprintf(" AND (b.judul ILIKE $%d OR b.ringkasan ILIKE $%d)", idx, idx)
		args = append(args, "%"+search+"%")
		idx++
	}
	if kategori != "" {
		query += fmt.Sprintf(" AND b.kategori = $%d", idx)
		args = append(args, kategori)
		idx++
	}

	query += " ORDER BY b.created_at DESC LIMIT 50"

	rows, err := config.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data berita", "details": err.Error()})
		return
	}
	defer rows.Close()

	type BeritaItem struct {
		ID             uuid.UUID `json:"id"`
		PenulisID      uuid.UUID `json:"penulis_id"`
		NamaPenulis    string    `json:"nama_penulis"`
		Judul          string    `json:"judul"`
		Slug           string    `json:"slug"`
		Ringkasan      *string   `json:"ringkasan"`
		GambarCoverURL *string   `json:"gambar_cover_url"`
		Kategori       string    `json:"kategori"`
		DilihatCount   int       `json:"dilihat_count"`
		IsPublished    bool      `json:"is_published"`
		CreatedAt      time.Time `json:"created_at"`
	}

	list := make([]BeritaItem, 0)
	for rows.Next() {
		var item BeritaItem
		var namaPenulis sql.NullString
		err := rows.Scan(
			&item.ID, &item.PenulisID, &namaPenulis, &item.Judul, &item.Slug,
			&item.Ringkasan, &item.GambarCoverURL, &item.Kategori,
			&item.DilihatCount, &item.IsPublished, &item.CreatedAt,
		)
		if err == nil {
			if namaPenulis.Valid {
				item.NamaPenulis = namaPenulis.String
			} else {
				item.NamaPenulis = "Admin Desa Sakalputung"
			}
			list = append(list, item)
		}
	}

	c.JSON(http.StatusOK, gin.H{"total": len(list), "data": list})
}

// GetBeritaBySlug mengambil detail berita desa dan menambah jumlah pembaca
func (h *BeritaHandler) GetBeritaBySlug(c *gin.Context) {
	if config.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database tidak terhubung"})
		return
	}

	slug := c.Param("slug")

	// Update counter dilihat_count
	_, _ = config.DB.Exec("UPDATE public.berita_desa SET dilihat_count = dilihat_count + 1 WHERE slug = $1", slug)

	query := `
		SELECT b.id, b.penulis_id, p.nama_lengkap, b.judul, b.slug, b.ringkasan, b.isi,
		       b.gambar_cover_url, b.kategori, b.dilihat_count, b.is_published, b.created_at, b.updated_at
		FROM public.berita_desa b
		LEFT JOIN public.profiles p ON b.penulis_id = p.id
		WHERE b.slug = $1;
	`
	var b models.BeritaDesa
	var namaPenulis sql.NullString
	err := config.DB.QueryRow(query, slug).Scan(
		&b.ID, &b.PenulisID, &namaPenulis, &b.Judul, &b.Slug, &b.Ringkasan, &b.Isi,
		&b.GambarCoverURL, &b.Kategori, &b.DilihatCount, &b.IsPublished, &b.CreatedAt, &b.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Berita tidak ditemukan"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil detail berita", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"berita":       b,
		"nama_penulis": namaPenulis.String,
	})
}

// CreateBerita admin menambahkan berita baru
func (h *BeritaHandler) CreateBerita(c *gin.Context) {
	adminID, _ := middleware.GetCurrentUserID(c)

	var req CreateBeritaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Form berita tidak lengkap", "details": err.Error()})
		return
	}

	slug := generateSlug(req.Judul)
	kategori := req.Kategori
	if kategori == "" {
		kategori = "Pengumuman"
	}
	isPublished := true
	if req.IsPublished != nil {
		isPublished = *req.IsPublished
	}

	query := `
		INSERT INTO public.berita_desa (penulis_id, judul, slug, ringkasan, isi, gambar_cover_url, kategori, is_published)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at;
	`
	var newID uuid.UUID
	var createdAt time.Time
	err := config.DB.QueryRow(query, adminID, req.Judul, slug, req.Ringkasan, req.Isi, req.GambarCoverURL, kategori, isPublished).Scan(&newID, &createdAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan berita", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Berita berhasil dipublikasikan",
		"id":      newID,
		"slug":    slug,
	})
}

// DeleteBerita admin menghapus berita
func (h *BeritaHandler) DeleteBerita(c *gin.Context) {
	idParam := c.Param("id")
	beritaID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID berita tidak valid"})
		return
	}

	res, err := config.DB.Exec("DELETE FROM public.berita_desa WHERE id = $1", beritaID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus berita", "details": err.Error()})
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Berita tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Berita berhasil dihapus"})
}
