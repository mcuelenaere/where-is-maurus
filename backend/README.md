## where-is-maurus backend

Production-ready, stateless Go service providing SSE stream of selected TeslaMate MQTT data, with admin share-token issuance protected by Cloudflare Access.

### Requirements
- Go 1.22+
- MQTT broker (e.g., mosquitto)

### Config
All via environment variables. See `.env.example`.

Key ones:
- `HTTP_ADDR` (default :8080)
- `CORS_ALLOWED_ORIGINS` comma-separated
- `COOKIE_DOMAIN`
- `MQTT_BROKER_URL` and `CAR_IDS`
- `CF_JWKS_URL`, `CF_ISSUER`, `CF_AUDIENCE` for admin endpoints

### Run locally

1) Copy env
```bash
cd backend
cp .env.example .env
```

2) Start
```bash
make build
./bin/server
# or
make run
```

3) With Docker
```bash
make docker-build
make docker-run
```

### Quick SSE test

Start server, then:
```bash
# simulate a share token creation (see below) and set session cookie
TOKEN="<paste token>"
curl -i -X POST http://localhost:8080/api/v1/session \
  -H 'Content-Type: application/json' \
  --data "{\"token\":\"$TOKEN\"}"

# then connect to SSE (cookie will be re-used if your client sends it; or paste from Set-Cookie)
curl -N -H 'Accept: text/event-stream' --cookie "wi_session=$TOKEN" http://localhost:8080/api/v1/stream
```

### Create share token (admin)

Admin endpoints require a valid Cloudflare Access JWT in `CF-Access-Jwt-Assertion` header. For local testing without CF, start without CF envs; the handler middleware becomes a no-op.

```bash
# No CF envs → middleware disabled for local dev
curl -s http://localhost:8080/api/v1/shares \
  -H 'Content-Type: application/json' \
  -d '{"car_id":1}'
# {"token":"<JWT>"}
```

Optional request fields: `expires_at` (RFC3339), `arrive_radius_m`, `dest {lat,lon}`. If destination exists in current route state, it will be embedded automatically.

### Health

```bash
curl -i http://localhost:8080/healthz
```

### Notes
- SSE only; heartbeat every `SSE_HEARTBEAT_SECONDS` (default 15s)
- Keys: in-memory ES512; rotate every `KEY_ROTATE_SECONDS`; previous key kept for overlap
- Only whitelisted TeslaMate topics are consumed (see code in `internal/mqtt`)
- No Prometheus, no metrics endpoint


