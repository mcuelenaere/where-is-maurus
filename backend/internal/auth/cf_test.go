package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCFValidateRequest_MissingAssertion(t *testing.T) {
	v := &CFValidator{}
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	if err := v.ValidateRequest(r); err == nil {
		t.Fatalf("expected error for missing assertion")
	}
}
