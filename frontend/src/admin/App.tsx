import { useEffect, useMemo, useState } from "react";

import { getCars } from "../shared/api/admin";
import type { AdminCarState, CarState } from "../shared/api/types";
import { MapView } from "../shared/components/MapView";
import { MetricCard } from "../shared/components/MetricCard";
import { Sparkline } from "../shared/components/Sparkline";
import { Speedometer } from "../shared/components/Speedometer";
import { TPMSWheels } from "../shared/components/TPMSWheels";
import {
  formatCelsius,
  formatHeading,
  formatKilometers,
  formatPercent,
  formatPower,
  formatSpeedKph,
  formatTime,
} from "../shared/utils/format";
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

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="min-h-[360px] lg:col-span-2">
            <MapView
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
            />
            {!hasRoute && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">No active route</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricCard label="Speed" hideValue>
              <div className="flex flex-col items-center">
                <Speedometer value={state?.location?.speed_kph} unit="km/h" />
                <div className="mt-2 w-full max-w-[140px]">
                  <Sparkline data={adminState?.history_30s?.speed_kph} />
                </div>
              </div>
            </MetricCard>
            <MetricCard label="Elevation" value={state?.location?.elevation_m?.toFixed(0)} unit="m">
              <Sparkline data={adminState?.history_30s?.elevation_m} />
            </MetricCard>
            <MetricCard label="SOC" value={formatPercent(state?.battery?.soc_pct)} unit="%">
              <Sparkline data={adminState?.history_30s?.soc_pct} />
            </MetricCard>
            <MetricCard label="Power" value={formatPower(state?.battery?.power_w)} unit="W">
              <Sparkline data={adminState?.history_30s?.power_w} />
            </MetricCard>
            <MetricCard label="Temp" hideValue>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Inside</span>
                  <span className="whitespace-nowrap tabular-nums font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                    {formatCelsius(state?.climate?.inside_c)} °C
                  </span>
                </div>
                <Sparkline data={adminState?.history_30s?.inside_c} />
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Outside</span>
                  <span className="whitespace-nowrap tabular-nums font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                    {formatCelsius(state?.climate?.outside_c)} °C
                  </span>
                </div>
                <Sparkline data={adminState?.history_30s?.outside_c} />
              </div>
            </MetricCard>
            <MetricCard label="TPMS" hideValue>
              <TPMSWheels
                fl={state?.tpms_bar?.fl}
                fr={state?.tpms_bar?.fr}
                rl={state?.tpms_bar?.rl}
                rr={state?.tpms_bar?.rr}
              />
            </MetricCard>
            <MetricCard
              label={state?.route?.dest_label ? `Route • ${state.route.dest_label}` : "Route"}
              hideValue
            >
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Distance</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {state?.route?.dist_km != null
                      ? `${formatKilometers(state.route.dist_km)} km`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">ETA</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {state?.route?.eta_min != null ? `${state.route.eta_min} min` : "—"}
                  </span>
                </div>
                {state?.route?.traffic_delay_min != null && state.route.traffic_delay_min > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Traffic delay</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {state.route.traffic_delay_min} min
                    </span>
                  </div>
                )}
              </div>
            </MetricCard>
          </div>
        </div>

        <div className="mt-6">
          <ShareForm carId={selectedCarId} etaMin={state?.route?.eta_min} />
        </div>
      </div>
    </div>
  );
}
