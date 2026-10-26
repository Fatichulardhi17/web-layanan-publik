package main

import (
	"net/http"
	"sync"

	"sakalputung/config"
	"sakalputung/routes"
)

var (
	engineOnce sync.Once
	engine     http.Handler
)

// getEngine menyiapkan Gin engine sekali saja (reuse instance warm antar invokasi)
func getEngine() http.Handler {
	engineOnce.Do(func() {
		cfg := config.LoadConfig()
		engine = routes.SetupRouter(cfg)
	})
	return engine
}

// Handler merupakan entrypoint Vercel Go Runtime
func Handler(w http.ResponseWriter, r *http.Request) {
	if config.DB == nil {
		cfg := config.LoadConfig()
		if _, err := config.InitDatabase(cfg.DatabaseURL); err != nil {
			config.DB = nil
		}
	}
	getEngine().ServeHTTP(w, r)
}

// main tidak dieksekusi pada serverless; hadir agar go build ./... lolos
func main() {}
