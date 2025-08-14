package mqttc

import (
    "context"
    "encoding/json"
    "fmt"
    "strconv"
    "strings"
    "time"

    mqtt "github.com/eclipse/paho.mqtt.golang"
    "github.com/rs/zerolog/log"

    "where-is-maurus/backend/internal/state"
    "where-is-maurus/backend/internal/stream"
)

type Client struct {
    cli   mqtt.Client
    store *state.Store
    hub   *stream.Hub
}

func NewClient(brokerURL, username, password string, clientID string, store *state.Store, hub *stream.Hub) *Client {
    opts := mqtt.NewClientOptions().AddBroker(brokerURL).SetClientID(clientID)
    if username != "" {
        opts.SetUsername(username)
        opts.SetPassword(password)
    }
    opts.SetAutoReconnect(true)
    opts.SetConnectionLostHandler(func(_ mqtt.Client, err error) { log.Warn().Err(err).Msg("mqtt lost") })
    opts.SetOnConnectHandler(func(c mqtt.Client) { log.Info().Msg("mqtt connected") })
    return &Client{cli: mqtt.NewClient(opts), store: store, hub: hub}
}

func (c *Client) Connect(ctx context.Context) error {
    if token := c.cli.Connect(); !token.WaitTimeout(10 * time.Second) || token.Error() != nil {
        if token.Error() != nil { return token.Error() }
        return fmt.Errorf("mqtt connect timeout")
    }
    go func() { <-ctx.Done(); c.cli.Disconnect(100) }()
    return nil
}

func (c *Client) SubscribeCar(ctx context.Context, carID int64) error {
    base := fmt.Sprintf("teslamate/cars/%d/", carID)
    topics := []string{
        base + "location",
        base + "speed",
        base + "heading",
        base + "elevation",
        base + "battery_level",
        base + "power",
        base + "inside_temp",
        base + "outside_temp",
        base + "tpms_pressure_fl",
        base + "tpms_pressure_fr",
        base + "tpms_pressure_rl",
        base + "tpms_pressure_rr",
        base + "active_route",
    }
    handler := func(_ mqtt.Client, m mqtt.Message) {
        topic := m.Topic()
        payload := string(m.Payload())
        ts := time.Now().UnixMilli()
        // routing
        if strings.HasSuffix(topic, "/location") {
            var loc struct{
                Latitude  float64 `json:"latitude"`
                Longitude float64 `json:"longitude"`
            }
            if err := json.Unmarshal(m.Payload(), &loc); err == nil {
                delta := c.store.UpdateLocation(carID, ts, loc.Latitude, loc.Longitude, -1, -1, -1)
                c.hub.Broadcast(carID, wrapEvent("delta", delta))
            }
            return
        }
        if strings.HasSuffix(topic, "/active_route") {
            // TeslaMate route JSON has nested fields; keep dest lat/lon, eta_min, dist_km when present
            var ar map[string]any
            if err := json.Unmarshal(m.Payload(), &ar); err == nil {
                var dest *state.Dest
                if d, ok := ar["destination"].(map[string]any); ok {
                    lat, _ := toFloat(d["lat"])
                    lon, _ := toFloat(d["lng"]) // some payloads use lng
                    if lon == 0 {
                        lon, _ = toFloat(d["lon"]) // fallback
                    }
                    dest = &state.Dest{Lat: lat, Lon: lon}
                }
                etaMin, _ := toFloat(ar["eta_minutes"])
                if etaMin == 0 { etaMin, _ = toFloat(ar["eta_min"]) }
                distKM, _ := toFloat(ar["distance_km"])
                if distKM == 0 { distKM, _ = toFloat(ar["dist_km"]) }
                delta := c.store.UpdateRoute(carID, ts, dest, etaMin, distKM)
                c.hub.Broadcast(carID, wrapEvent("delta", delta))
            }
            return
        }
        // numeric simple topics
        val, err := strconv.ParseFloat(payload, 64)
        if err != nil {
            return
        }
        switch {
        case strings.HasSuffix(topic, "/speed"):
            delta := c.store.UpdateSpeed(carID, ts, val)
            c.hub.Broadcast(carID, wrapEvent("delta", delta))
        case strings.HasSuffix(topic, "/heading"):
            delta := c.store.UpdateHeading(carID, ts, val)
            c.hub.Broadcast(carID, wrapEvent("delta", delta))
        case strings.HasSuffix(topic, "/elevation"):
            delta := c.store.UpdateElevation(carID, ts, val)
            c.hub.Broadcast(carID, wrapEvent("delta", delta))
        case strings.HasSuffix(topic, "/battery_level"):
            delta := c.store.UpdateBatteryLevel(carID, ts, val)
            c.hub.Broadcast(carID, wrapEvent("delta", delta))
        case strings.HasSuffix(topic, "/power"):
            delta := c.store.UpdatePower(carID, ts, val)
            c.hub.Broadcast(carID, wrapEvent("delta", delta))
        case strings.HasSuffix(topic, "/inside_temp"):
            delta := c.store.UpdateInsideTemp(carID, ts, val)
            c.hub.Broadcast(carID, wrapEvent("delta", delta))
        case strings.HasSuffix(topic, "/outside_temp"):
            delta := c.store.UpdateOutsideTemp(carID, ts, val)
            c.hub.Broadcast(carID, wrapEvent("delta", delta))
        case strings.HasSuffix(topic, "/tpms_pressure_fl"):
            delta := c.store.UpdateTPMS(carID, ts, "fl", val)
            c.hub.Broadcast(carID, wrapEvent("delta", delta))
        case strings.HasSuffix(topic, "/tpms_pressure_fr"):
            delta := c.store.UpdateTPMS(carID, ts, "fr", val)
            c.hub.Broadcast(carID, wrapEvent("delta", delta))
        case strings.HasSuffix(topic, "/tpms_pressure_rl"):
            delta := c.store.UpdateTPMS(carID, ts, "rl", val)
            c.hub.Broadcast(carID, wrapEvent("delta", delta))
        case strings.HasSuffix(topic, "/tpms_pressure_rr"):
            delta := c.store.UpdateTPMS(carID, ts, "rr", val)
            c.hub.Broadcast(carID, wrapEvent("delta", delta))
        }
    }
    for _, t := range topics {
        if token := c.cli.Subscribe(t, 0, handler); token.Wait() && token.Error() != nil {
            return token.Error()
        }
    }
    go func() { <-ctx.Done(); for _, t := range topics { c.cli.Unsubscribe(t) } }()
    return nil
}

func toFloat(v any) (float64, bool) {
    switch x := v.(type) {
    case float64:
        return x, true
    case int:
        return float64(x), true
    case int64:
        return float64(x), true
    case string:
        f, err := strconv.ParseFloat(x, 64)
        if err == nil { return f, true }
    }
    return 0, false
}

func wrapEvent(event string, data []byte) []byte {
    if len(data) == 0 { return nil }
    // SSE framing: event: <event>\n data: <json>\n\n
    // We keep payload as-is assuming it is a JSON object, prefix data: once
    return []byte("event: " + event + "\n" + "data: " + string(data) + "\n\n")
}


