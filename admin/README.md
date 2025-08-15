# Where is Maurus – Admin

Static React admin UI for previewing car state and creating share links.

## Features

- Vite + React + TypeScript
- Tailwind CSS
- React Leaflet with OSM tiles
- Polling every 2s (configurable) with basic backoff
- Zod schema validation
- 30s sparklines (react-sparklines)
- Create share: TTL, optional arrival radius, copy URL and QR code

## Environment

Create `.env` from `.env.example`:

```
VITE_API_BASE_URL=https://api.example.com
VITE_DEFAULT_TTL_HOURS=8
VITE_DEFAULT_ARRIVE_RADIUS_M=100
VITE_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_MAP_ATTRIBUTION=&copy; OpenStreetMap contributors
# optional
# VITE_SHARE_BASE_URL=https://share.example.com
```

Notes:
- If `VITE_API_BASE_URL` is omitted, the app uses relative paths and `same-origin` credentials.

## Develop

```
npm install
npm run dev
```

Open the Dev Server URL shown by Vite.

## Build

```
npm run build
```

Static assets will be in `dist/`.

## Cloudflare Access

No special headers are required. The browser will include CF Access assertions automatically when requests traverse Cloudflare to your backend.

## Backend Endpoints (reference)

- `GET /api/v1/admin/cars/:id/state` → current normalized state + 30s buffers
- `POST /api/v1/shares` with JSON body `{ car_id: number, expires_at?: string, arrive_radius_m?: number }` → `{ token: string }`

Example curl:

```
curl -sS "$VITE_API_BASE_URL/api/v1/admin/cars/1/state"

curl -sS -X POST "$VITE_API_BASE_URL/api/v1/shares" \
  -H 'content-type: application/json' \
  -d '{"car_id":1,"expires_at":"2025-01-01T00:00:00Z","arrive_radius_m":100}'
```

## License

MIT
