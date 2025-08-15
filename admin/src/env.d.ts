/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_CAR_IDS?: string; // comma-separated numbers
    readonly VITE_DEFAULT_TTL_HOURS?: string;
    readonly VITE_DEFAULT_ARRIVE_RADIUS_M?: string;
    readonly VITE_MAP_TILE_URL?: string;
    readonly VITE_MAP_ATTRIBUTION?: string;
    readonly VITE_SHARE_BASE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}


