package config

import (
	"errors"
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

const (
	defaultHTTPAddr = ":8080"
	envFileVar      = "ENV_FILE"
)

// Config holds runtime configuration for the server, loaded from environment
// variables (optionally seeded from a .env file for local development).
type Config struct {
	// HTTPAddr is the address the HTTP server listens on (e.g. ":8080").
	HTTPAddr string
}

// Load builds a Config. Precedence (highest first): already-set env vars, then
// the .env file (path from ENV_FILE, default ".env"), then built-in defaults.
// A missing .env file is not an error; any other failure is.
func Load() (*Config, error) {
	fileEnv, err := readDotEnv(dotEnvPath())
	if err != nil {
		return nil, err
	}

	httpAddr := os.Getenv("HTTP_ADDR")
	if httpAddr == "" {
		httpAddr = fileEnv["HTTP_ADDR"]
	}
	if httpAddr == "" {
		httpAddr = defaultHTTPAddr
	}

	return &Config{
		HTTPAddr: httpAddr,
	}, nil
}

func dotEnvPath() string {
	if p, ok := os.LookupEnv(envFileVar); ok {
		return p
	}
	return ".env"
}

// readDotEnv returns the key/value pairs in the .env file. A missing file
// yields an empty map (not an error).
func readDotEnv(path string) (map[string]string, error) {
	if _, err := os.Stat(path); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return map[string]string{}, nil
		}
		return nil, fmt.Errorf("config: stat env file %q: %w", path, err)
	}
	env, err := godotenv.Read(path)
	if err != nil {
		return nil, fmt.Errorf("config: reading env file %q: %w", path, err)
	}
	return env, nil
}
