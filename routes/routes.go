package routes

import (
	"time"

	"sakalputung/config"
	"sakalputung/handlers"
	"sakalputung/middleware"
	"sakalputung/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SetupRouter mengonfigurasi rute API, middleware, dan CORS
func SetupRouter(cfg *config.Config) *gin.Engine {
	r := gin.Default()
	_ = r.SetTrustedProxies(nil)

	// Setup CORS untuk frontend React & Tailwind
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173", "*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Inisialisasi Handlers
	authHandler := handlers.NewAuthHandler(cfg)
	pendudukHandler := handlers.NewPendudukHandler()
	laporanHandler := handlers.NewLaporanHandler()
	beritaHandler := handlers.NewBeritaHandler()
	suratHandler := handlers.NewSuratHandler()
	donasiHandler := handlers.NewDonasiHandler(cfg)

	// Health Check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"app":     "Sistem Informasi Layanan Publik Desa Sakalputung",
			"version": "1.0.0",
			"time":    time.Now(),
		})
	})

	api := r.Group("/api")
	{
		// -------------------------------------------------------------
		// 1. AUTENTIKASI & PROFIL
		// -------------------------------------------------------------
		authGroup := api.Group("/auth")
		{
			// Login Admin RT 1-5 menggunakan nama RT
			authGroup.POST("/admin/login", authHandler.AdminLogin)

			// Login Warga menggunakan Nomor HP / Email (sesuai ROAD.md)
			authGroup.POST("/warga/login", authHandler.WargaLogin)

			// Route terautentikasi (Warga & Admin)
			authGroup.Use(middleware.AuthMiddleware(cfg.JWTSecret))
			{
				authGroup.GET("/me", authHandler.GetMe)
				// Warga mengisi data nama, umur, rt, alamat setelah login pertama kali
				authGroup.POST("/onboarding", authHandler.CompleteProfile)
				authGroup.PUT("/onboarding", authHandler.CompleteProfile)
			}
		}

		// -------------------------------------------------------------
		// 2. DASHBOARD ADMIN
		// -------------------------------------------------------------
		adminGroup := api.Group("/admin")
		adminGroup.Use(middleware.AuthMiddleware(cfg.JWTSecret), middleware.RequireRole(models.RoleAdminRT, models.RoleAdminDesa))
		{
			adminGroup.GET("/dashboard/stats", authHandler.GetAdminDashboardStats)
		}

		// -------------------------------------------------------------
		// 3. DATA PENDUDUK & MAPS ALAMAT RUMAH (RT 1 - RT 5)
		// -------------------------------------------------------------
		pendudukGroup := api.Group("/penduduk")
		{
			// Data kependudukan & pemetaan maps dapat dilihat oleh pengguna terautentikasi
			pendudukGroup.Use(middleware.AuthMiddleware(cfg.JWTSecret))
			pendudukGroup.GET("", pendudukHandler.GetAllPenduduk)
			pendudukGroup.GET("/maps", pendudukHandler.GetMapsPenduduk)

			// Kelola data penduduk (Hanya Admin RT / Desa)
			adminPenduduk := pendudukGroup.Group("")
			adminPenduduk.Use(middleware.RequireRole(models.RoleAdminRT, models.RoleAdminDesa))
			{
				adminPenduduk.POST("", pendudukHandler.CreatePenduduk)
				adminPenduduk.PUT("/:id", pendudukHandler.UpdatePenduduk)
				adminPenduduk.DELETE("/:id", pendudukHandler.DeletePenduduk)
			}
		}

		// -------------------------------------------------------------
		// 4. PENGADUAN & KENDALA WARGA
		// -------------------------------------------------------------
		laporanGroup := api.Group("/laporan")
		laporanGroup.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			// Warga mengirim kendala disertai foto & keluhan
			laporanGroup.POST("", laporanHandler.CreateLaporan)
			laporanGroup.GET("", laporanHandler.GetLaporan)

			// Admin mengelola status laporan (belum_dikerjakan, menunggu_info_lanjut, sudah_dikerjakan)
			laporanGroup.PATCH("/:id/status", middleware.RequireRole(models.RoleAdminRT, models.RoleAdminDesa), laporanHandler.UpdateStatusLaporan)
		}

		// -------------------------------------------------------------
		// 5. BERITA DESA
		// -------------------------------------------------------------
		beritaGroup := api.Group("/berita")
		{
			// Publik & warga dapat membaca berita desa
			beritaGroup.GET("", beritaHandler.GetAllBerita)
			beritaGroup.GET("/:slug", beritaHandler.GetBeritaBySlug)

			// Admin mengelola berita
			adminBerita := beritaGroup.Group("")
			adminBerita.Use(middleware.AuthMiddleware(cfg.JWTSecret), middleware.RequireRole(models.RoleAdminRT, models.RoleAdminDesa))
			{
				adminBerita.POST("", beritaHandler.CreateBerita)
				adminBerita.DELETE("/:id", beritaHandler.DeleteBerita)
			}
		}

		// -------------------------------------------------------------
		// 6. SURAT DARI PUSAT & NOTIFIKASI WARGA
		// -------------------------------------------------------------
		suratGroup := api.Group("/surat")
		suratGroup.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			// Warga menerima pesan kabar surat dari pusat
			suratGroup.GET("/warga", suratHandler.GetNotifikasiWarga)
			suratGroup.PATCH("/notifikasi/:id/read", suratHandler.MarkAsRead)

			// Seluruh arsip surat masuk
			suratGroup.GET("", suratHandler.GetAllSurat)

			// Admin menginput surat pusat & dibagikan otomatis
			suratGroup.POST("", middleware.RequireRole(models.RoleAdminRT, models.RoleAdminDesa), suratHandler.CreateSurat)
		}

		// -------------------------------------------------------------
		// 7. FORUM DONASI KEGIATAN DESA & PAYMENT GATEWAY
		// -------------------------------------------------------------
		donasiGroup := api.Group("/donasi")
		{
			// Publik/warga melihat forum kegiatan donasi
			donasiGroup.GET("/kegiatan", donasiHandler.GetAllKegiatan)
			donasiGroup.GET("/kegiatan/:slug", donasiHandler.GetKegiatanBySlug)

			// Warga mendonasikan dana (bisa guest atau terdaftar)
			donasiGroup.POST("/bayar", donasiHandler.BayarDonasi)

			// Webhook payment gateway (Midtrans / Xendit dll.)
			donasiGroup.POST("/webhook", donasiHandler.PaymentWebhook)

			// Verifikasi otomatis apakah dana donasi sudah masuk (QRIS / Virtual Account)
			donasiGroup.GET("/transaksi/:order_id", donasiHandler.GetStatusTransaksi)

			// Simulasi pembayaran sukses untuk kemudahan testing
			donasiGroup.POST("/simulasi-sukses/:order_id", donasiHandler.SimulasiPembayaranSukses)

			// Admin membuat forum kegiatan donasi baru
			adminDonasi := donasiGroup.Group("/kegiatan")
			adminDonasi.Use(middleware.AuthMiddleware(cfg.JWTSecret), middleware.RequireRole(models.RoleAdminRT, models.RoleAdminDesa))
			{
				adminDonasi.POST("", donasiHandler.CreateKegiatan)
			}
		}
	}

	return r
}
