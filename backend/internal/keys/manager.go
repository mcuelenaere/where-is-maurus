package keys

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jws"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

// Manager holds current and previous ES512 JWKs and rotates them on a ticker.
type Manager struct {
	mu       sync.RWMutex
	current  jwk.Key
	previous jwk.Key
}

func NewManager(ctx context.Context, rotateEvery time.Duration) (*Manager, error) {
	m := &Manager{}
	if err := m.rotate(); err != nil {
		return nil, err
	}
	// Start rotation goroutine
	if rotateEvery > 0 {
		ticker := time.NewTicker(rotateEvery)
		go func() {
			defer ticker.Stop()
			for {
				select {
				case <-ctx.Done():
					return
				case <-ticker.C:
					_ = m.rotate() // best-effort
				}
			}
		}()
	}
	return m, nil
}

func (m *Manager) rotate() error {
	// Generate ES512 key (P-521)
	priv, err := ecdsa.GenerateKey(elliptic.P521(), rand.Reader)
	if err != nil {
		return err
	}
	jwkKey, err := jwk.Import(priv)
	if err != nil {
		return err
	}
	_ = jwkKey.Set(jwk.KeyUsageKey, "sig")
	_ = jwkKey.Set(jwk.AlgorithmKey, jwa.ES512())
	kid := uuid.New().String()
	_ = jwkKey.Set(jwk.KeyIDKey, kid)

	m.mu.Lock()
	defer m.mu.Unlock()
	m.previous = m.current
	m.current = jwkKey
	return nil
}

func (m *Manager) Current() jwk.Key {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.current
}

func (m *Manager) Previous() jwk.Key {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.previous
}

// SignJWT signs with the current key and sets kid header.
func (m *Manager) SignJWT(t jwt.Token) ([]byte, error) {
	m.mu.RLock()
	cur := m.current
	m.mu.RUnlock()
	if cur == nil {
		return nil, ErrNoKey
	}
	hdrs := jws.NewHeaders()
	var kid string
	_ = cur.Get(jwk.KeyIDKey, &kid)
	if kid != "" {
		_ = hdrs.Set(jws.KeyIDKey, kid)
	}
	return jwt.Sign(t, jwt.WithKey(jwa.ES512(), cur, jws.WithProtectedHeaders(hdrs)))
}

// VerifyJWT verifies against current or previous key.
func (m *Manager) VerifyJWT(raw []byte) (jwt.Token, error) {
	m.mu.RLock()
	cur := m.current
	prev := m.previous
	m.mu.RUnlock()

	// Try current then previous
	if cur != nil {
		if tkn, err := jwt.Parse(raw, jwt.WithKey(jwa.ES512(), cur)); err == nil {
			return tkn, nil
		}
	}
	if prev != nil {
		if tkn, err := jwt.Parse(raw, jwt.WithKey(jwa.ES512(), prev)); err == nil {
			return tkn, nil
		}
	}
	return nil, ErrVerificationFailed
}

var (
	ErrNoKey              = errors.New("no signing key")
	ErrVerificationFailed = errors.New("verification failed")
)
