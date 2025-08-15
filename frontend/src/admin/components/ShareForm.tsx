import { useEffect, useMemo, useState } from "react";

import { createShare } from "../../shared/api/admin";
import { getEnv } from "../../shared/api/client";

type Props = { carId?: number; etaMin?: number };

export function ShareForm({ carId, etaMin }: Props) {
  const { shareBaseUrl } = getEnv();
  const [ttlHours, setTtlHours] = useState<number>(4);
  const [ttlMinutes, setTtlMinutes] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [token, setToken] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (etaMin && etaMin > 0) {
      const hours = Math.floor(etaMin / 60);
      let minutes = etaMin % 60;
      if (hours === 0 && minutes === 0) {
        minutes = 1;
      }
      setTtlHours(hours);
      setTtlMinutes(minutes);
    }
  }, [etaMin]);

  const computedExpiresAt = useMemo(() => {
    const totalMinutes = (ttlHours || 0) * 60 + (ttlMinutes || 0);
    const ms = totalMinutes * 60 * 1000;
    return new Date(Date.now() + ms).toISOString();
  }, [ttlHours, ttlMinutes]);
  const isValidTTL = (ttlHours || 0) * 60 + (ttlMinutes || 0) > 0;

  const exampleUrl = token ? `${shareBaseUrl ? shareBaseUrl : ""}/#${token}` : undefined;

  const presetsMin = [15, 30, 45, 60, 120, 240, 480];
  function setTTLFromMinutes(total: number) {
    if (!Number.isFinite(total) || total <= 0) {
      setTtlHours(0);
      setTtlMinutes(0);
      return;
    }
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    setTtlHours(hours);
    setTtlMinutes(minutes);
  }
  function useETA() {
    if (etaMin && etaMin > 0) setTTLFromMinutes(etaMin);
  }

  async function onCreate() {
    if (!carId) {
      setError("Select a car first");
      return;
    }
    if (!isValidTTL) {
      setError("TTL must be at least 1 minute");
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const res = await createShare({ car_id: carId, expires_at: computedExpiresAt });
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
        <div className="flex items-center gap-2 sm:col-span-3">
          <span className="text-sm text-gray-700">TTL</span>
          <input
            type="number"
            aria-label="Hours"
            placeholder="hh"
            className="rounded-md border-gray-300 px-2 py-1 text-sm w-16"
            value={ttlHours}
            min={0}
            step={1}
            onChange={(e) => {
              const v = Number(e.target.value);
              setTtlHours(Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
            }}
          />
          <span className="text-sm text-gray-500">h</span>
          <input
            type="number"
            aria-label="Minutes"
            placeholder="mm"
            className="rounded-md border-gray-300 px-2 py-1 text-sm w-16"
            value={ttlMinutes}
            min={0}
            max={59}
            step={1}
            onChange={(e) => {
              let v = Number(e.target.value);
              if (!Number.isFinite(v) || v < 0) v = 0;
              if (v > 59) v = 59;
              setTtlMinutes(Math.floor(v));
            }}
          />
          <span className="text-sm text-gray-500">m</span>
        </div>
        {/* Only expiration is configurable */}
        <div className="sm:col-span-3">
          <div className="text-xs text-gray-600">Quick durations</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {presetsMin.map((m) => {
              const isActive = (ttlHours || 0) * 60 + (ttlMinutes || 0) === m;
              return (
                <button
                  key={m}
                  type="button"
                  className={`${
                    isActive
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  } rounded-md border px-2 py-1 text-xs`}
                  onClick={() => setTTLFromMinutes(m)}
                >
                  {m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`}
                </button>
              );
            })}
            <button
              type="button"
              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              onClick={useETA}
              disabled={!etaMin || etaMin <= 0}
              title={!etaMin || etaMin <= 0 ? "No ETA available" : "Use ETA"}
            >
              Use ETA
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onCreate}
          disabled={loading || !isValidTTL}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Share"}
        </button>
        <div className="text-xs text-gray-600">
          TTL: {ttlHours}h {ttlMinutes}m
        </div>
      </div>
      {isValidTTL && (
        <div className="mt-1 text-xs text-gray-600">
          Expires at: {new Date(computedExpiresAt).toLocaleString()}
        </div>
      )}
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
              onClick={async () => {
                if (!exampleUrl) return;
                try {
                  await navigator.clipboard.writeText(exampleUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch (_) {
                  // ignore
                }
              }}
            >
              {copied ? "Copied!" : "Copy URL"}
            </button>
            {!shareBaseUrl && (
              <span className="text-xs text-gray-500">Note: No share base URL configured</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
