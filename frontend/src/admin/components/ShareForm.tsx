import { useMemo, useState } from "react";
import { Trans, useLingui } from "@lingui/react/macro";

import { createShare } from "../../shared/api/admin";
import { getEnv } from "../../shared/api/client";
import { DurationSelector } from "./DurationSelector";

type Props = { carId?: number; etaMin?: number };

export function ShareForm({ carId, etaMin }: Props) {
  const { t } = useLingui();

  const { shareBaseUrl } = getEnv();
  const [ttlDays, setTtlDays] = useState<number>(0);
  const [ttlHours, setTtlHours] = useState<number>(4);
  const [ttlMinutes, setTtlMinutes] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [token, setToken] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);

  const computedExpiresAt = useMemo(() => {
    const totalMinutes = (ttlDays || 0) * 24 * 60 + (ttlHours || 0) * 60 + (ttlMinutes || 0);
    const date = new Date(Date.now() + totalMinutes * 60 * 1000);
    date.setSeconds(0);
    return date.toISOString();
  }, [ttlDays, ttlHours, ttlMinutes]);

  const exampleUrl = token ? `${shareBaseUrl ? shareBaseUrl : ""}/#${token}` : undefined;

  function handleDurationChange(days: number, hours: number, minutes: number) {
    setTtlDays(days);
    setTtlHours(hours);
    setTtlMinutes(minutes);
  }

  async function onCreate() {
    if (!carId) {
      setError(t`Select a car first`);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const res = await createShare({ car_id: carId, expires_at: computedExpiresAt });
      setToken(res.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : t`Failed to create share`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
        <Trans>Create shareable link</Trans>
      </h2>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-none">
          <DurationSelector etaMin={etaMin} onDurationChange={handleDurationChange} />
          <div className="mt-3 flex flex-col items-start gap-2">
            <button
              onClick={onCreate}
              disabled={loading}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Trans>Creating…</Trans> : <Trans>Create link</Trans>}
            </button>
          </div>
          {error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}
        </div>
        <div className="grow">
          {token && (
            <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <Trans>Share link</Trans>
              </div>
              <div className="mt-1 break-all font-mono text-sm dark:text-gray-100">
                {exampleUrl}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  className="rounded-md bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
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
                  {copied ? <Trans>Copied!</Trans> : <Trans>Copy URL</Trans>}
                </button>
                {!shareBaseUrl && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    <Trans>Note: No share base URL configured</Trans>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
