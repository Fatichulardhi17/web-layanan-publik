package main

import (
	"log"

	"sakalputung/config"
	"sakalputung/routes"
)

func main() {
	log.Println("Memulai Server Backend Web Layanan Publik Sakalputung...")

	// 1. Muat konfigurasi environment
	cfg := config.LoadConfig()

	// 2. Inisialisasi koneksi database PostgreSQL / Supabase
	if _, err := config.InitDatabase(cfg.DatabaseURL); err != nil {
		log.Printf("Catatan Database: %v\n", err)
	}

	// 3. Konfigurasi router API Gin
	r := routes.SetupRouter(cfg)

	// 4. Jalankan server pada port yang dikonfigurasi
	addr := ":" + cfg.Port
	log.Printf("Server berjalan di http://localhost%s\n", addr)
	log.Printf("Dokumentasi endpoint health check: http://localhost%s/api/health\n", addr)

	if err := r.Run(addr); err != nil {
		log.Fatalf("Gagal menjalankan server: %v", err)
	}
}
