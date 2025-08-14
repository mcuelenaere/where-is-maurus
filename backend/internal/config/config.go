package config

import (
	"strings"
	"time"

	env "github.com/caarlos0/env/v11"
)

type Config struct {
	HTTPAddr            string        `env:"HTTP_ADDR" envDefault:":8080"`
	CORSAllowedOrigins  []string      `env:"CORS_ALLOWED_ORIGINS" envSeparator:","`
	CookieDomain        string        `env:"COOKIE_DOMAIN"`
	TokenDefaultTTL     time.Duration `env:"TOKEN_DEFAULT_TTL" envDefault:"28800s"`
	KeyRotateSeconds    time.Duration `env:"KEY_ROTATE_SECONDS" envDefault:"28800s"`
	MQTTBrokerURL       string        `env:"MQTT_BROKER_URL"`
	MQTTUsername        string        `env:"MQTT_USERNAME"`
	MQTTPassword        string        `env:"MQTT_PASSWORD"`
	CFJWKSURL           string        `env:"CF_JWKS_URL"`
	CFIssuer            string        `env:"CF_ISSUER"`
	CFAudience          string        `env:"CF_AUDIENCE"`
	SSEHeartbeatSeconds time.Duration `env:"SSE_HEARTBEAT_SECONDS" envDefault:"15s"`
	ArriveRadiusM       float64       `env:"ARRIVE_RADIUS_M" envDefault:"100"`
}

func Load() (Config, error) {
	var c Config
	if err := env.Parse(&c); err != nil {
		return Config{}, err
	}
	// Normalize allowed origins: trim spaces, drop empties
	if len(c.CORSAllowedOrigins) == 1 && c.CORSAllowedOrigins[0] == "" {
		c.CORSAllowedOrigins = nil
	} else {
		cleaned := make([]string, 0, len(c.CORSAllowedOrigins))
		for _, o := range c.CORSAllowedOrigins {
			o = strings.TrimSpace(o)
			if o != "" {
				cleaned = append(cleaned, o)
			}
		}
		c.CORSAllowedOrigins = cleaned
	}
	return c, nil
}
