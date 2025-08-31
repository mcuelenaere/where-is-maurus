package state

import (
	"encoding/json"
	"testing"
)

func TestMergeDeltas(t *testing.T) {
	// Test case 1: Empty deltas
	result := mergeDeltas([]map[string]any{})
	if result != nil {
		t.Error("expected nil for empty deltas")
	}

	// Test case 2: Single delta
	singleDelta := map[string]any{
		"ts_ms": float64(1000),
		"location": map[string]any{
			"speed_kph": float64(50),
		},
	}
	result = mergeDeltas([]map[string]any{singleDelta})
	if result == nil {
		t.Error("expected non-nil result for single delta")
	}
	if result["ts_ms"] != float64(1000) {
		t.Error("expected ts_ms to be preserved")
	}

	// Test case 3: Multiple deltas with different fields
	delta1 := map[string]any{
		"ts_ms": float64(1000),
		"location": map[string]any{
			"speed_kph": float64(50),
		},
		"history_30s": map[string]any{
			"speed_kph": []any{map[string]any{"ts_ms": float64(1000), "v": float64(50)}},
		},
	}
	delta2 := map[string]any{
		"ts_ms": float64(2000),
		"battery": map[string]any{
			"soc_pct": float64(75),
		},
		"history_30s": map[string]any{
			"soc_pct": []any{map[string]any{"ts_ms": float64(2000), "v": float64(75)}},
		},
	}
	delta3 := map[string]any{
		"ts_ms": float64(1500),
		"climate": map[string]any{
			"inside_c": float64(22),
		},
		"history_30s": map[string]any{
			"inside_c": []any{map[string]any{"ts_ms": float64(1500), "v": float64(22)}},
		},
	}

	result = mergeDeltas([]map[string]any{delta1, delta2, delta3})

	// Check that all fields are present
	if result["location"] == nil {
		t.Error("expected location to be present")
	}
	if result["battery"] == nil {
		t.Error("expected battery to be present")
	}
	if result["climate"] == nil {
		t.Error("expected climate to be present")
	}

	// Check that history_30s contains all fields
	history, ok := result["history_30s"].(map[string]any)
	if !ok {
		t.Error("expected history_30s to be present")
	}
	if history["speed_kph"] == nil {
		t.Error("expected speed_kph in history")
	}
	if history["soc_pct"] == nil {
		t.Error("expected soc_pct in history")
	}
	if history["inside_c"] == nil {
		t.Error("expected inside_c in history")
	}

	// Check that ts_ms is the latest (2000)
	if result["ts_ms"] != float64(2000) {
		t.Errorf("expected latest ts_ms 2000, got %v", result["ts_ms"])
	}
}

func TestMergeDeltasWithOverlappingHistory(t *testing.T) {
	// Test merging when multiple deltas have history_30s
	delta1 := map[string]any{
		"ts_ms": float64(1000),
		"history_30s": map[string]any{
			"speed_kph": []any{map[string]any{"ts_ms": float64(1000), "v": float64(50)}},
		},
	}
	delta2 := map[string]any{
		"ts_ms": float64(2000),
		"history_30s": map[string]any{
			"soc_pct": []any{map[string]any{"ts_ms": float64(2000), "v": float64(75)}},
		},
	}

	result := mergeDeltas([]map[string]any{delta1, delta2})

	history, ok := result["history_30s"].(map[string]any)
	if !ok {
		t.Error("expected history_30s to be present")
	}

	// Both history entries should be present
	if history["speed_kph"] == nil {
		t.Error("expected speed_kph in history")
	}
	if history["soc_pct"] == nil {
		t.Error("expected soc_pct in history")
	}

	// ts_ms should be the latest
	if result["ts_ms"] != float64(2000) {
		t.Errorf("expected latest ts_ms 2000, got %v", result["ts_ms"])
	}
}

func TestMergeDeltasJSONCompatibility(t *testing.T) {
	// Test that the merged delta can be marshaled to JSON
	delta1 := map[string]any{
		"ts_ms": float64(1000),
		"location": map[string]any{
			"speed_kph": float64(50),
		},
	}
	delta2 := map[string]any{
		"ts_ms": float64(2000),
		"battery": map[string]any{
			"soc_pct": float64(75),
		},
	}

	result := mergeDeltas([]map[string]any{delta1, delta2})

	// Should be able to marshal to JSON
	jsonBytes, err := json.Marshal(result)
	if err != nil {
		t.Errorf("failed to marshal merged delta: %v", err)
	}

	// Should be able to unmarshal back
	var unmarshaled map[string]any
	err = json.Unmarshal(jsonBytes, &unmarshaled)
	if err != nil {
		t.Errorf("failed to unmarshal merged delta: %v", err)
	}

	// Check that key fields are present
	if unmarshaled["ts_ms"] == nil {
		t.Error("expected ts_ms in unmarshaled result")
	}
	if unmarshaled["location"] == nil {
		t.Error("expected location in unmarshaled result")
	}
	if unmarshaled["battery"] == nil {
		t.Error("expected battery in unmarshaled result")
	}
}
