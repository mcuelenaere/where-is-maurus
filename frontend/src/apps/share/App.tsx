import { useEffect, useMemo, useState } from "react";
import { Trans, useLingui } from "@lingui/react/macro";

import { ModulesAndMap } from "~/shared/components/ModulesAndMap";
import { formatTime } from "~/shared/utils/format";
import { useSSE } from "./hooks/useSSE";

export default function App() {
  const { t, i18n } = useLingui();

  const token = useMemo(() => (window.location.hash || "").replace(/^#/, "") || undefined, []);
  const { state, connected, error } = useSSE(token);

  const lastUpdated = useMemo(
    () => (state?.ts_ms ? new Date(state.ts_ms).getTime() : undefined),
    [state?.ts_ms]
  );

  const expMs = useMemo(() => {
    if (!token) return undefined;
    const parts = token.split(".");
    if (parts.length < 2) return undefined;
    try {
      const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = JSON.parse(atob(b64));
      const expSec = json?.exp as number | undefined;
      return expSec ? expSec * 1000 : undefined;
    } catch (_) {
      return undefined;
    }
  }, [token]);

  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const remainingLabel = useMemo(() => {
    if (!expMs) return undefined;

    const diffMs = expMs - nowMs;
    if (diffMs <= 0) return t`Expired`;

    const totalMin = Math.ceil(diffMs / 60000);
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;

    const timeFormatter = new Intl.RelativeTimeFormat(i18n.locale, {
      style: "short",
      numeric: "auto",
    });

    if (hours >= 1) {
      return t`Expires ${timeFormatter.format(hours, "hour")}`;
    } else if (mins >= 1) {
      return t`Expires ${timeFormatter.format(mins, "minute")}`;
    } else {
      return t`Expires in < 1 min`;
    }
  }, [expMs, nowMs, t, i18n]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              <Trans>Where is Maurus</Trans>
            </h1>
            <a
              href="https://github.com/mcuelenaere/where-is-maurus"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors"
              aria-label="View on GitHub"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden lg:block">GitHub</span>
            </a>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            {connected ? <Trans>Live</Trans> : <Trans>Connecting…</Trans>}
            {lastUpdated ? (
              <span>
                {" "}
                • <Trans>Updated</Trans> {formatTime(new Date(lastUpdated))}
              </span>
            ) : (
              ""
            )}
            {error && <span className="text-red-600"> • {error}</span>}
          </div>
          {remainingLabel && (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 px-2 py-0.5 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200">
              {remainingLabel}
            </div>
          )}
        </div>
        <div className="mt-2">
          <ModulesAndMap state={state} />
        </div>
      </div>
    </div>
  );
}
