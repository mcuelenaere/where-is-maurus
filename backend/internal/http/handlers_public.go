package httpx

import (
	"context"
	"encoding/json"
	"math"
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
	var dest *auth.Dest
	var rawDest any
	if err := tok.Get("dest", &rawDest); err == nil && rawDest != nil {
		b, _ := json.Marshal(rawDest)
		var d auth.Dest
		if json.Unmarshal(b, &d) == nil {
			dest = &d
		}
	}
	// SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, http.StatusInternalServerError, "internal_error", "no flusher")
		return
	}

	// initial snapshot
	stateSnap, hist := h.Store.GetSnapshot(carID)
	historyOnly := map[string]any{
		"speed_kph":   hist.SpeedKPH,
		"heading":     hist.Heading,
		"elevation_m": hist.ElevationM,
		"soc_pct":     hist.SOCPct,
		"power_w":     hist.PowerW,
		"inside_c":    hist.InsideC,
		"outside_c":   hist.OutsideC,
		"tpms_fl":     hist.TPMSFL,
		"tpms_fr":     hist.TPMSFR,
		"tpms_rl":     hist.TPMSRL,
		"tpms_rr":     hist.TPMSRR,
	}
	snapshotData := map[string]any{
		"ts_ms":       stateSnap.TSMS,
		"location":    stateSnap.Location,
		"battery":     stateSnap.Battery,
		"climate":     stateSnap.Climate,
		"tpms_bar":    stateSnap.TPMS,
		"route":       stateSnap.Route,
		"history_30s": historyOnly,
		"path_30s":    hist.Path,
	}
	b, _ := json.Marshal(snapshotData)
	if _, err := w.Write([]byte("event: snapshot\n" + "data: " + string(b) + "\n\n")); err != nil {
		return
	}
	flusher.Flush()

	sub := h.Hub.Subscribe(carID)
	defer h.Hub.Unsubscribe(carID, sub)

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	// heartbeat ticker
	hb := time.NewTicker(h.Heartbeat)
	defer hb.Stop()

	// arrival expiry if configured
	hasArrive := false
	if dest != nil && dest.ArriveRadiusM > 0 {
		hasArrive = true
	}

	for {
		select {
		case <-ctx.Done():
			return
		case b := <-sub.Ch:
			if len(b) == 0 {
				continue
			}
			if _, err := w.Write(b); err != nil {
				return
			}
			flusher.Flush()
			if hasArrive && arrived(h.Store, carID, dest) {
				return
			}
		case t := <-hb.C:
			serverTime := map[string]any{"server_time": t.UTC().Format(time.RFC3339Nano)}
			hbPayload, _ := json.Marshal(serverTime)
			if _, err := w.Write([]byte("event: heartbeat\n" + "data: " + string(hbPayload) + "\n\n")); err != nil {
				return
			}
			flusher.Flush()
			if hasArrive && arrived(h.Store, carID, dest) {
				return
			}
		}
	}
}

func arrived(store *state.Store, carID int64, dest *auth.Dest) bool {
	st, _ := store.GetSnapshot(carID)
	if st.Location == nil || dest == nil {
		return false
	}
	return haversineMeters(st.Location.Lat, st.Location.Lon, dest.Lat, dest.Lon) <= dest.ArriveRadiusM
}

func haversineMeters(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371000.0
	toRad := func(d float64) float64 { return d * math.Pi / 180.0 }
	dLat := toRad(lat2 - lat1)
	dLon := toRad(lon2 - lon1)
	a := math.Pow(math.Sin(dLat/2), 2) + math.Cos(toRad(lat1))*math.Cos(toRad(lat2))*math.Pow(math.Sin(dLon/2), 2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, code, msg string) {
	writeJSON(w, status, map[string]any{"error": msg, "code": code})
}
