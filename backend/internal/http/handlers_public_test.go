package httpx

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
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
	tokStr, exp, err := auth.CreateShareToken(time.Now(), time.Hour, 1, km.SignJWT)
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
	tokStr, _, err := auth.CreateShareToken(time.Now(), time.Minute, 1, km.SignJWT)
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
	// Use a thread-safe recorder to avoid data races when reading while the handler writes
	sseW := newSyncRecorder()

	go r.ServeHTTP(sseW, sseReq)
	time.Sleep(120 * time.Millisecond)

	// read a snapshot of the buffered response
	scanner := bufio.NewScanner(bytes.NewReader(sseW.Snapshot()))
	var gotHeartbeat bool
	for scanner.Scan() {
		line := scanner.Text()
		if line == "event: heartbeat" {
			gotHeartbeat = true
			break
		}
	}
	if !gotHeartbeat {
		t.Fatalf("expected heartbeat in SSE stream; got: %s", sseW.Snapshot())
	}
}

// syncRecorder is a minimal thread-safe http.ResponseWriter that implements http.Flusher.
type syncRecorder struct {
	mu     sync.Mutex
	buf    bytes.Buffer
	header http.Header
	code   int
}

func newSyncRecorder() *syncRecorder { return &syncRecorder{header: make(http.Header)} }

func (w *syncRecorder) Header() http.Header        { return w.header }
func (w *syncRecorder) WriteHeader(statusCode int) { w.code = statusCode }
func (w *syncRecorder) Write(b []byte) (int, error) {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.buf.Write(b)
}
func (w *syncRecorder) Flush() {}
func (w *syncRecorder) Snapshot() []byte {
	w.mu.Lock()
	defer w.mu.Unlock()
	return append([]byte(nil), w.buf.Bytes()...)
}
