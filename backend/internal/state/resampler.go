package state

import (
	"encoding/json"
	"time"

	"where-is-maurus/backend/internal/stream"
)

// Resampling interval knob (code-configurable only)
const resampleInterval = 5 * time.Second

// StartResampler periodically appends the latest known values so clients can render flatlines
// even when the upstream does not emit repeated values.
func StartResampler(store *Store, hub *stream.Hub) {
	if resampleInterval <= 0 {
		return
	}
	ticker := time.NewTicker(resampleInterval)
	go func() {
		defer ticker.Stop()
		for now := range ticker.C {
			ids := store.ListCarIDs()
			nowMs := now.UnixMilli()
			for _, id := range ids {
				st, hist := store.GetSnapshot(id)
				// location path breadcrumb only (no speed/heading/elev unless independently resampled below)
				if st.Location != nil {
					delta := store.UpdateLocation(id, nowMs, st.Location.Lat, st.Location.Lon, -1, -1, -1)
					hub.Broadcast(id, sseWrap("delta", delta))
				}
				// speed/heading/elevation
				if len(hist.SpeedKPH) > 0 && st.Location != nil {
					delta := store.UpdateSpeed(id, nowMs, st.Location.SpeedKPH)
					hub.Broadcast(id, sseWrap("delta", delta))
				}
				if len(hist.Heading) > 0 && st.Location != nil {
					delta := store.UpdateHeading(id, nowMs, st.Location.Heading)
					hub.Broadcast(id, sseWrap("delta", delta))
				}
				if len(hist.ElevationM) > 0 && st.Location != nil {
					delta := store.UpdateElevation(id, nowMs, st.Location.ElevationM)
					hub.Broadcast(id, sseWrap("delta", delta))
				}
				// battery
				if st.Battery != nil {
					if len(hist.SOCPct) > 0 {
						delta := store.UpdateBatteryLevel(id, nowMs, st.Battery.SOCPct)
						hub.Broadcast(id, sseWrap("delta", delta))
					}
					if len(hist.PowerW) > 0 {
						delta := store.UpdatePower(id, nowMs, st.Battery.PowerW)
						hub.Broadcast(id, sseWrap("delta", delta))
					}
				}
				// climate
				if st.Climate != nil {
					if len(hist.InsideC) > 0 {
						delta := store.UpdateInsideTemp(id, nowMs, st.Climate.InsideC)
						hub.Broadcast(id, sseWrap("delta", delta))
					}
					if len(hist.OutsideC) > 0 {
						delta := store.UpdateOutsideTemp(id, nowMs, st.Climate.OutsideC)
						hub.Broadcast(id, sseWrap("delta", delta))
					}
				}
				// tpms
				if st.TPMS != nil {
					if len(hist.TPMSFL) > 0 {
						delta := store.UpdateTPMS(id, nowMs, "fl", st.TPMS.FL)
						hub.Broadcast(id, sseWrap("delta", delta))
					}
					if len(hist.TPMSFR) > 0 {
						delta := store.UpdateTPMS(id, nowMs, "fr", st.TPMS.FR)
						hub.Broadcast(id, sseWrap("delta", delta))
					}
					if len(hist.TPMSRL) > 0 {
						delta := store.UpdateTPMS(id, nowMs, "rl", st.TPMS.RL)
						hub.Broadcast(id, sseWrap("delta", delta))
					}
					if len(hist.TPMSRR) > 0 {
						delta := store.UpdateTPMS(id, nowMs, "rr", st.TPMS.RR)
						hub.Broadcast(id, sseWrap("delta", delta))
					}
				}
				// route: we do not resample route; it changes infrequently and not graphed
			}
		}
	}()
}

func sseWrap(event string, data []byte) []byte {
	if len(data) == 0 {
		return nil
	}
	// ensure data is valid JSON; if not, pass as-is
	var js any
	if json.Unmarshal(data, &js) != nil {
		return []byte("event: " + event + "\n" + "data: " + string(data) + "\n\n")
	}
	return []byte("event: " + event + "\n" + "data: " + string(data) + "\n\n")
}
