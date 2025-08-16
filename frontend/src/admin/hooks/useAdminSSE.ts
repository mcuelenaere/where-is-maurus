import { useSSE as useSharedSSE } from "../../shared/hooks/useSSE";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const c of cookies) {
    const [k, ...rest] = c.split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export function useAdminSSE(carId: number | undefined) {
  const token = getCookie("CF_Authorization");
  const ssePath = carId
    ? `/api/v1/admin/cars/${carId}/stream${token ? `?cf_jwt=${encodeURIComponent(token)}` : ""}`
    : undefined;
  return useSharedSSE({ ssePath });
}
