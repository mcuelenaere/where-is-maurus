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
	h.Broadcast(1, payload)
	select {
	case got := <-sub.Ch:
		if string(got) != "x" {
			t.Fatalf("unexpected payload: %q", got)
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
