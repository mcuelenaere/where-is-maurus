import dayjs from "dayjs";
import { useMemo, useState } from "react";

import { createShare } from "../../shared/api/admin";
import { getEnv } from "../../shared/api/client";

export function ShareForm({ carId }: { carId?: number }) {
  const { shareBaseUrl } = getEnv();
  const [ttlHours, setTtlHours] = useState<number>(8);
  const [arriveRadiusM, setArriveRadiusM] = useState<number | "">("");
  const [expiresAt, setExpiresAt] = useState<string | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [token, setToken] = useState<string | undefined>();

  const computedExpiresAt = useMemo(() => {
    if (expiresAt) return expiresAt;
    const ms = (ttlHours || 0) * 3600 * 1000;
    return new Date(Date.now() + ms).toISOString();
  }, [ttlHours, expiresAt]);

  const exampleUrl = token
    ? `${shareBaseUrl ? shareBaseUrl : ""}/#${token}`
    : undefined;

  async function onCreate() {
    if (!carId) {
      setError("Select a car first");
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const res = await createShare({
        car_id: carId,
        expires_at: computedExpiresAt,
        arrive_radius_m: typeof arriveRadiusM === "number" ? arriveRadiusM : undefined,
      });
      setToken(res.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create share");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border bg-white p-4">
      <h2 className="text-base font-semibold text-gray-900">Create Share</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col text-sm">
          <span className="text-gray-700">TTL (hours)</span>
          <input
            type="number"
            className="mt-1 rounded-md border-gray-300"
            value={ttlHours}
            min={0}
            onChange={(e) => setTtlHours(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="text-gray-700">Arrive radius (m, optional)</span>
          <input
            type="number"
            className="mt-1 rounded-md border-gray-300"
            value={arriveRadiusM}
            min={0}
            onChange={(e) => setArriveRadiusM(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="text-gray-700">Expires at (RFC3339, optional)</span>
          <input
            type="text"
            placeholder={dayjs(computedExpiresAt).toISOString()}
            className="mt-1 rounded-md border-gray-300"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onCreate}
          disabled={loading}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Share"}
        </button>
        <div className="text-xs text-gray-600">
          Computed expires at: {dayjs(computedExpiresAt).format("YYYY-MM-DD HH:mm:ss")} UTC
        </div>
      </div>
      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {token && (
        <div className="mt-4 rounded-md border p-3">
          <div className="text-sm text-gray-700">Share URL</div>
          <div className="mt-1 break-all font-mono text-sm">{exampleUrl}</div>
          <div className="mt-2 flex items-center gap-2">
            <button
              className="rounded-md bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
              onClick={() => navigator.clipboard.writeText(exampleUrl!)}
            >
              Copy URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
