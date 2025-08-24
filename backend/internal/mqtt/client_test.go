package mqttc

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/mcuelenaere/where-is-maurus/backend/internal/state"
	"github.com/mcuelenaere/where-is-maurus/backend/internal/stream"
)

// We don't hit a real broker; instead, we exercise handler logic indirectly by invoking the subscribed callback.

type dummyToken struct{ err error }

func (t dummyToken) Wait() bool                       { return true }
func (t dummyToken) WaitTimeout(_ time.Duration) bool { return true }
func (t dummyToken) Done() <-chan struct{}            { return make(chan struct{}) }
func (t dummyToken) Error() error                     { return t.err }
func (t dummyToken) Release()                         {}

// mockClient embeds minimal methods we use
type mockClient struct {
	opts *mqtt.ClientOptions
	subs map[string]mqtt.MessageHandler
}

func (m *mockClient) IsConnected() bool      { return true }
func (m *mockClient) IsConnectionOpen() bool { return true }
func (m *mockClient) Connect() mqtt.Token    { return dummyToken{} }
func (m *mockClient) Disconnect(_ uint)      {}
func (m *mockClient) Publish(topic string, _ byte, _ bool, _ interface{}) mqtt.Token {
	return dummyToken{}
}
func (m *mockClient) Subscribe(topic string, _ byte, cb mqtt.MessageHandler) mqtt.Token {
	if m.subs == nil {
		m.subs = map[string]mqtt.MessageHandler{}
	}
	m.subs[topic] = cb
	return dummyToken{}
}
func (m *mockClient) SubscribeMultiple(_ map[string]byte, _ mqtt.MessageHandler) mqtt.Token {
	return dummyToken{}
}
func (m *mockClient) Unsubscribe(_ ...string) mqtt.Token       { return dummyToken{} }
func (m *mockClient) AddRoute(_ string, _ mqtt.MessageHandler) {}
func (m *mockClient) OptionsReader() mqtt.ClientOptionsReader  { return mqtt.ClientOptionsReader{} }

// message implements mqtt.Message
type message struct {
	topic   string
	payload []byte
}

func (m message) Duplicate() bool   { return false }
func (m message) Qos() byte         { return 0 }
func (m message) Retained() bool    { return false }
func (m message) Topic() string     { return m.topic }
func (m message) MessageID() uint16 { return 0 }
func (m message) Payload() []byte   { return m.payload }
func (m message) Ack()              {}

func TestSubscribeAllCars_RoutesToStoreAndHub(t *testing.T) {
	st := state.NewStore()
	hub := stream.NewHub()
	opts := mqtt.NewClientOptions().AddBroker("tcp://example:1883").SetClientID("test")
	mc := &mockClient{opts: opts}

	c := &Client{cli: mc, store: st, hub: hub}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := c.SubscribeAllCars(ctx); err != nil {
		t.Fatalf("SubscribeAllCars error: %v", err)
	}

	// Simulate a few messages via registered handler
	handler := mc.subs["teslamate/cars/+/location"]
	if handler == nil {
		t.Fatalf("expected location handler registered")
	}
	// location JSON
	loc := map[string]any{"latitude": 1.2, "longitude": 3.4}
	b, _ := json.Marshal(loc)
	handler(mc, message{topic: "teslamate/cars/1/location", payload: b})

	// numeric topic
	handler = mc.subs["teslamate/cars/+/speed"]
	handler(mc, message{topic: "teslamate/cars/1/speed", payload: []byte("42")})

	// active_route complex
	handler = mc.subs["teslamate/cars/+/active_route"]
	ar := map[string]any{
		"location":          map[string]any{"latitude": 9.9, "longitude": 8.8},
		"destination":       "Home",
		"eta_minutes":       12,
		"traffic_delay_min": 3,
		"distance_km":       4.5,
	}
	b, _ = json.Marshal(ar)
	handler(mc, message{topic: "teslamate/cars/1/active_route", payload: b})

	// verify state got updates
	stSnap, _ := st.GetSnapshot(1)
	if stSnap.Location == nil || stSnap.Location.Lat == 0 {
		t.Fatalf("expected location to be updated: %+v", stSnap)
	}
	if stSnap.Route == nil || stSnap.Route.Dest == nil || stSnap.Route.Dest.Lat == 0 {
		t.Fatalf("expected route to be updated: %+v", stSnap.Route)
	}
}
