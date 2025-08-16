package mqttc

import "testing"

func TestToFloat(t *testing.T) {
	cases := []struct {
		in   any
		want float64
		ok   bool
	}{
		{float64(1.5), 1.5, true},
		{int(2), 2, true},
		{int64(3), 3, true},
		{"4.5", 4.5, true},
		{"x", 0, false},
		{nil, 0, false},
	}
	for _, c := range cases {
		got, ok := toFloat(c.in)
		if got != c.want || ok != c.ok {
			t.Fatalf("toFloat(%v) = (%v,%v), want (%v,%v)", c.in, got, ok, c.want, c.ok)
		}
	}
}

func TestWrapEvent(t *testing.T) {
	if v := wrapEvent("delta", nil); v != nil {
		t.Fatalf("expected nil for empty data")
	}
	out := wrapEvent("delta", []byte("{\"a\":1}"))
	want := "event: delta\ndata: {\"a\":1}\n\n"
	if string(out) != want {
		t.Fatalf("unexpected wrap: %q", string(out))
	}
}
