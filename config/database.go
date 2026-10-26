package config

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

// DB variabel global instance database
var DB *sql.DB

// InitDatabase menginisialisasi koneksi pool ke database PostgreSQL/Supabase
func InitDatabase(databaseURL string) (*sql.DB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("gagal membuka koneksi database: %w", err)
	}

	// Konfigurasi connection pooling
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(15 * time.Minute)

	// Lakukan ping untuk menguji konektivitas
	if err := db.Ping(); err != nil {
		log.Printf("Peringatan: Gagal melakukan ping ke database (%v). Server tetap berjalan, pastikan DATABASE_URL valid pada .env saat produksi.", err)
	} else {
		log.Println("Berhasil terhubung ke database PostgreSQL/Supabase!")
	}

	DB = db
	return db, nil
}
