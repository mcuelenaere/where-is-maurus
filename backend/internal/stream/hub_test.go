package stream

import (
	"testing"
)

func TestHub_SubscribeBroadcastUnsubscribe(t *testing.T) {
	h := NewHub()
	sub := h.Subscribe(1)
	if sub == nil || sub.Ch == nil {
		t.Fatalf("expected subscriber")
	}
	// broadcast should deliver
	payload := []byte("x")
	h.Broadcast(1, "test", payload)
	select {
	case got := <-sub.Ch:
		expected := "event: test\ndata: x\n\n"
		if string(got) != expected {
			t.Fatalf("unexpected payload: %q, expected %q", got, expected)
		}
	default:
		t.Fatalf("expected message delivered")
	}
	h.Unsubscribe(1, sub)
	// channel must be closed
	if _, ok := <-sub.Ch; ok {
		t.Fatalf("expected channel closed")
	}
}
