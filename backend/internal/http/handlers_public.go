package httpx

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"where-is-maurus/backend/internal/auth"
	"where-is-maurus/backend/internal/keys"
	"where-is-maurus/backend/internal/state"
	"where-is-maurus/backend/internal/stream"
)

type PublicHandlers struct {
	Keys         *keys.Manager
	Store        *state.Store
	Hub          *stream.Hub
	CookieDomain string
	Heartbeat    time.Duration
}

func (h *PublicHandlers) Routes(r chi.Router) {
	r.Post("/api/v1/session", h.handleSession)
	r.Get("/api/v1/stream", h.handleStream)
	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) })
}

type sessionReq struct {
	Token string `json:"token"`
}
type sessionResp struct {
	Ok bool `json:"ok"`
}

func (h *PublicHandlers) handleSession(w http.ResponseWriter, r *http.Request) {
	var req sessionReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Token == "" {
		writeError(w, http.StatusBadRequest, "bad_request", "invalid json")
		return
	}
	tok, err := auth.VerifyShareToken(req.Token, h.Keys.VerifyJWT)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "unauthorized", "invalid token")
		return
	}
	exp, _ := tok.Expiration()
	auth.SetSessionCookie(w, h.CookieDomain, req.Token, exp)
	writeJSON(w, http.StatusOK, sessionResp{Ok: true})
}

func (h *PublicHandlers) handleStream(w http.ResponseWriter, r *http.Request) {
	raw, err := auth.ReadSessionCookie(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "unauthorized", "missing session")
		return
	}
	tok, err := auth.VerifyShareToken(raw, h.Keys.VerifyJWT)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "unauthorized", "invalid session")
		return
	}
	var carIDV any
	_ = tok.Get("car_id", &carIDV)
	var carID int64
	switch v := carIDV.(type) {
	case int64:
		carID = v
	case float64:
		carID = int64(v)
	case json.Number:
		if f, err := v.Float64(); err == nil {
			carID = int64(f)
		}
	}
	flusher, ok := setSSEHeaders(w)
	if !ok {
		writeError(w, http.StatusInternalServerError, "internal_error", "no flusher")
		return
	}

	if ok := sendInitialSnapshot(w, flusher, h.Store, carID); !ok {
		return
	}

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	sseLoop(ctx, w, flusher, h.Hub, carID, h.Heartbeat, nil)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, code, msg string) {
	writeJSON(w, status, map[string]any{"error": msg, "code": code})
}
