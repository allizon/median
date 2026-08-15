package main

import (
	"log"
	"net/http"

	"github.com/allizon/median/go-angular/backend/internal/api"
	"github.com/allizon/median/go-angular/backend/internal/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	server := &http.Server{
		Addr:    cfg.HTTPAddr,
		Handler: api.NewRouter(),
	}

	log.Printf("listening on %s", cfg.HTTPAddr)
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("server: %v", err)
	}
}
