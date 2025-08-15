## API Reference

Base URL: default `http://localhost:8080`

### Public

- POST `/api/v1/session`
  - Body: `{ "token": "<share-jwt>" }`
  - Sets cookie `wi_session` (HttpOnly, Secure, SameSite=Strict, Domain from env) expiring with the token.
  - Response: `{ "ok": true }`

- GET `/api/v1/stream`
  - Auth: Cookie `wi_session`
  - SSE events:
    - `snapshot`: full state and last 30s series
    - `delta`: only changed subtrees with `ts_ms`
    - `heartbeat`: `{ server_time: RFC3339Nano }` every `SSE_HEARTBEAT_SECONDS`
  - Example `snapshot` data object:
```json
{
  "ts_ms": 1710000000000,
  "location": {"lat": 51.0, "lon": 4.0, "speed_kph": 50, "heading": 180, "elevation_m": 12},
  "battery": {"soc_pct": 77, "power_w": -1200},
  "climate": {"inside_c": 21, "outside_c": 17},
  "tpms_bar": {"fl": 2.6, "fr": 2.6, "rl": 2.7, "rr": 2.7},
  "route": {"dest": {"lat": 51.1, "lon": 4.1}, "eta_min": 25, "dist_km": 12.3},
  "history_30s": {
    "speed_kph": [{"ts_ms": 1710000000000, "v": 50}],
    "heading": [{"ts_ms": 1710000000000, "v": 180}],
    "elevation_m": [],
    "soc_pct": [],
    "power_w": [],
    "inside_c": [],
    "outside_c": [],
    "tpms_fl": [], "tpms_fr": [], "tpms_rl": [], "tpms_rr": []
  },
  "path_30s": [{"ts_ms": 1710000000000, "lat": 51.0, "lon": 4.0}]
}
```

- GET `/healthz`
  - 200 OK when healthy

### Admin

Admin endpoints require Cloudflare Access JWT (`CF-Access-Jwt-Assertion`) in production. If CF envs are not set, the middleware is disabled for local development; requests are accepted without the header, and the server logs a warning.

- POST `/api/v1/shares`
  - Headers (prod): `CF-Access-Jwt-Assertion: <JWT>`
  - Body:
```json
{
  "car_id": 1,
  "expires_at": "2025-12-31T23:59:59Z", // optional RFC3339
  "arrive_radius_m": 100,                 // optional
  "dest": { "lat": 51.1, "lon": 4.1 }  // optional; auto-filled from active route if present
}
```
  - Response: `{ "token": "<share-jwt>" }`

- GET `/api/v1/admin/cars/{id}/state`
  - Headers (prod): `CF-Access-Jwt-Assertion: <JWT>`
  - Response: `{ state: <CarState>, history_30s: <HistoryWindow> }`

### Tokens

- Share token (JWT ES512)
  - Header: `kid` set; signed by rotating in-memory keys
  - Claims:
    - `iss`: `where-is-maurus`
    - `aud`: `share`
    - `iat`, `exp`, `jti`
    - `car_id`: number
    - `dest` (optional): `{ lat, lon, arrive_radius_m }`

### Errors

Consistent shape: `{ "error": "...", "code": "..." }`

### CORS

Configured via `CORS_ALLOWED_ORIGINS`. Credentials are allowed for cookie-based SSE.


