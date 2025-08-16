package auth

import (
	"errors"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/lestrrat-go/jwx/v3/jwt"
)

func TestCreateAndVerifyShareToken(t *testing.T) {
	now := time.Now()
	sign := func(tok jwt.Token) ([]byte, error) {
		// naive signing for unit test purposes only
		// encode claims into a pseudo token string
		v := "testtoken"
		return []byte(v), nil
	}
	verify := func(b []byte) (jwt.Token, error) {
		if string(b) != "testtoken" {
			return nil, errors.New("bad signature")
		}
		// Build a minimal token that passes claim checks
		tkn := jwt.New()
		_ = tkn.Set(jwt.IssuerKey, IssuerWhereIsMaurus)
		_ = tkn.Set(jwt.AudienceKey, []string{AudienceShare})
		_ = tkn.Set(jwt.IssuedAtKey, time.Now())
		_ = tkn.Set(jwt.ExpirationKey, time.Now().Add(time.Hour))
		return tkn, nil
	}
	raw, exp, err := CreateShareToken(now, time.Hour, 123, sign)
	if err != nil {
		t.Fatalf("CreateShareToken error: %v", err)
	}
	if raw == "" || exp.IsZero() {
		t.Fatalf("unexpected token/exp: %q %v", raw, exp)
	}
	tok, err := VerifyShareToken(raw, verify)
	if err != nil {
		t.Fatalf("VerifyShareToken error: %v", err)
	}
	if iss, _ := tok.Issuer(); iss != IssuerWhereIsMaurus {
		t.Fatalf("issuer mismatch: %v", iss)
	}
}

func TestSessionCookie(t *testing.T) {
	rr := httptest.NewRecorder()
	exp := time.Now().Add(time.Hour)
	SetSessionCookie(rr, "example.com", "abc", exp)
	res := rr.Result()
	c := res.Cookies()
	if len(c) != 1 || c[0].Name != CookieName || c[0].Value != "abc" || c[0].Domain != "example.com" {
		t.Fatalf("unexpected cookie: %+v", c)
	}
}
