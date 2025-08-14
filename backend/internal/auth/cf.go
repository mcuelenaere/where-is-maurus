package auth

import (
	"context"
	"errors"
	"net/http"

	"github.com/lestrrat-go/httprc/v3"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

type CFValidator struct {
	cache    *jwk.Cache
	jwks     jwk.Set
	jwksURL  string
	issuer   string
	audience string
}

func NewCFValidator(ctx context.Context, jwksURL, issuer, audience string) (*CFValidator, error) {
	client := httprc.NewClient()
	cache, _ := jwk.NewCache(ctx, client)
	if err := cache.Register(ctx, jwksURL); err != nil {
		return nil, err
	}
	set, err := cache.Lookup(ctx, jwksURL)
	if err != nil {
		return nil, err
	}
	return &CFValidator{cache: cache, jwks: set, jwksURL: jwksURL, issuer: issuer, audience: audience}, nil
}

func (v *CFValidator) ValidateRequest(r *http.Request) error {
	assertion := r.Header.Get("CF-Access-Jwt-Assertion")
	if assertion == "" {
		return errors.New("missing CF Access assertion")
	}
	ctx := r.Context()
	set, err := v.cache.Lookup(ctx, v.jwksURL)
	if err != nil {
		return err
	}
	// Validate token
	tok, err := jwt.Parse([]byte(assertion), jwt.WithKeySet(set))
	if err != nil {
		return err
	}
	if v.issuer != "" {
		if iss, ok := tok.Issuer(); !ok || iss != v.issuer {
			return errors.New("invalid issuer")
		}
	}
	if v.audience != "" {
		match := false
		if auds, ok := tok.Audience(); ok {
			for _, a := range auds {
				if a == v.audience {
					match = true
					break
				}
			}
		}
		if !match {
			return errors.New("invalid audience")
		}
	}
	if err := jwt.Validate(tok); err != nil {
		return err
	}
	return nil
}
