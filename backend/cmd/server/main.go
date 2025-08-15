package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"where-is-maurus/backend/internal/auth"
	"where-is-maurus/backend/internal/config"
	httpx "where-is-maurus/backend/internal/http"
	"where-is-maurus/backend/internal/keys"
	mqttc "where-is-maurus/backend/internal/mqtt"
	"where-is-maurus/backend/internal/state"
	"where-is-maurus/backend/internal/stream"
)

func main() {
	zerolog.TimeFieldFormat = time.RFC3339Nano
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout})

	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("load config")
	}

	if lvl, err := zerolog.ParseLevel(cfg.LogLevel); err == nil {
		zerolog.SetGlobalLevel(lvl)
	} else {
		log.Warn().Str("value", cfg.LogLevel).Err(err).Msg("invalid LOG_LEVEL, using default")
	}
	log.Debug().
		Interface("cfg", cfg).
		Msg("config loaded")

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	// Keys
	keyMgr, err := keys.NewManager(ctx, cfg.KeyRotateSeconds)
	if err != nil {
		log.Fatal().Err(err).Msg("keys")
	}

	// CF validator (only if configured)
	var cfv *auth.CFValidator
	if cfg.CFJWKSURL != "" {
		cfv, err = auth.NewCFValidator(ctx, cfg.CFJWKSURL, cfg.CFIssuer, cfg.CFAudience)
		if err != nil {
			log.Fatal().Err(err).Msg("cf validator")
		}
	}

	// State and hub
	st := state.NewStore()
	hub := stream.NewHub()

	// Resampler to keep flatlines visible
	state.StartResampler(st, hub)

	// MQTT
	if cfg.MQTTBrokerURL != "" {
		client := mqttc.NewClient(cfg.MQTTBrokerURL, cfg.MQTTUsername, cfg.MQTTPassword, "where-is-maurus-backend", st, hub)
		if err := client.Connect(ctx); err != nil {
			log.Fatal().Err(err).Msg("mqtt connect")
		}
		if err := client.SubscribeAllCars(ctx); err != nil {
			log.Fatal().Err(err).Msg("mqtt subscribe all cars")
		}
	} else {
		log.Warn().Msg("mqtt disabled: missing broker url")
	}

	r := httpx.NewRouter(cfg.CORSAllowedOrigins)

	// Public routes
	pub := &httpx.PublicHandlers{Keys: keyMgr, Store: st, Hub: hub, CookieDomain: cfg.CookieDomain, Heartbeat: cfg.SSEHeartbeatSeconds}
	r.Group(func(r chi.Router) { pub.Routes(r) })

	// Admin routes
	if cfv != nil {
		adm := &httpx.AdminHandlers{CF: cfv, Keys: keyMgr, Store: st, Hub: hub, TokenTTL: cfg.TokenDefaultTTL, DefaultArriveRadiusM: cfg.ArriveRadiusM, Heartbeat: cfg.SSEHeartbeatSeconds}
		r.Group(func(r chi.Router) { adm.Routes(r) })
	} else {
		log.Warn().Msg("CF Access disabled: CF_JWKS_URL/CF_ISSUER/C F_AUDIENCE not set")
		adm := &httpx.AdminHandlers{CF: nil, Keys: keyMgr, Store: st, Hub: hub, TokenTTL: cfg.TokenDefaultTTL, DefaultArriveRadiusM: cfg.ArriveRadiusM, Heartbeat: cfg.SSEHeartbeatSeconds}
		r.Group(func(r chi.Router) { adm.Routes(r) })
	}

	srv := &http.Server{Addr: cfg.HTTPAddr, Handler: r}
	go func() {
		log.Info().Str("addr", cfg.HTTPAddr).Msg("server starting")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("listen")
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel2()
	_ = srv.Shutdown(shutdownCtx)
}
