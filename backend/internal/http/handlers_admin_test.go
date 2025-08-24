package httpx

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"where-is-maurus/backend/internal/keys"
	"where-is-maurus/backend/internal/state"
)

func TestAdminCreateShare_NoCFMiddleware(t *testing.T) {
	// CF disabled by passing nil validator
	km, err := keys.NewManager(context.Background(), 0)
	if err != nil {
		t.Fatalf("keys: %v", err)
	}
	adm := &AdminHandlers{CF: nil, Keys: km, Store: state.NewStore(), TokenTTL: time.Minute}

	r := NewRouter(nil)
	r.Group(func(r chi.Router) { adm.Routes(r) })

	body, _ := json.Marshal(map[string]any{"car_id": 1})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/shares", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var resp map[string]string
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["token"] == "" {
		t.Fatalf("missing token")
	}
}
