package auth

import (
	"errors"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

const (
	IssuerWhereIsMaurus = "where-is-maurus"
	AudienceShare       = "share"
	CookieName          = "wi_session"
)

type ShareClaims struct {
	CarID int64 `json:"car_id"`
	Dest  *Dest `json:"dest,omitempty"`
}

type Dest struct {
	Lat           float64 `json:"lat"`
	Lon           float64 `json:"lon"`
	ArriveRadiusM float64 `json:"arrive_radius_m,omitempty"`
}

// CreateShareToken builds a signed JWT using provided signer.
func CreateShareToken(now time.Time, ttl time.Duration, carID int64, dest *Dest, sign func(t jwt.Token) ([]byte, error)) (string, time.Time, error) {
	t := jwt.New()
	_ = t.Set(jwt.IssuerKey, IssuerWhereIsMaurus)
	_ = t.Set(jwt.AudienceKey, []string{AudienceShare})
	_ = t.Set(jwt.IssuedAtKey, now)
	exp := now.Add(ttl)
	_ = t.Set(jwt.ExpirationKey, exp)
	_ = t.Set(jwt.JwtIDKey, uuid.New().String())
	_ = t.Set("car_id", carID)
	if dest != nil {
		_ = t.Set("dest", dest)
	}
	b, err := sign(t)
	if err != nil {
		return "", time.Time{}, err
	}
	return string(b), exp, nil
}

// VerifyShareToken checks claims and signature using provided verify func.
func VerifyShareToken(raw string, verify func([]byte) (jwt.Token, error)) (jwt.Token, error) {
	tok, err := verify([]byte(raw))
	if err != nil {
		return nil, err
	}
	if iss, ok := tok.Issuer(); !ok || iss != IssuerWhereIsMaurus {
		return nil, errors.New("invalid issuer")
	}
	audValid := false
	if auds, ok := tok.Audience(); ok {
		for _, a := range auds {
			if a == AudienceShare {
				audValid = true
				break
			}
		}
	}
	if !audValid {
		return nil, errors.New("invalid audience")
	}
	if err := jwt.Validate(tok); err != nil {
		return nil, err
	}
	return tok, nil
}

func SetSessionCookie(w http.ResponseWriter, domain string, token string, exp time.Time) {
	c := &http.Cookie{
		Name:     CookieName,
		Value:    token,
		Path:     "/",
		Domain:   domain,
		Expires:  exp,
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	}
	http.SetCookie(w, c)
}

func ReadSessionCookie(r *http.Request) (string, error) {
	c, err := r.Cookie(CookieName)
	if err != nil {
		return "", err
	}
	return c.Value, nil
}
