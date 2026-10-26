package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config menampung semua konfigurasi aplikasi dari environment
type Config struct {
	Port              string
	DatabaseURL       string
	JWTSecret         string
	SupabaseURL       string
	SupabaseKey       string
	MidtransServerKey string
	MidtransClientKey string
	MidtransIsProd    bool
	// MidtransNotificationURL override URL webhook per transaksi (mis. tunnel ngrok/cloudflared saat dev)
	MidtransNotificationURL string
	// AdminRTPasswords merekam password khusus untuk login tiap RT (indeks 1-5)
	AdminRTPasswords [6]string
}

// LoadConfig memuat variabel lingkungan dari file .env atau sistem operasi
func LoadConfig() *Config {
	// Memuat .env jika tersedia
	if err := godotenv.Load(); err != nil {
		log.Println("Info: File .env tidak ditemukan, menggunakan environment variables sistem.")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "sakalputung-secret-key-development-2026"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Default placeholder connection string untuk Supabase PostgreSQL
		dbURL = "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable"
	}

	// Muat password login khusus tiap RT (ADMIN_RT1_PASSWORD s/d ADMIN_RT5_PASSWORD)
	adminPasswords := [6]string{}
	for rt := 1; rt <= 5; rt++ {
		pw := os.Getenv(fmt.Sprintf("ADMIN_RT%d_PASSWORD", rt))
		if pw == "" {
			pw = fmt.Sprintf("adminrt%dpass", rt) // Default development password: adminrt1pass, dll.
		}
		adminPasswords[rt] = pw
	}

	return &Config{
		Port:                    port,
		DatabaseURL:             dbURL,
		JWTSecret:               jwtSecret,
		SupabaseURL:             os.Getenv("SUPABASE_URL"),
		SupabaseKey:             os.Getenv("SUPABASE_KEY"),
		MidtransServerKey:       os.Getenv("MIDTRANS_SERVER_KEY"),
		MidtransClientKey:       os.Getenv("MIDTRANS_CLIENT_KEY"),
		MidtransIsProd:          os.Getenv("MIDTRANS_IS_PROD") == "true",
		MidtransNotificationURL: os.Getenv("MIDTRANS_NOTIFICATION_URL"),
		AdminRTPasswords:        adminPasswords,
	}
}
