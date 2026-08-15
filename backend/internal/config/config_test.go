package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadDefaults(t *testing.T) {
	t.Setenv("ENV_FILE", filepath.Join(t.TempDir(), "missing.env"))
	t.Setenv("HTTP_ADDR", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.HTTPAddr != defaultHTTPAddr {
		t.Errorf("HTTPAddr = %q, want %q", cfg.HTTPAddr, defaultHTTPAddr)
	}
}

func TestLoadReadsEnvVars(t *testing.T) {
	t.Setenv("ENV_FILE", filepath.Join(t.TempDir(), "missing.env"))
	t.Setenv("HTTP_ADDR", ":9999")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.HTTPAddr != ":9999" {
		t.Errorf("HTTPAddr = %q, want %q", cfg.HTTPAddr, ":9999")
	}
}

func TestLoadReadsDotEnv(t *testing.T) {
	dir := t.TempDir()
	envFile := filepath.Join(dir, ".env")
	if err := os.WriteFile(envFile, []byte("HTTP_ADDR=:7000\n"), 0o644); err != nil {
		t.Fatalf("writing .env: %v", err)
	}
	t.Setenv("ENV_FILE", envFile)
	t.Setenv("HTTP_ADDR", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.HTTPAddr != ":7000" {
		t.Errorf("HTTPAddr = %q, want %q", cfg.HTTPAddr, ":7000")
	}
}

func TestLoadEnvOverridesDotEnv(t *testing.T) {
	dir := t.TempDir()
	envFile := filepath.Join(dir, ".env")
	if err := os.WriteFile(envFile, []byte("HTTP_ADDR=:7000\n"), 0o644); err != nil {
		t.Fatalf("writing .env: %v", err)
	}
	t.Setenv("ENV_FILE", envFile)
	t.Setenv("HTTP_ADDR", ":8081")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.HTTPAddr != ":8081" {
		t.Errorf("HTTPAddr = %q, want %q", cfg.HTTPAddr, ":8081")
	}
}
