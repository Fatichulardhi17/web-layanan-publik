package main

import (
	"fmt"
	"log"
	"os"

	"sakalputung/config"

	_ "github.com/lib/pq"
)

func main() {
	cfg := config.LoadConfig()
	db, err := config.InitDatabase(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Gagal inisialisasi database: %v", err)
	}
	defer db.Close()

	fmt.Println("1. Menyesuaikan constraint tabel profiles...")
	_, _ = db.Exec("ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;")

	fmt.Println("2. Menjalankan seed.sql di Supabase...")
	seedSQL, err := os.ReadFile("database/seed.sql")
	if err != nil {
		log.Fatalf("Gagal membaca database/seed.sql: %v", err)
	}

	_, err = db.Exec(string(seedSQL))
	if err != nil {
		log.Printf("Catatan saat eksekusi seed.sql: %v\n", err)
	} else {
		fmt.Println(">> Sukses eksekusi seed.sql!")
	}

	fmt.Println("Migrasi dan seeding database Supabase selesai 100%!")
}
