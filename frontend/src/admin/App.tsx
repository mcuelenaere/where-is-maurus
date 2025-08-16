import { useEffect, useMemo, useState } from "react";

import { getCars } from "../shared/api/admin";
import { ModulesAndMap } from "../shared/components/ModulesAndMap";
import { formatTime } from "../shared/utils/format";
import { CarSelector } from "./components/CarSelector";
import Header from "./components/Header";
import { ShareForm } from "./components/ShareForm";
import { useAdminSSE } from "./hooks/useAdminSSE";

export default function App() {
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
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load cars");
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
            {connected ? "Live" : "Connecting…"}
            {lastUpdated ? ` • Updated ${formatTime(new Date(lastUpdated))}` : ""}
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-4">
          <ModulesAndMap
            current={
              state?.location
                ? {
                    lat: state.location.lat,
                    lon: state.location.lon,
                    heading: state.location.heading,
                  }
                : undefined
            }
            dest={state?.route?.dest}
            path={state?.path_30s}
            route={state?.route}
            speedKph={state?.location?.speed_kph}
            historySpeed={state?.history_30s?.speed_kph}
            batterySoc={state?.battery?.soc_pct}
            batteryPower={state?.battery?.power_w}
            historySoc={state?.history_30s?.soc_pct}
            historyPower={state?.history_30s?.power_w}
            insideC={state?.climate?.inside_c}
            outsideC={state?.climate?.outside_c}
            historyInside={state?.history_30s?.inside_c}
            historyOutside={state?.history_30s?.outside_c}
            tpms={state?.tpms_bar}
          />
        </div>

        <div className="mt-6">
          <ShareForm carId={selectedCarId} etaMin={state?.route?.eta_min} />
        </div>
      </div>
    </div>
  );
}
