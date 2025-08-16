package state

import (
	"encoding/json"
	"testing"
	"time"
)

func TestStore_UpdateAndPrune(t *testing.T) {
	s := NewStore()
	now := time.Now().UnixMilli()
	// add older samples beyond window to exercise prune
	for i := int64(0); i < 5; i++ {
		s.UpdateSpeed(1, now-1_000_000+i*1000, float64(i))
	}
	// add fresh ones
	s.UpdateSpeed(1, now, 10)
	s.UpdateHeading(1, now, 180)
	s.UpdateElevation(1, now, 12.3)
	s.UpdateBatteryLevel(1, now, 55)
	s.UpdatePower(1, now, 1200)
	s.UpdateInsideTemp(1, now, 21)
	s.UpdateOutsideTemp(1, now, 9)
	s.UpdateTPMS(1, now, "fl", 2.3)
	s.UpdateLocation(1, now, 1.2, 3.4, 50, 90, 7)

	st, hist := s.GetSnapshot(1)
	if st.Location == nil || st.Battery == nil || st.Climate == nil || st.TPMS == nil {
		t.Fatalf("expected non-nil substructures: %+v", st)
	}
	if len(hist.SpeedKPH) == 0 || len(hist.Path) == 0 {
		t.Fatalf("expected history to contain samples: %+v", hist)
	}
	// ensure JSON delta is a JSON object
	delta := s.UpdateRoute(1, now, &Dest{Lat: 1, Lon: 2}, 3, 4)
	var js map[string]any
	if err := json.Unmarshal(delta, &js); err != nil {
		t.Fatalf("delta should be JSON: %v", err)
	}
}

func TestListCarIDs(t *testing.T) {
	s := NewStore()
	s.UpdateSpeed(1, time.Now().UnixMilli(), 1)
	s.UpdateSpeed(2, time.Now().UnixMilli(), 2)
	ids := s.ListCarIDs()
	if len(ids) != 2 {
		t.Fatalf("expected 2 ids, got %d", len(ids))
	}
}
