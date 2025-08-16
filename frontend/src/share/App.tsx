import { useEffect, useMemo, useState } from "react";

import { MapView } from "../shared/components/MapView";
import { ModulesAndMap } from "../shared/components/ModulesAndMap";
import { RouteModule } from "../shared/components/modules/RouteModule";
import { SpeedModule } from "../shared/components/modules/SpeedModule";
import { BatteryModule } from "../shared/components/modules/BatteryModule";
import { TempModule } from "../shared/components/modules/TempModule";
import { TirePressureModule } from "../shared/components/modules/TirePressureModule";
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
        <div className="mt-2">
          <ModulesAndMap state={state} />
        </div>
      </div>
    </div>
  );
}
