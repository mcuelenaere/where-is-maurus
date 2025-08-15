const DEFAULTS = {
  MAP_TILE_URL: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
  MAP_ATTRIBUTION: "&copy; Stadia Maps",
  MAP_TILE_URL_DARK: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
  MAP_ATTRIBUTION_DARK: "&copy; Stadia Maps",
  SSE_PATH: "/api/v1/stream",
  SESSION_PATH: "/api/v1/session",
};

export function getEnv() {
  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
  if (!apiBase) {
    console.warn("VITE_API_BASE_URL not set; requests will be relative to origin.");
  }
  return {
    apiBaseUrl: apiBase,
    mapTileUrl: DEFAULTS.MAP_TILE_URL,
    mapAttribution: DEFAULTS.MAP_ATTRIBUTION,
    mapTileUrlDark: import.meta.env.VITE_MAP_TILE_URL_DARK || DEFAULTS.MAP_TILE_URL_DARK,
    mapAttributionDark: import.meta.env.VITE_MAP_ATTRIBUTION_DARK || DEFAULTS.MAP_ATTRIBUTION_DARK,
    shareBaseUrl: import.meta.env.VITE_SHARE_BASE_URL?.replace(/\/$/, ""),
    ssePath: DEFAULTS.SSE_PATH,
    sessionPath: DEFAULTS.SESSION_PATH,
  };
}

export async function apiFetch(path: string, init?: RequestInit) {
  const { apiBaseUrl } = getEnv();
  const url = `${apiBaseUrl || ""}${path}`;
  const res = await fetch(url, {
    credentials: "same-origin",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed ${res.status}: ${text || res.statusText}`);
  }
  return res;
}
