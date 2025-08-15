package httpx

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"where-is-maurus/backend/internal/state"
	"where-is-maurus/backend/internal/stream"
)

// setSSEHeaders sets required headers and returns a flusher or error.
func setSSEHeaders(w http.ResponseWriter) (http.Flusher, bool) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Accel-Buffering", "no")
	flusher, ok := w.(http.Flusher)
	return flusher, ok
}

// sendInitialSnapshot marshals and writes the initial snapshot for the given car.
func sendInitialSnapshot(w http.ResponseWriter, flusher http.Flusher, st *state.Store, carID int64) bool {
	stateSnap, hist := st.GetSnapshot(carID)
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
		return false
	}
	flusher.Flush()
	return true
}

// sseLoop forwards hub messages and emits heartbeats until context cancellation or stopWhen() true.
func sseLoop(ctx context.Context, w http.ResponseWriter, flusher http.Flusher, hub *stream.Hub, carID int64, heartbeat time.Duration, stopWhen func() bool) {
	sub := hub.Subscribe(carID)
	defer hub.Unsubscribe(carID, sub)

	hb := time.NewTicker(heartbeat)
	defer hb.Stop()

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
			if stopWhen != nil && stopWhen() {
				return
			}
		case t := <-hb.C:
			serverTime := map[string]any{"server_time": t.UTC().Format(time.RFC3339Nano)}
			hbPayload, _ := json.Marshal(serverTime)
			if _, err := w.Write([]byte("event: heartbeat\n" + "data: " + string(hbPayload) + "\n\n")); err != nil {
				return
			}
			flusher.Flush()
			if stopWhen != nil && stopWhen() {
				return
			}
		}
	}
}
