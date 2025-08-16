import { useEffect, useMemo, useState } from "react";

import { getCars } from "../shared/api/admin";
import type { AdminCarState, CarState } from "../shared/api/types";
import { ModulesAndMap } from "../shared/components/ModulesAndMap";
import { formatHeading, formatTime } from "../shared/utils/format";
import { CarSelector } from "./components/CarSelector";
import Header from "./components/Header";
import { ShareForm } from "./components/ShareForm";
import { useAdminSSE } from "./hooks/useAdminSSE";

export default function App() {
  const [carIds, setCarIds] = useState<number[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<number | undefined>(undefined);
  const [adminState, setAdminState] = useState<AdminCarState | undefined>();
  const [state, setState] = useState<CarState | undefined>();
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

  const { state: sseState, connected, error: sseError } = useAdminSSE(selectedCarId);
  const lastUpdated = useMemo(
    () => (sseState?.ts_ms ? new Date(sseState.ts_ms).getTime() : undefined),
    [sseState?.ts_ms]
  );
  useEffect(() => {
    if (sseError) setError(sseError);
    else setError(undefined);
  }, [sseError]);
  useEffect(() => {
    if (!sseState) return;
    setState(sseState);
    setAdminState({
      state: sseState,
      history_30s: sseState.history_30s,
      path_30s: sseState.path_30s,
    });
  }, [sseState]);

  const hasRoute = Boolean(state?.route?.dest);

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
            path={adminState?.path_30s}
            route={state?.route}
            speedKph={state?.location?.speed_kph}
            historySpeed={adminState?.history_30s?.speed_kph}
            batterySoc={state?.battery?.soc_pct}
            batteryPower={state?.battery?.power_w}
            historySoc={adminState?.history_30s?.soc_pct}
            historyPower={adminState?.history_30s?.power_w}
            insideC={state?.climate?.inside_c}
            outsideC={state?.climate?.outside_c}
            historyInside={adminState?.history_30s?.inside_c}
            historyOutside={adminState?.history_30s?.outside_c}
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
