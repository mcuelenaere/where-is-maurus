package httpx

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"

	"where-is-maurus/backend/internal/auth"
	"where-is-maurus/backend/internal/keys"
	"where-is-maurus/backend/internal/state"
	"where-is-maurus/backend/internal/stream"
)

// fake key manager for tests: generate once, no rotation
func newTestKeys(t *testing.T) *keys.Manager {
	t.Helper()
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	km, err := keys.NewManager(ctx, 0)
	if err != nil {
		t.Fatalf("keys: %v", err)
	}
	return km
}

func TestHealthz(t *testing.T) {
	r := NewRouter(nil)
	pub := &PublicHandlers{Keys: nil, Store: state.NewStore(), Hub: stream.NewHub(), CookieDomain: "localhost", Heartbeat: time.Millisecond * 50}
	r.Group(func(r chi.Router) { pub.Routes(r) })
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestSessionSetsCookie(t *testing.T) {
	km := newTestKeys(t)
	pub := &PublicHandlers{Keys: km, Store: state.NewStore(), Hub: stream.NewHub(), CookieDomain: "localhost", Heartbeat: time.Millisecond * 50}
	r := NewRouter(nil)
	r.Group(func(r chi.Router) { pub.Routes(r) })

	// issue a share token
	tokStr, exp, err := auth.CreateShareToken(time.Now(), time.Hour, 1, nil, km.SignJWT)
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	if exp.IsZero() {
		t.Fatalf("exp zero")
	}

	body, _ := json.Marshal(map[string]string{"token": tokStr})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/session", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	if c := w.Header().Get("Set-Cookie"); c == "" {
		t.Fatalf("missing Set-Cookie")
	}
}

func TestSSEHeartbeatWithoutMQTT(t *testing.T) {
	km := newTestKeys(t)
	st := state.NewStore()
	hub := stream.NewHub()
	pub := &PublicHandlers{Keys: km, Store: st, Hub: hub, CookieDomain: "localhost", Heartbeat: time.Millisecond * 50}
	r := NewRouter(nil)
	r.Group(func(r chi.Router) { pub.Routes(r) })

	// token for car 1
	tokStr, _, err := auth.CreateShareToken(time.Now(), time.Minute, 1, nil, km.SignJWT)
	if err != nil {
		t.Fatalf("sign: %v", err)
	}

	// set cookie via session
	body, _ := json.Marshal(map[string]string{"token": tokStr})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/session", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("session expected 200, got %d", w.Code)
	}
	cookie := w.Header().Get("Set-Cookie")
	if cookie == "" {
		t.Fatalf("missing cookie")
	}

	// connect SSE
	sseReq := httptest.NewRequest(http.MethodGet, "/api/v1/stream", nil)
	sseReq.Header.Set("Cookie", cookie)
	sseW := httptest.NewRecorder()

	go r.ServeHTTP(sseW, sseReq)
	time.Sleep(120 * time.Millisecond)

	// read buffered response
	scanner := bufio.NewScanner(bytes.NewReader(sseW.Body.Bytes()))
	var gotHeartbeat bool
	for scanner.Scan() {
		line := scanner.Text()
		if line == "event: heartbeat" {
			gotHeartbeat = true
			break
		}
	}
	if !gotHeartbeat {
		t.Fatalf("expected heartbeat in SSE stream; got: %s", sseW.Body.String())
	}
}
