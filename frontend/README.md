# Where is Maurus – Frontend

Two React apps (Share + Admin) built with Vite + TypeScript + Tailwind.

## Apps

- Share UI (public): token in URL hash, exchanges session, connects via SSE to stream live state
- Admin UI (protected behind Cloudflare Access): preview state, create share links

## Scripts

```
npm run dev:share   # http://localhost:5173 (opens Share UI)
npm run dev:admin   # http://localhost:5174 (opens Admin UI)

npm run build:share # outputs dist/share/
npm run build:admin # outputs dist/admin/
npm run build       # builds both
npm run build:all   # builds both (alternative)

npm run preview:share # preview share build on port 4173
npm run preview:admin # preview admin build on port 4174

npm run typecheck   # TypeScript type checking
npm run lint        # ESLint linting
npm run format      # Prettier formatting
npm run format:check # Check formatting without changes
```

## Env

Copy `.env.example` to `.env`:

```
VITE_API_BASE_URL=https://api.example.com
VITE_SHARE_BASE_URL=https://share.example.com
```

## Notes

- Share UI keeps the token only in the hash. It exchanges to an HttpOnly cookie via `POST ${VITE_API_BASE_URL}/api/v1/session` with `credentials: include`, then opens `EventSource(${VITE_API_BASE_URL}/api/v1/stream, { withCredentials: true })`.
- Build outputs go to `dist/share/` and `dist/admin/` directories
- Admin UI includes PWA support with auto-update functionality
