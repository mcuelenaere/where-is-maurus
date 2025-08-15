const DEFAULTS = {
    MAP_TILE_URL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    MAP_ATTRIBUTION: '&copy; OpenStreetMap contributors'
};

export function getEnv() {
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
    const shareBase = import.meta.env.VITE_SHARE_BASE_URL?.replace(/\/$/, '');
    if (!apiBase) {
        console.warn('VITE_API_BASE_URL not set; requests will be relative to origin.');
    }
    return {
        apiBaseUrl: apiBase,
        shareBaseUrl: shareBase,
        mapTileUrl: import.meta.env.VITE_MAP_TILE_URL || DEFAULTS.MAP_TILE_URL,
        mapAttribution: import.meta.env.VITE_MAP_ATTRIBUTION || DEFAULTS.MAP_ATTRIBUTION,
        defaultTtlHours: Number(import.meta.env.VITE_DEFAULT_TTL_HOURS ?? 8),
        defaultArriveRadiusM: Number(import.meta.env.VITE_DEFAULT_ARRIVE_RADIUS_M ?? 100)
    };
}

export async function apiFetch(path: string, init?: RequestInit) {
    const { apiBaseUrl } = getEnv();
    const url = `${apiBaseUrl || ''}${path}`;
    const res = await fetch(url, {
        credentials: 'same-origin',
        ...init,
        headers: {
            'content-type': 'application/json',
            ...(init?.headers || {})
        }
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Request failed ${res.status}: ${text || res.statusText}`);
    }
    return res;
}


