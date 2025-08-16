package keys

import (
	"context"
	"testing"
	"time"

	"github.com/lestrrat-go/jwx/v3/jwt"
)

func TestManagerSignVerifyAndRotate(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	m, err := NewManager(ctx, 0)
	if err != nil {
		t.Fatalf("NewManager error: %v", err)
	}

	tok := jwt.New()
	_ = tok.Set(jwt.IssuerKey, "issuer")
	_ = tok.Set(jwt.ExpirationKey, time.Now().Add(time.Hour))

	raw, err := m.SignJWT(tok)
	if err != nil {
		t.Fatalf("SignJWT error: %v", err)
	}
	if len(raw) == 0 {
		t.Fatalf("expected non-empty signature")
	}
	if _, err := m.VerifyJWT(raw); err != nil {
		t.Fatalf("VerifyJWT error: %v", err)
	}

	// Force rotate and ensure previous still verifies
	if err := m.rotate(); err != nil { // use internal helper
		t.Fatalf("rotate error: %v", err)
	}
	if _, err := m.VerifyJWT(raw); err != nil {
		t.Fatalf("VerifyJWT with previous key failed: %v", err)
	}
}

func TestManagerErrors(t *testing.T) {
	m := &Manager{}
	if _, err := m.SignJWT(jwt.New()); err == nil {
		t.Fatalf("expected error when no key present")
	}
	if _, err := m.VerifyJWT([]byte("bad")); err == nil {
		t.Fatalf("expected verification failure")
	}
}
