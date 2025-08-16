import { useEffect, useMemo, useState } from "react";

import { MapView } from "../shared/components/MapView";
import { MetricCard } from "../shared/components/MetricCard";
import { Sparkline } from "../shared/components/Sparkline";
import { Speedometer } from "../shared/components/Speedometer";
import { TPMSWheels } from "../shared/components/TPMSWheels";
import { BatteryBar } from "../shared/components/BatteryBar";
import { PowerBar } from "../shared/components/PowerBar";
import {
  formatCelsius,
  formatHeading,
  formatKilometers,
  formatPercent,
  formatSpeedKph,
  formatTime,
} from "../shared/utils/format";
import { useSSE } from "./hooks/useSSE";

export default function App() {
  const token = useMemo(() => (window.location.hash || "").replace(/^#/, "") || undefined, []);
  const { state, connected, error } = useSSE(token);
  const hasRoute = Boolean(state?.route?.dest);

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
    if (diffMs <= 0) return "Expired";

    const totalMin = Math.ceil(diffMs / 60000);
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;

    const timeFormatter = new Intl.RelativeTimeFormat(undefined, {
      style: "short",
      numeric: "auto",
    });

    if (hours > 1) {
      return `Expires ${timeFormatter.format(hours, "hour")}`;
    } else if (mins > 1) {
      return `Expires ${timeFormatter.format(mins, "minute")}`;
    } else {
      return `Expires in < 1 min`;
    }
  }, [expMs, nowMs]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Where is Maurus
          </h1>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            {connected ? "Live" : "Connecting…"}
            {lastUpdated ? ` • Updated ${formatTime(new Date(lastUpdated))}` : ""}
            {error && <span className="text-red-600"> • {error}</span>}
          </div>
          {remainingLabel && (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 px-2 py-0.5 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200">
              {remainingLabel}
            </div>
          )}
        </div>
        <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-3">
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
              path={state?.path_30s}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            <MetricCard
              label={state?.route?.dest_label ? `Route • ${state.route.dest_label}` : "Route"}
              hideValue
            >
              {hasRoute ? (
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
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-400">No active route</div>
              )}
            </MetricCard>

            <MetricCard label="Speed" hideValue>
              <div className="flex flex-col items-center">
                <Speedometer value={state?.location?.speed_kph} unit="km/h" />
                <div className="mt-2 w-full max-w-[140px]">
                  <Sparkline data={state?.history_30s?.speed_kph} />
                </div>
              </div>
            </MetricCard>

            <MetricCard label="Battery" hideValue>
              <div className="flex flex-col gap-3">
                <BatteryBar socPct={state?.battery?.soc_pct} />
                <div>
                  <PowerBar powerW={state?.battery?.power_w} />
                </div>
              </div>
            </MetricCard>

            <MetricCard label="Temp" hideValue>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Inside</span>
                  <span className="whitespace-nowrap tabular-nums font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                    {formatCelsius(state?.climate?.inside_c)} °C
                  </span>
                </div>
                <Sparkline data={state?.history_30s?.inside_c} />
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Outside</span>
                  <span className="whitespace-nowrap tabular-nums font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                    {formatCelsius(state?.climate?.outside_c)} °C
                  </span>
                </div>
                <Sparkline data={state?.history_30s?.outside_c} />
              </div>
            </MetricCard>
            <MetricCard label="Tire Pressure" hideValue>
              <TPMSWheels
                fl={state?.tpms_bar?.fl}
                fr={state?.tpms_bar?.fr}
                rl={state?.tpms_bar?.rl}
                rr={state?.tpms_bar?.rr}
              />
            </MetricCard>
          </div>
        </div>
      </div>
    </div>
  );
}
