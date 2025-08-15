/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_MAP_TILE_URL?: string;
    readonly VITE_MAP_ATTRIBUTION?: string;
    readonly VITE_ADMIN_POLL_MS?: string;
    readonly VITE_SSE_PATH?: string;
    readonly VITE_SESSION_PATH?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}


