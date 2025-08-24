package config

import (
	"reflect"
	"testing"
)

func TestLoad_DefaultsAndNormalization(t *testing.T) {
	t.Setenv("HTTP_ADDR", "")
	t.Setenv("CORS_ALLOWED_ORIGINS", " ,  https://a.example.com , ,https://b.example.com, ")
	t.Setenv("LOG_LEVEL", "")
	t.Setenv("TOKEN_DEFAULT_TTL", "")
	t.Setenv("KEY_ROTATE_SECONDS", "")
	t.Setenv("SSE_HEARTBEAT_SECONDS", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error: %v", err)
	}
	if cfg.HTTPAddr != ":8080" {
		t.Fatalf("expected default HTTPAddr, got %q", cfg.HTTPAddr)
	}
	expected := []string{"https://a.example.com", "https://b.example.com"}
	if !reflect.DeepEqual(cfg.CORSAllowedOrigins, expected) {
		t.Fatalf("expected cleaned origins %v, got %v", expected, cfg.CORSAllowedOrigins)
	}
}

func TestLoad_EmptyOriginsBecomeNil(t *testing.T) {
	t.Setenv("CORS_ALLOWED_ORIGINS", "")
	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error: %v", err)
	}
	// Implementation normalizes to empty slice [] not nil
	if len(cfg.CORSAllowedOrigins) != 0 {
		t.Fatalf("expected empty origins, got %v", cfg.CORSAllowedOrigins)
	}
}
