package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	"sakalputung/config"
	"sakalputung/middleware"
	"sakalputung/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	cfg *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{cfg: cfg}
}

// AdminLoginRequest payload login admin RT
type AdminLoginRequest struct {
	Username string `json:"username" binding:"required"` // e.g., "rt1", "rt2", "rt3", "rt4", "rt5" atau "admin_rt_1"
	Password string `json:"password" binding:"required"`
}

// WargaLoginRequest payload login warga menggunakan nomor HP atau email
type WargaLoginRequest struct {
	NomorTelepon string `json:"nomor_telepon"` // e.g. "08123456789"
	Email        string `json:"email"`         // e.g. "warga@gmail.com"
}

// OnboardingWargaRequest payload pengisian data profil warga pertama kali
type OnboardingWargaRequest struct {
	NamaLengkap   string   `json:"nama_lengkap" binding:"required"`
	Umur          int      `json:"umur" binding:"required,min=0"`
	RT            int      `json:"rt" binding:"required,min=1,max=5"` // RT 1 sampai RT 5
	NomorTelepon  string   `json:"nomor_telepon"`
	AlamatLengkap string   `json:"alamat_lengkap" binding:"required"`
	Latitude      *float64 `json:"latitude"`  // Koordinat peta rumah
	Longitude     *float64 `json:"longitude"` // Koordinat peta rumah
}

// WargaLogin menangani login/masuk warga menggunakan nomor telepon atau email
func (h *AuthHandler) WargaLogin(c *gin.Context) {
	var req WargaLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data login tidak valid", "details": err.Error()})
		return
	}

	identifier := strings.TrimSpace(req.NomorTelepon)
	if identifier == "" {
		identifier = strings.TrimSpace(req.Email)
	}

	if identifier == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Harap masukkan nomor telepon atau email"})
		return
	}

	// Buat ID unik konsisten berdasarkan identifier (telepon/email)
	wargaID := uuid.NewMD5(uuid.NameSpaceDNS, []byte("warga:"+identifier))
	email := req.Email
	if email == "" {
		email = identifier + "@warga.sakalputung.desa.id"
	}

	isCompleted := false
	var namaLengkap string = "Warga Sakalputung"
	var currentRT *int

	// Periksa apakah user sudah terdaftar di database
	if config.DB != nil {
		var rtVal sql.NullInt32
		err := config.DB.QueryRow(`
			SELECT nama_lengkap, rt, is_profile_completed 
			FROM public.profiles 
			WHERE id = $1 OR nomor_telepon = $2 OR email = $3;
		`, wargaID, identifier, email).Scan(&namaLengkap, &rtVal, &isCompleted)

		if err == sql.ErrNoRows {
			// Buat profil warga baru (belum onboarding)
			_, _ = config.DB.Exec(`
				INSERT INTO public.profiles (id, email, nomor_telepon, nama_lengkap, role, is_profile_completed)
				VALUES ($1, $2, $3, $4, 'warga', false)
				ON CONFLICT (id) DO NOTHING;
			`, wargaID, email, identifier, namaLengkap)
		} else if err == nil && rtVal.Valid {
			rtInt := int(rtVal.Int32)
			currentRT = &rtInt
		}
	}

	token, err := middleware.GenerateToken(wargaID, models.RoleWarga, currentRT, email, h.cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate token login warga"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":              "Login berhasil",
		"token":                token,
		"is_profile_completed": isCompleted,
		"user": gin.H{
			"id":                   wargaID,
			"nama_lengkap":         namaLengkap,
			"nomor_telepon":        req.NomorTelepon,
			"email":                email,
			"role":                 models.RoleWarga,
			"is_profile_completed": isCompleted,
		},
	})
}

// AdminLogin menangani login khusus admin menggunakan nama RT (rt1 - rt5)
func (h *AuthHandler) AdminLogin(c *gin.Context) {
	var req AdminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username dan password wajib diisi", "details": err.Error()})
		return
	}

	cleanUsername := strings.ToLower(strings.TrimSpace(req.Username))
	cleanUsername = strings.ReplaceAll(cleanUsername, " ", "")
	cleanUsername = strings.ReplaceAll(cleanUsername, "_", "")

	// Validasi identitas RT 1 sampai RT 5
	rtMap := map[string]int{
		"rt1":  1,
		"rt01": 1,
		"rt2":  2,
		"rt02": 2,
		"rt3":  3,
		"rt03": 3,
		"rt4":  4,
		"rt04": 4,
		"rt5":  5,
		"rt05": 5,
	}

	targetRT, isRT := rtMap[cleanUsername]
	if !isRT {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username admin tidak dikenal. Gunakan format rt1 - rt5"})
		return
	}

	// Validasi password sesuai RT masing-masing (default: adminrt1pass, adminrt2pass, dst.)
	expectedPassword := h.cfg.AdminRTPasswords[targetRT]
	if expectedPassword == "" {
		expectedPassword = fmt.Sprintf("adminrt%dpass", targetRT)
	}

	if req.Password != expectedPassword {
		c.JSON(http.StatusUnauthorized, gin.H{"error": fmt.Sprintf("Password Admin RT %02d salah", targetRT)})
		return
	}

	// Cari profil admin RT di database atau buat deterministic dummy jika belum ada
	adminID := uuid.NewMD5(uuid.NameSpaceDNS, []byte(fmt.Sprintf("admin.rt%d@sakalputung.desa.id", targetRT)))
	adminEmail := fmt.Sprintf("admin.rt%d@sakalputung.desa.id", targetRT)
	adminName := fmt.Sprintf("Admin RT %02d", targetRT)

	// Simpan atau update profile admin di database jika koneksi tersedia
	if config.DB != nil {
		query := `
			INSERT INTO public.profiles (id, email, nama_lengkap, rt, rw, role, is_profile_completed)
			VALUES ($1, $2, $3, $4, '01', 'admin_rt', true)
			ON CONFLICT (id) DO UPDATE SET 
				nama_lengkap = EXCLUDED.nama_lengkap,
				rt = EXCLUDED.rt,
				role = 'admin_rt';
		`
		_, _ = config.DB.Exec(query, adminID, adminEmail, adminName, targetRT)
	}

	// Generate JWT
	token, err := middleware.GenerateToken(adminID, models.RoleAdminRT, &targetRT, adminEmail, h.cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate token login"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Login berhasil sebagai Admin RT %02d", targetRT),
		"token":   token,
		"user": gin.H{
			"id":           adminID,
			"nama_lengkap": adminName,
			"role":         models.RoleAdminRT,
			"rt":           targetRT,
			"email":        adminEmail,
		},
	})
}

// CompleteProfile menangani pengisian data warga saat pertama kali login (onboarding)
func (h *AuthHandler) CompleteProfile(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak terotentikasi"})
		return
	}

	var req OnboardingWargaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data input profil tidak valid", "details": err.Error()})
		return
	}

	if config.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Koneksi database tidak tersedia"})
		return
	}

	query := `
		UPDATE public.profiles
		SET nama_lengkap = $1,
			umur = $2,
			rt = $3,
			nomor_telepon = $4,
			alamat_lengkap = $5,
			latitude = $6,
			longitude = $7,
			is_profile_completed = true,
			updated_at = NOW()
		WHERE id = $8;
	`
	res, err := config.DB.Exec(query, req.NamaLengkap, req.Umur, req.RT, req.NomorTelepon, req.AlamatLengkap, req.Latitude, req.Longitude, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui profil warga", "details": err.Error()})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		// Jika baris belum ada di profiles, insert baru
		insertQuery := `
			INSERT INTO public.profiles (id, nama_lengkap, umur, rt, nomor_telepon, alamat_lengkap, latitude, longitude, role, is_profile_completed)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'warga', true);
		`
		if _, err := config.DB.Exec(insertQuery, userID, req.NamaLengkap, req.Umur, req.RT, req.NomorTelepon, req.AlamatLengkap, req.Latitude, req.Longitude); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat profil warga", "details": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profil berhasil dilengkapi. Selamat datang di web Sakalputung!",
		"profile": gin.H{
			"id":                   userID,
			"nama_lengkap":         req.NamaLengkap,
			"umur":                 req.Umur,
			"rt":                   req.RT,
			"alamat_lengkap":       req.AlamatLengkap,
			"latitude":             req.Latitude,
			"longitude":            req.Longitude,
			"is_profile_completed": true,
		},
	})
}

// GetMe mengambil informasi profil user yang sedang login
func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak terotentikasi"})
		return
	}

	if config.DB == nil {
		c.JSON(http.StatusOK, gin.H{"id": userID, "role": c.GetString("role")})
		return
	}

	var p models.Profile
	query := `
		SELECT id, email, nama_lengkap, nomor_telepon, umur, rt, rw, alamat_lengkap, latitude, longitude, foto_profil, role, is_profile_completed, created_at, updated_at
		FROM public.profiles
		WHERE id = $1;
	`
	err := config.DB.QueryRow(query, userID).Scan(
		&p.ID, &p.Email, &p.NamaLengkap, &p.NomorTelepon, &p.Umur, &p.RT, &p.RW,
		&p.AlamatLengkap, &p.Latitude, &p.Longitude, &p.FotoProfil, &p.Role,
		&p.IsProfileCompleted, &p.CreatedAt, &p.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data profil belum ditemukan"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data profil", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"profile": p})
}

// GetAdminDashboardStats mengambil statistik ringkasan untuk dashboard admin
func (h *AuthHandler) GetAdminDashboardStats(c *gin.Context) {
	if config.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database tidak terhubung"})
		return
	}

	adminRT := middleware.GetCurrentUserRT(c)

	stats := gin.H{}

	// 1. Total Penduduk
	var totalPenduduk int
	var err error
	if adminRT != nil {
		err = config.DB.QueryRow("SELECT COUNT(*) FROM public.data_penduduk WHERE rt = $1", *adminRT).Scan(&totalPenduduk)
	} else {
		err = config.DB.QueryRow("SELECT COUNT(*) FROM public.data_penduduk").Scan(&totalPenduduk)
	}
	if err == nil {
		stats["total_penduduk"] = totalPenduduk
	}

	// 2. Statistik Penduduk per RT (RT 1 - RT 5)
	pendudukPerRT := make(map[string]int)
	rows, err := config.DB.Query("SELECT rt, COUNT(*) FROM public.data_penduduk GROUP BY rt ORDER BY rt ASC")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var rt, count int
			if err := rows.Scan(&rt, &count); err == nil {
				pendudukPerRT[fmt.Sprintf("RT %02d", rt)] = count
			}
		}
	}
	stats["penduduk_per_rt"] = pendudukPerRT

	// 3. Statistik Laporan Berdasarkan Status
	laporanStats := gin.H{
		"belum_dikerjakan":      0,
		"menunggu_info_lanjut": 0,
		"sudah_dikerjakan":     0,
		"total":                0,
	}
	var laporanQuery string
	var args []interface{}
	if adminRT != nil {
		laporanQuery = "SELECT status, COUNT(*) FROM public.laporan_kendala WHERE rt = $1 GROUP BY status"
		args = append(args, *adminRT)
	} else {
		laporanQuery = "SELECT status, COUNT(*) FROM public.laporan_kendala GROUP BY status"
	}
	lRows, err := config.DB.Query(laporanQuery, args...)
	if err == nil {
		defer lRows.Close()
		totalLaporan := 0
		for lRows.Next() {
			var st string
			var count int
			if err := lRows.Scan(&st, &count); err == nil {
				laporanStats[st] = count
				totalLaporan += count
			}
		}
		laporanStats["total"] = totalLaporan
	}
	stats["laporan"] = laporanStats

	// 4. Donasi Terkumpul
	var totalDonasi float64
	_ = config.DB.QueryRow("SELECT COALESCE(SUM(nominal_terkumpul), 0) FROM public.kegiatan_donasi").Scan(&totalDonasi)
	stats["total_donasi_terkumpul"] = totalDonasi

	// 5. Total Surat Masuk
	var totalSurat int
	_ = config.DB.QueryRow("SELECT COUNT(*) FROM public.surat_pusat").Scan(&totalSurat)
	stats["total_surat_pusat"] = totalSurat

	c.JSON(http.StatusOK, gin.H{"dashboard_stats": stats})
}
