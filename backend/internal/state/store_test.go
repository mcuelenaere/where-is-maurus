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

// TestUpdateHelper_AllMethods tests that all UpdateXXX methods work correctly with the new updateHelper
func TestUpdateHelper_AllMethods(t *testing.T) {
	s := NewStore()
	now := time.Now().UnixMilli()
	carID := int64(123)

	// Test UpdateSpeed
	delta := s.UpdateSpeed(carID, now, 50.5)
	checkDelta(t, delta, "ts_ms", "location", "history_30s")

	// Test UpdateHeading
	delta = s.UpdateHeading(carID, now+1, 180.0)
	checkDelta(t, delta, "ts_ms", "location", "history_30s")

	// Test UpdateElevation
	delta = s.UpdateElevation(carID, now+2, 100.5)
	checkDelta(t, delta, "ts_ms", "location", "history_30s")

	// Test UpdateBatteryLevel
	delta = s.UpdateBatteryLevel(carID, now+3, 75.0)
	checkDelta(t, delta, "ts_ms", "battery", "history_30s")

	// Test UpdatePower
	delta = s.UpdatePower(carID, now+4, 1500.0)
	checkDelta(t, delta, "ts_ms", "battery", "history_30s")

	// Test UpdateInsideTemp
	delta = s.UpdateInsideTemp(carID, now+5, 22.5)
	checkDelta(t, delta, "ts_ms", "climate", "history_30s")

	// Test UpdateOutsideTemp
	delta = s.UpdateOutsideTemp(carID, now+6, 15.0)
	checkDelta(t, delta, "ts_ms", "climate", "history_30s")

	// Test UpdateTPMS
	delta = s.UpdateTPMS(carID, now+7, "fl", 2.3)
	checkDelta(t, delta, "ts_ms", "tpms_bar")

	// Test UpdateRoute
	delta = s.UpdateRoute(carID, now+8, &Dest{Lat: 1.2, Lon: 3.4}, 30, 15.5)
	checkDelta(t, delta, "ts_ms", "route")

	// Test UpdateRouteWithMeta
	delta = s.UpdateRouteWithMeta(carID, now+9, &Dest{Lat: 5.6, Lon: 7.8}, 45, 25.0, "Home", 5)
	checkDelta(t, delta, "ts_ms", "route")
}

// TestUpdateHelper_HistoryTracking tests that history is properly tracked and pruned
func TestUpdateHelper_HistoryTracking(t *testing.T) {
	s := NewStore()
	now := time.Now().UnixMilli()
	carID := int64(456)

	// Add multiple updates to build history
	for i := 0; i < 10; i++ {
		ts := now + int64(i*1000)
		s.UpdateSpeed(carID, ts, float64(i*10))
		s.UpdateBatteryLevel(carID, ts, float64(i*5))
	}

	// Get snapshot and verify history
	state, history := s.GetSnapshot(carID)

	// Check that state has latest values
	if state.Location.SpeedKPH != 90.0 {
		t.Errorf("expected speed 90.0, got %f", state.Location.SpeedKPH)
	}
	if state.Battery.SOCPct != 45.0 {
		t.Errorf("expected battery 45.0, got %f", state.Battery.SOCPct)
	}

	// Check that history has multiple entries
	if len(history.SpeedKPH) < 5 {
		t.Errorf("expected at least 5 speed history entries, got %d", len(history.SpeedKPH))
	}
	if len(history.SOCPct) < 5 {
		t.Errorf("expected at least 5 battery history entries, got %d", len(history.SOCPct))
	}

	// Verify history entries are in chronological order
	for i := 1; i < len(history.SpeedKPH); i++ {
		if history.SpeedKPH[i].TS <= history.SpeedKPH[i-1].TS {
			t.Errorf("speed history not in chronological order at index %d", i)
		}
	}
}

// TestUpdateHelper_StructInitialization tests that nested structs are properly initialized
func TestUpdateHelper_StructInitialization(t *testing.T) {
	s := NewStore()
	now := time.Now().UnixMilli()
	carID := int64(789)

	// Test that structs are initialized when first accessed
	state, _ := s.GetSnapshot(carID)
	if state.Location != nil {
		t.Error("expected nil Location before first update")
	}
	if state.Battery != nil {
		t.Error("expected nil Battery before first update")
	}
	if state.Climate != nil {
		t.Error("expected nil Climate before first update")
	}
	if state.TPMS != nil {
		t.Error("expected nil TPMS before first update")
	}

	// Update each field and verify structs are created
	s.UpdateSpeed(carID, now, 50.0)
	state, _ = s.GetSnapshot(carID)
	if state.Location == nil {
		t.Error("expected non-nil Location after UpdateSpeed")
	}

	s.UpdateBatteryLevel(carID, now+1, 75.0)
	state, _ = s.GetSnapshot(carID)
	if state.Battery == nil {
		t.Error("expected non-nil Battery after UpdateBatteryLevel")
	}

	s.UpdateInsideTemp(carID, now+2, 22.0)
	state, _ = s.GetSnapshot(carID)
	if state.Climate == nil {
		t.Error("expected non-nil Climate after UpdateInsideTemp")
	}

	s.UpdateTPMS(carID, now+3, "fl", 2.3)
	state, _ = s.GetSnapshot(carID)
	if state.TPMS == nil {
		t.Error("expected non-nil TPMS after UpdateTPMS")
	}
}

// TestUpdateHelper_TPMSAllPositions tests that all TPMS positions work correctly
func TestUpdateHelper_TPMSAllPositions(t *testing.T) {
	s := NewStore()
	now := time.Now().UnixMilli()
	carID := int64(999)

	positions := []string{"fl", "fr", "rl", "rr"}
	values := []float64{2.1, 2.2, 2.3, 2.4}

	for i, pos := range positions {
		delta := s.UpdateTPMS(carID, now+int64(i), pos, values[i])
		checkDelta(t, delta, "ts_ms", "tpms_bar")
	}

	state, _ := s.GetSnapshot(carID)
	if state.TPMS == nil {
		t.Fatal("expected non-nil TPMS after updates")
	}

	// Verify all positions were set correctly
	if state.TPMS.FL != 2.1 {
		t.Errorf("expected FL 2.1, got %f", state.TPMS.FL)
	}
	if state.TPMS.FR != 2.2 {
		t.Errorf("expected FR 2.2, got %f", state.TPMS.FR)
	}
	if state.TPMS.RL != 2.3 {
		t.Errorf("expected RL 2.3, got %f", state.TPMS.RL)
	}
	if state.TPMS.RR != 2.4 {
		t.Errorf("expected RR 2.4, got %f", state.TPMS.RR)
	}
}

// TestUpdateHelper_LocationWithNegativeValues tests the conditional logic in UpdateLocation
func TestUpdateHelper_LocationWithNegativeValues(t *testing.T) {
	s := NewStore()
	now := time.Now().UnixMilli()
	carID := int64(111)

	// Test with negative values (should be ignored)
	_ = s.UpdateLocation(carID, now, 1.2, 3.4, -1, -1, -1)

	state, history := s.GetSnapshot(carID)

	// Location should be set
	if state.Location.Lat != 1.2 || state.Location.Lon != 3.4 {
		t.Error("expected lat/lon to be set")
	}

	// Negative values should not be set
	if state.Location.SpeedKPH != 0 {
		t.Errorf("expected speed 0, got %f", state.Location.SpeedKPH)
	}
	if state.Location.Heading != 0 {
		t.Errorf("expected heading 0, got %f", state.Location.Heading)
	}
	if state.Location.ElevationM != 0 {
		t.Errorf("expected elevation 0, got %f", state.Location.ElevationM)
	}

	// History should not contain negative values
	if len(history.SpeedKPH) > 0 {
		t.Error("expected no speed history for negative value")
	}
	if len(history.Heading) > 0 {
		t.Error("expected no heading history for negative value")
	}
	if len(history.ElevationM) > 0 {
		t.Error("expected no elevation history for negative value")
	}

	// Path should still be added
	if len(history.Path) != 1 {
		t.Error("expected path to be added even with negative values")
	}
}

// TestUpdateHelper_SilentUpdates tests that silent updates work correctly (don't use updateHelper)
func TestUpdateHelper_SilentUpdates(t *testing.T) {
	s := NewStore()
	now := time.Now().UnixMilli()
	carID := int64(222)

	// Test silent updates
	s.UpdateExteriorColorSilently(carID, now, "Red")
	s.UpdateDisplayNameSilently(carID, now, "My Tesla")
	s.UpdateModelSilently(carID, now, "S")

	state, _ := s.GetSnapshot(carID)
	if state.ExteriorColor != "Red" {
		t.Errorf("expected exterior color 'Red', got '%s'", state.ExteriorColor)
	}

	if state.DisplayName != "My Tesla" {
		t.Errorf("expected display name 'My Tesla', got '%s'", state.DisplayName)
	}

	if state.Model != "S" {
		t.Errorf("expected model 'S', got '%s'", state.Model)
	}
}

// Helper function to check that delta contains expected fields
func checkDelta(t *testing.T, delta []byte, expectedFields ...string) {
	var js map[string]any
	if err := json.Unmarshal(delta, &js); err != nil {
		t.Fatalf("delta should be valid JSON: %v", err)
	}

	for _, field := range expectedFields {
		if _, exists := js[field]; !exists {
			t.Errorf("expected delta to contain field '%s'", field)
		}
	}

	// Always check that ts_ms is present
	if _, exists := js["ts_ms"]; !exists {
		t.Error("expected delta to contain ts_ms field")
	}
}
