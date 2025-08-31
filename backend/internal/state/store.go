package state

import (
	"encoding/json"
	"sync"
	"time"
)

// Store keeps per-car state and 30s history.
type Store struct {
	mu     sync.RWMutex
	cars   map[int64]*carEntry
	window time.Duration
}

type carEntry struct {
	state   CarState
	history HistoryWindow
}

func NewStore() *Store {
	return &Store{cars: make(map[int64]*carEntry), window: 15 * time.Minute}
}

func (s *Store) GetSnapshot(carID int64) (CarState, HistoryWindow) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	ce := s.ensure(carID)
	return ce.state, ce.history
}

// ListCarIDs returns the IDs of cars seen in the store.
func (s *Store) ListCarIDs() []int64 {
	s.mu.RLock()
	defer s.mu.RUnlock()
	ids := make([]int64, 0, len(s.cars))
	for id := range s.cars {
		ids = append(ids, id)
	}
	return ids
}

// ListCars returns car information including IDs and display names.
func (s *Store) ListCars() []CarInfo {
	s.mu.RLock()
	defer s.mu.RUnlock()
	cars := make([]CarInfo, 0, len(s.cars))
	for id, ce := range s.cars {
		displayName := generateDisplayName(id, ce.state)
		carInfo := CarInfo{
			ID:          id,
			DisplayName: displayName,
		}
		cars = append(cars, carInfo)
	}
	return cars
}

func (s *Store) ensure(carID int64) *carEntry {
	if ce, ok := s.cars[carID]; ok {
		return ce
	}
	ce := &carEntry{}
	s.cars[carID] = ce
	return ce
}

func prune(history *HistoryWindow, cutoff int64) {
	pruneTF := func(a []TimestampedFloat) []TimestampedFloat {
		i := 0
		for i < len(a) && a[i].TS < cutoff {
			i++
		}
		if i > 0 {
			a = a[i:]
		}
		return a
	}
	history.SpeedKPH = pruneTF(history.SpeedKPH)
	history.Heading = pruneTF(history.Heading)
	history.ElevationM = pruneTF(history.ElevationM)
	history.SOCPct = pruneTF(history.SOCPct)
	history.PowerW = pruneTF(history.PowerW)
	history.InsideC = pruneTF(history.InsideC)
	history.OutsideC = pruneTF(history.OutsideC)
	history.TPMSFL = pruneTF(history.TPMSFL)
	history.TPMSFR = pruneTF(history.TPMSFR)
	history.TPMSRL = pruneTF(history.TPMSRL)
	history.TPMSRR = pruneTF(history.TPMSRR)
	// Path
	i := 0
	for i < len(history.Path) && history.Path[i].TS < cutoff {
		i++
	}
	if i > 0 {
		history.Path = history.Path[i:]
	}
}

// Delta is a partial JSON object bytes representing changes.
func marshalDelta(delta map[string]any) []byte {
	if delta == nil {
		return nil
	}
	b, _ := json.Marshal(delta)
	return b
}

// updateHelper handles the common update pattern
func (s *Store) updateHelper(carID, ts int64, updateFn func(*carEntry, map[string]any)) []byte {
	s.mu.Lock()
	defer s.mu.Unlock()

	ce := s.ensure(carID)
	ce.state.TSMS = ts

	delta := map[string]any{"ts_ms": ts}
	updateFn(ce, delta)

	cutoff := ts - ceWindowMs(s.window)
	prune(&ce.history, cutoff)

	return marshalDelta(delta)
}

// Update helpers. Each returns minimal delta map.

func (s *Store) UpdateLocation(carID int64, ts int64, lat, lon, speedKPH, heading, elevM float64) []byte {
	return s.updateHelper(carID, ts, func(ce *carEntry, delta map[string]any) {
		if ce.state.Location == nil {
			ce.state.Location = &Location{}
		}
		ce.state.Location.Lat = lat
		ce.state.Location.Lon = lon
		if speedKPH >= 0 {
			ce.state.Location.SpeedKPH = speedKPH
			ce.history.SpeedKPH = append(ce.history.SpeedKPH, TimestampedFloat{TS: ts, V: speedKPH})
		}
		if heading >= 0 {
			ce.state.Location.Heading = heading
			ce.history.Heading = append(ce.history.Heading, TimestampedFloat{TS: ts, V: heading})
		}
		if elevM >= 0 {
			ce.state.Location.ElevationM = elevM
			ce.history.ElevationM = append(ce.history.ElevationM, TimestampedFloat{TS: ts, V: elevM})
		}
		ce.history.Path = append(ce.history.Path, Breadcrumb{TS: ts, Lat: lat, Lon: lon})

		delta["location"] = ce.state.Location
		delta["history_30s"] = map[string]any{
			"speed_kph":   ce.history.SpeedKPH,
			"heading":     ce.history.Heading,
			"elevation_m": ce.history.ElevationM,
		}
		delta["path_30s"] = ce.history.Path
	})
}

func (s *Store) UpdateSpeed(carID int64, ts int64, speedKPH float64) []byte {
	return s.updateHelper(carID, ts, func(ce *carEntry, delta map[string]any) {
		if ce.state.Location == nil {
			ce.state.Location = &Location{}
		}
		ce.state.Location.SpeedKPH = speedKPH
		ce.history.SpeedKPH = append(ce.history.SpeedKPH, TimestampedFloat{TS: ts, V: speedKPH})

		delta["location"] = ce.state.Location
		delta["history_30s"] = map[string]any{"speed_kph": ce.history.SpeedKPH}
	})
}

func (s *Store) UpdateHeading(carID int64, ts int64, heading float64) []byte {
	return s.updateHelper(carID, ts, func(ce *carEntry, delta map[string]any) {
		if ce.state.Location == nil {
			ce.state.Location = &Location{}
		}
		ce.state.Location.Heading = heading
		ce.history.Heading = append(ce.history.Heading, TimestampedFloat{TS: ts, V: heading})

		delta["location"] = ce.state.Location
		delta["history_30s"] = map[string]any{"heading": ce.history.Heading}
	})
}

func (s *Store) UpdateElevation(carID int64, ts int64, elevM float64) []byte {
	return s.updateHelper(carID, ts, func(ce *carEntry, delta map[string]any) {
		if ce.state.Location == nil {
			ce.state.Location = &Location{}
		}
		ce.state.Location.ElevationM = elevM
		ce.history.ElevationM = append(ce.history.ElevationM, TimestampedFloat{TS: ts, V: elevM})

		delta["location"] = ce.state.Location
		delta["history_30s"] = map[string]any{"elevation_m": ce.history.ElevationM}
	})
}

func (s *Store) UpdateBatteryLevel(carID int64, ts int64, soc float64) []byte {
	return s.updateHelper(carID, ts, func(ce *carEntry, delta map[string]any) {
		if ce.state.Battery == nil {
			ce.state.Battery = &Battery{}
		}
		ce.state.Battery.SOCPct = soc
		ce.history.SOCPct = append(ce.history.SOCPct, TimestampedFloat{TS: ts, V: soc})

		delta["battery"] = ce.state.Battery
		delta["history_30s"] = map[string]any{"soc_pct": ce.history.SOCPct}
	})
}

func (s *Store) UpdatePower(carID int64, ts int64, powerW float64) []byte {
	return s.updateHelper(carID, ts, func(ce *carEntry, delta map[string]any) {
		if ce.state.Battery == nil {
			ce.state.Battery = &Battery{}
		}
		ce.state.Battery.PowerW = powerW
		ce.history.PowerW = append(ce.history.PowerW, TimestampedFloat{TS: ts, V: powerW})

		delta["battery"] = ce.state.Battery
		delta["history_30s"] = map[string]any{"power_w": ce.history.PowerW}
	})
}

func (s *Store) UpdateInsideTemp(carID int64, ts int64, c float64) []byte {
	return s.updateHelper(carID, ts, func(ce *carEntry, delta map[string]any) {
		if ce.state.Climate == nil {
			ce.state.Climate = &Climate{}
		}
		ce.state.Climate.InsideC = c
		ce.history.InsideC = append(ce.history.InsideC, TimestampedFloat{TS: ts, V: c})

		delta["climate"] = ce.state.Climate
		delta["history_30s"] = map[string]any{"inside_c": ce.history.InsideC}
	})
}

func (s *Store) UpdateOutsideTemp(carID int64, ts int64, c float64) []byte {
	return s.updateHelper(carID, ts, func(ce *carEntry, delta map[string]any) {
		if ce.state.Climate == nil {
			ce.state.Climate = &Climate{}
		}
		ce.state.Climate.OutsideC = c
		ce.history.OutsideC = append(ce.history.OutsideC, TimestampedFloat{TS: ts, V: c})

		delta["climate"] = ce.state.Climate
		delta["history_30s"] = map[string]any{"outside_c": ce.history.OutsideC}
	})
}

func (s *Store) UpdateTPMS(carID int64, ts int64, pos string, v float64) []byte {
	return s.updateHelper(carID, ts, func(ce *carEntry, delta map[string]any) {
		if ce.state.TPMS == nil {
			ce.state.TPMS = &TPMSBar{}
		}
		switch pos {
		case "fl":
			ce.state.TPMS.FL = v
			ce.history.TPMSFL = append(ce.history.TPMSFL, TimestampedFloat{TS: ts, V: v})
		case "fr":
			ce.state.TPMS.FR = v
			ce.history.TPMSFR = append(ce.history.TPMSFR, TimestampedFloat{TS: ts, V: v})
		case "rl":
			ce.state.TPMS.RL = v
			ce.history.TPMSRL = append(ce.history.TPMSRL, TimestampedFloat{TS: ts, V: v})
		case "rr":
			ce.state.TPMS.RR = v
			ce.history.TPMSRR = append(ce.history.TPMSRR, TimestampedFloat{TS: ts, V: v})
		}

		delta["tpms_bar"] = ce.state.TPMS
	})
}

func (s *Store) UpdateRoute(carID int64, ts int64, dest *Dest, etaMin, distKM float64) []byte {
	return s.updateHelper(carID, ts, func(ce *carEntry, delta map[string]any) {
		if ce.state.Route == nil {
			ce.state.Route = &Route{}
		}
		ce.state.Route.Dest = dest
		ce.state.Route.ETAMin = etaMin
		ce.state.Route.DistKM = distKM

		delta["route"] = ce.state.Route
	})
}

// UpdateRouteWithMeta updates route and includes optional destination label and traffic delay minutes.
func (s *Store) UpdateRouteWithMeta(carID int64, ts int64, dest *Dest, etaMin, distKM float64, destLabel string, trafficDelayMin float64) []byte {
	return s.updateHelper(carID, ts, func(ce *carEntry, delta map[string]any) {
		if ce.state.Route == nil {
			ce.state.Route = &Route{}
		}
		ce.state.Route.Dest = dest
		ce.state.Route.ETAMin = etaMin
		ce.state.Route.DistKM = distKM
		ce.state.Route.DestLabel = destLabel
		ce.state.Route.TrafficDelayMin = trafficDelayMin

		delta["route"] = ce.state.Route
	})
}

func (s *Store) UpdateDisplayNameSilently(carID int64, ts int64, displayName string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	ce := s.ensure(carID)
	ce.state.TSMS = ts
	ce.state.DisplayName = displayName
}

// UpdateExteriorColorSilently updates the exterior color without broadcasting
func (s *Store) UpdateExteriorColorSilently(carID int64, ts int64, exteriorColor string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	ce := s.ensure(carID)
	ce.state.TSMS = ts
	ce.state.ExteriorColor = exteriorColor
}

// UpdateModelSilently updates the model without broadcasting
func (s *Store) UpdateModelSilently(carID int64, ts int64, model string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	ce := s.ensure(carID)
	ce.state.TSMS = ts
	ce.state.Model = model
}

func ceWindowMs(d time.Duration) int64 { return d.Milliseconds() }
