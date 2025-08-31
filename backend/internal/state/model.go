package state

import (
	"fmt"
)

type TimestampedFloat struct {
	TS int64   `json:"ts_ms"`
	V  float64 `json:"v"`
}

type Breadcrumb struct {
	TS  int64   `json:"ts_ms"`
	Lat float64 `json:"lat"`
	Lon float64 `json:"lon"`
}

type Location struct {
	Lat        float64 `json:"lat"`
	Lon        float64 `json:"lon"`
	SpeedKPH   float64 `json:"speed_kph"`
	Heading    float64 `json:"heading"`
	ElevationM float64 `json:"elevation_m"`
}

type Battery struct {
	SOCPct float64 `json:"soc_pct"`
	PowerW float64 `json:"power_w"`
}

type Climate struct {
	InsideC  float64 `json:"inside_c"`
	OutsideC float64 `json:"outside_c"`
}

type TPMSBar struct {
	FL float64 `json:"fl"`
	FR float64 `json:"fr"`
	RL float64 `json:"rl"`
	RR float64 `json:"rr"`
}

type Dest struct {
	Lat float64 `json:"lat"`
	Lon float64 `json:"lon"`
}

type Route struct {
	Dest            *Dest   `json:"dest,omitempty"`
	ETAMin          float64 `json:"eta_min,omitempty"`
	DistKM          float64 `json:"dist_km,omitempty"`
	DestLabel       string  `json:"dest_label,omitempty"`
	TrafficDelayMin float64 `json:"traffic_delay_min,omitempty"`
}

type CarState struct {
	TSMS          int64 `json:"ts_ms"`
	DisplayName   string
	ExteriorColor string
	Model         string
	Location      *Location `json:"location,omitempty"`
	Battery       *Battery  `json:"battery,omitempty"`
	Climate       *Climate  `json:"climate,omitempty"`
	TPMS          *TPMSBar  `json:"tpms_bar,omitempty"`
	Route         *Route    `json:"route,omitempty"`
}

type HistoryWindow struct {
	// per metric time series for 30s window
	SpeedKPH   []TimestampedFloat `json:"speed_kph"`
	Heading    []TimestampedFloat `json:"heading"`
	ElevationM []TimestampedFloat `json:"elevation_m"`
	SOCPct     []TimestampedFloat `json:"soc_pct"`
	PowerW     []TimestampedFloat `json:"power_w"`
	InsideC    []TimestampedFloat `json:"inside_c"`
	OutsideC   []TimestampedFloat `json:"outside_c"`
	TPMSFL     []TimestampedFloat `json:"tpms_fl"`
	TPMSFR     []TimestampedFloat `json:"tpms_fr"`
	TPMSRL     []TimestampedFloat `json:"tpms_rl"`
	TPMSRR     []TimestampedFloat `json:"tpms_rr"`
	Path       []Breadcrumb       `json:"path_30s"`
}

type CarInfo struct {
	ID          int64  `json:"id"`
	DisplayName string `json:"display_name"`
}

// generateDisplayName returns the best available name for the car using fallbacks
func generateDisplayName(carID int64, state CarState) string {
	if state.DisplayName != "" {
		return state.DisplayName
	}

	// Build a descriptive name from available information
	if state.Model != "" && state.ExteriorColor != "" {
		return fmt.Sprintf("Tesla Model %s (%s)", state.Model, state.ExteriorColor)
	}

	// Final fallback
	return fmt.Sprintf("Car %d", carID)
}
