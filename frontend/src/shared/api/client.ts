const DEFAULTS = {
  MAP_TILE_URL: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  MAP_ATTRIBUTION: "&copy; OpenStreetMap contributors",
  ADMIN_POLL_MS: 2000,
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
    mapTileUrl: import.meta.env.VITE_MAP_TILE_URL || DEFAULTS.MAP_TILE_URL,
    mapAttribution: import.meta.env.VITE_MAP_ATTRIBUTION || DEFAULTS.MAP_ATTRIBUTION,
    adminPollMs: Number(import.meta.env.VITE_ADMIN_POLL_MS ?? DEFAULTS.ADMIN_POLL_MS),
    ssePath: import.meta.env.VITE_SSE_PATH || DEFAULTS.SSE_PATH,
    sessionPath: import.meta.env.VITE_SESSION_PATH || DEFAULTS.SESSION_PATH,
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
