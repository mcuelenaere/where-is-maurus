import { useEffect, useMemo, useState } from "react";

import { getCars } from "../shared/api/admin";
import type { AdminCarState, CarState } from "../shared/api/types";
import { MapView } from "../shared/components/MapView";
import { MetricCard } from "../shared/components/MetricCard";
import { Sparkline } from "../shared/components/Sparkline";
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
                state?.location ? { lat: state.location.lat, lon: state.location.lon } : undefined
              }
              dest={state?.route?.dest}
              path={adminState?.path_30s}
            />
            {!hasRoute && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">No active route</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricCard
              label="Speed"
              value={formatSpeedKph(state?.location?.speed_kph)}
              unit="km/h"
            >
              <Sparkline data={adminState?.history_30s?.speed_kph} />
            </MetricCard>
            <MetricCard label="Heading" value={formatHeading(state?.location?.heading)} unit="°" />
            <MetricCard
              label="Elevation"
              value={state?.location?.elevation_m?.toFixed(0)}
              unit="m"
            />
            <MetricCard label="SOC" value={formatPercent(state?.battery?.soc_pct)} unit="%">
              <Sparkline data={adminState?.history_30s?.soc_pct} />
            </MetricCard>
            <MetricCard label="Power" value={formatPower(state?.battery?.power_w)} unit="W">
              <Sparkline data={adminState?.history_30s?.power_w} />
            </MetricCard>
            <MetricCard label="Inside" value={formatCelsius(state?.climate?.inside_c)} unit="°C">
              <Sparkline data={adminState?.history_30s?.inside_c} />
            </MetricCard>
            <MetricCard label="Outside" value={formatCelsius(state?.climate?.outside_c)} unit="°C">
              <Sparkline data={adminState?.history_30s?.outside_c} />
            </MetricCard>
            <MetricCard label="TPMS FL" value={state?.tpms_bar?.fl?.toFixed(2)} unit="bar">
              <Sparkline data={adminState?.history_30s?.tpms_fl} />
            </MetricCard>
            <MetricCard label="TPMS FR" value={state?.tpms_bar?.fr?.toFixed(2)} unit="bar">
              <Sparkline data={adminState?.history_30s?.tpms_fr} />
            </MetricCard>
            <MetricCard label="TPMS RL" value={state?.tpms_bar?.rl?.toFixed(2)} unit="bar">
              <Sparkline data={adminState?.history_30s?.tpms_rl} />
            </MetricCard>
            <MetricCard label="TPMS RR" value={state?.tpms_bar?.rr?.toFixed(2)} unit="bar">
              <Sparkline data={adminState?.history_30s?.tpms_rr} />
            </MetricCard>
            <MetricCard
              label="Dist to Dest"
              value={
                state?.route?.dist_km != null ? formatKilometers(state.route.dist_km) : undefined
              }
              unit="km"
            />
            <MetricCard
              label="ETA"
              value={state?.route?.eta_min != null ? `${state.route.eta_min} min` : undefined}
            />
          </div>
        </div>

        <div className="mt-6">
          <ShareForm carId={selectedCarId} etaMin={state?.route?.eta_min} />
        </div>
      </div>
    </div>
  );
}
