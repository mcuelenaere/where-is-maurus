import { useEffect, useMemo, useState } from "react";
import { Trans, useLingui } from "@lingui/react/macro";

import { getCars } from "../shared/api/admin";
import { ModulesAndMap } from "../shared/components/ModulesAndMap";
import { formatTime } from "../shared/utils/format";
import { CarSelector } from "./components/CarSelector";
import Header from "./components/Header";
import { ShareForm } from "./components/ShareForm";
import { useAdminSSE } from "./hooks/useAdminSSE";

export default function App() {
  const { t } = useLingui();

  const [carIds, setCarIds] = useState<number[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const ids = await getCars();
        if (!cancelled) {
          setCarIds(ids);
          if (ids.length > 0) setSelectedCarId((prev) => prev ?? ids[0]);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t`Failed to load cars`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { state, connected, error: sseError } = useAdminSSE(selectedCarId);
  const lastUpdated = useMemo(
    () => (state?.ts_ms ? new Date(state.ts_ms).getTime() : undefined),
    [state?.ts_ms]
  );
  useEffect(() => {
    if (sseError) setError(sseError);
    else setError(undefined);
  }, [sseError]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CarSelector carIds={carIds} value={selectedCarId} onChange={setSelectedCarId} />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {connected ? <Trans>Live</Trans> : <Trans>Connecting…</Trans>}
            {lastUpdated ? (
              <span>
                {" "}
                • <Trans>Updated</Trans> {formatTime(new Date(lastUpdated))}
              </span>
            ) : (
              ""
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-4">
          <ModulesAndMap state={state} />
        </div>

        <div className="mt-6">
          <ShareForm carId={selectedCarId} etaMin={state?.route?.eta_min} />
        </div>
      </div>
    </div>
  );
}
