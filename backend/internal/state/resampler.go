package state

import (
	"encoding/json"
	"maps"
	"time"

	"github.com/mcuelenaere/where-is-maurus/backend/internal/stream"
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

				// Collect all deltas and combine them into one
				var allDeltas []map[string]any

				// Helper function to add delta if it has content
				addDelta := func(delta []byte) {
					if len(delta) > 0 {
						var deltaMap map[string]any
						if json.Unmarshal(delta, &deltaMap) == nil {
							allDeltas = append(allDeltas, deltaMap)
						}
					}
				}

				// location path breadcrumb only (no speed/heading/elev unless independently resampled below)
				if st.Location != nil {
					addDelta(store.UpdateLocation(id, nowMs, st.Location.Lat, st.Location.Lon, -1, -1, -1))
				}

				// speed/heading/elevation
				if len(hist.SpeedKPH) > 0 && st.Location != nil {
					addDelta(store.UpdateSpeed(id, nowMs, st.Location.SpeedKPH))
				}
				if len(hist.Heading) > 0 && st.Location != nil {
					addDelta(store.UpdateHeading(id, nowMs, st.Location.Heading))
				}
				if len(hist.ElevationM) > 0 && st.Location != nil {
					addDelta(store.UpdateElevation(id, nowMs, st.Location.ElevationM))
				}

				// battery
				if st.Battery != nil {
					if len(hist.SOCPct) > 0 {
						addDelta(store.UpdateBatteryLevel(id, nowMs, st.Battery.SOCPct))
					}
					if len(hist.PowerW) > 0 {
						addDelta(store.UpdatePower(id, nowMs, st.Battery.PowerW))
					}
				}

				// climate
				if st.Climate != nil {
					if len(hist.InsideC) > 0 {
						addDelta(store.UpdateInsideTemp(id, nowMs, st.Climate.InsideC))
					}
					if len(hist.OutsideC) > 0 {
						addDelta(store.UpdateOutsideTemp(id, nowMs, st.Climate.OutsideC))
					}
				}

				// tpms
				if st.TPMS != nil {
					if len(hist.TPMSFL) > 0 {
						addDelta(store.UpdateTPMS(id, nowMs, "fl", st.TPMS.FL))
					}
					if len(hist.TPMSFR) > 0 {
						addDelta(store.UpdateTPMS(id, nowMs, "fr", st.TPMS.FR))
					}
					if len(hist.TPMSRL) > 0 {
						addDelta(store.UpdateTPMS(id, nowMs, "rl", st.TPMS.RL))
					}
					if len(hist.TPMSRR) > 0 {
						addDelta(store.UpdateTPMS(id, nowMs, "rr", st.TPMS.RR))
					}
				}

				// Combine all deltas into one big delta
				if len(allDeltas) > 0 {
					combinedDelta := mergeDeltas(allDeltas)
					deltaBytes, _ := json.Marshal(combinedDelta)
					hub.Broadcast(id, "delta", deltaBytes)
				}

				// route: we do not resample route; it changes infrequently and not graphed
			}
		}
	}()
}

// mergeDeltas combines multiple delta maps into one, merging nested structures
func mergeDeltas(deltas []map[string]any) map[string]any {
	if len(deltas) == 0 {
		return nil
	}
	if len(deltas) == 1 {
		return deltas[0]
	}

	// Start with the first delta
	result := deltas[0]

	// Merge subsequent deltas
	for i := 1; i < len(deltas); i++ {
		for key, value := range deltas[i] {
			switch key {
			case "ts_ms":
				// Keep the latest timestamp
				if ts, ok := value.(float64); ok {
					if resultTs, ok := result[key].(float64); !ok || ts > resultTs {
						result[key] = value
					}
				}
			case "history_30s":
				// Merge history objects
				if resultHistory, ok := result[key].(map[string]any); ok {
					if newHistory, ok := value.(map[string]any); ok {
						maps.Copy(resultHistory, newHistory)
					}
				} else {
					result[key] = value
				}
			default:
				// For other keys, just overwrite (latest wins)
				result[key] = value
			}
		}
	}

	return result
}
