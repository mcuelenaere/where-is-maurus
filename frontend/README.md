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
VITE_SHARE_BASE_URL=https://share.example.com
```

## Notes

- Share UI keeps the token only in the hash. It exchanges to an HttpOnly cookie via `POST ${VITE_API_BASE_URL}/api/v1/session` with `credentials: include`, then opens `EventSource(${VITE_API_BASE_URL}/api/v1/stream, { withCredentials: true })`.
- Admin UI fetches list of cars from `/api/v1/admin/cars` and polls `/api/v1/admin/cars/:id/state`.
- OSM tiles are used with proper attribution.
- No analytics; no QR code.
