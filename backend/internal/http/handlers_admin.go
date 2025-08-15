package httpx

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog/log"

	"where-is-maurus/backend/internal/auth"
	"where-is-maurus/backend/internal/keys"
	"where-is-maurus/backend/internal/state"
	"where-is-maurus/backend/internal/stream"
)

type AdminHandlers struct {
	CF                   *auth.CFValidator
	Keys                 *keys.Manager
	Store                *state.Store
	Hub                  *stream.Hub
	TokenTTL             time.Duration
	DefaultArriveRadiusM float64
	Heartbeat            time.Duration
}

func (h *AdminHandlers) middlewareCF(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if h.CF != nil {
			if err := h.CF.ValidateRequest(r); err != nil {
				writeError(w, http.StatusUnauthorized, "unauthorized", err.Error())
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

type createShareReq struct {
	CarID         int64      `json:"car_id"`
	ExpiresAt     *time.Time `json:"expires_at,omitempty"`
	ArriveRadiusM *float64   `json:"arrive_radius_m,omitempty"`
	Dest          *auth.Dest `json:"dest,omitempty"`
}

type createShareResp struct {
	Token string `json:"token"`
}

func (h *AdminHandlers) Routes(r chi.Router) {
	r.With(h.middlewareCF).Post("/api/v1/shares", h.handleCreateShare)
	// SSE stream for admin to observe live updates for a car
	r.With(h.middlewareCF).Get("/api/v1/admin/cars/{id}/stream", h.handleStream)
	r.With(h.middlewareCF).Get("/api/v1/admin/cars", h.handleListCars)
}

func (h *AdminHandlers) handleCreateShare(w http.ResponseWriter, r *http.Request) {
	var req createShareReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "bad_request", "invalid json")
		return
	}
	var ttl time.Duration
	var expAt time.Time
	if req.ExpiresAt != nil {
		if req.ExpiresAt.Before(time.Now()) {
			writeError(w, http.StatusBadRequest, "bad_request", "expires_at in past")
			return
		}
		expAt = *req.ExpiresAt
		ttl = time.Until(expAt)
	} else {
		ttl = h.TokenTTL
		expAt = time.Now().Add(ttl)
	}
	// If dest not provided, try from store route
	var dest *auth.Dest
	if req.Dest != nil {
		dest = req.Dest
	} else {
		st, _ := h.Store.GetSnapshot(req.CarID)
		if st.Route != nil && st.Route.Dest != nil {
			dest = &auth.Dest{Lat: st.Route.Dest.Lat, Lon: st.Route.Dest.Lon}
		}
	}
	if dest != nil && req.ArriveRadiusM != nil {
		dest.ArriveRadiusM = *req.ArriveRadiusM
	} else if dest != nil {
		dest.ArriveRadiusM = h.DefaultArriveRadiusM
	}
	tok, _, err := auth.CreateShareToken(time.Now(), ttl, req.CarID, dest, h.Keys.SignJWT)
	if err != nil {
		log.Error().Err(err).Msg("sign share token")
		writeError(w, http.StatusInternalServerError, "internal_error", "failed to sign token")
		return
	}
	writeJSON(w, http.StatusOK, createShareResp{Token: tok})
}

func (h *AdminHandlers) handleListCars(w http.ResponseWriter, r *http.Request) {
	ids := h.Store.ListCarIDs()
	writeJSON(w, http.StatusOK, map[string]any{"cars": ids})
}

// handleStream provides Server-Sent Events for the selected car ID for admin users.
func (h *AdminHandlers) handleStream(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "bad_request", "invalid id")
		return
	}

	flusher, ok := setSSEHeaders(w)
	if !ok {
		writeError(w, http.StatusInternalServerError, "internal_error", "no flusher")
		return
	}

	if ok := sendInitialSnapshot(w, flusher, h.Store, id); !ok {
		return
	}

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	sseLoop(ctx, w, flusher, h.Hub, id, h.Heartbeat, nil)
}
