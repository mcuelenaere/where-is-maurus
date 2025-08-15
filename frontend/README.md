# Where is Maurus – Frontend

Two React apps (Share + Admin) built with Vite + TypeScript + Tailwind.

## Apps

- Share UI (public): token in URL hash, exchanges session, connects via SSE to stream live state
- Admin UI (protected behind Cloudflare Access): preview state, create share links

## Scripts

```
npm run dev:share   # http://localhost:5173 (opens Share UI)
npm run dev:admin   # http://localhost:5174 (opens Admin UI)

npm run build:share # outputs dist-share/
npm run build:admin # outputs dist-admin/
npm run build       # builds both
```

## Env

Copy `.env.example` to `.env`:

```
VITE_API_BASE_URL=https://api.example.com
VITE_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_MAP_ATTRIBUTION=&copy; OpenStreetMap contributors
VITE_ADMIN_POLL_MS=2000
VITE_SSE_PATH=/api/v1/stream
VITE_SESSION_PATH=/api/v1/session
```

## Notes

- Share UI keeps the token only in the hash. It exchanges to an HttpOnly cookie via `POST ${VITE_API_BASE_URL}${VITE_SESSION_PATH}` with `credentials: include`, then opens `EventSource(${VITE_API_BASE_URL}${VITE_SSE_PATH}, { withCredentials: true })`.
- Admin UI fetches list of cars from `/api/v1/admin/cars` and polls `/api/v1/admin/cars/:id/state`.
- OSM tiles are used with proper attribution.
- No analytics; no QR code.
