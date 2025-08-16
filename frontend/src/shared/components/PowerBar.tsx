import React, { useMemo } from "react";
import { useLingui } from "@lingui/react/macro";

// Visual power bar similar to Tesla: center is 0, up is positive (red), down is negative (green)
// max positive ~320 kW, min negative ~-100 kW
export function PowerBar({ powerW }: { powerW?: number }) {
  const { t } = useLingui();
  // Convert to kW for scale and display
  const powerKW = (powerW ?? 0) / 1000;

  const { upFrac, downFrac } = useMemo(() => {
    const posMax = 320; // kW
    const negMin = -100; // kW
    const p = powerKW;
    const up = p > 0 ? Math.min(1, p / posMax) : 0;
    const down = p < 0 ? Math.min(1, Math.abs(p / negMin)) : 0; // negMin is negative
    return { upFrac: up, downFrac: down };
  }, [powerKW]);

  const label = useMemo(() => {
    if (powerW == null) return "—";
    const v = powerKW;
    const sign = v > 0 ? "" : ""; // keep sign via rounding below
    const rounded = Math.round(v);
    return `${sign}${rounded}`;
  }, [powerKW, powerW]);

  return (
    <div className="flex items-center gap-3" aria-label={t`Power`}>
      <div className="relative h-32 w-4 rounded-sm bg-gray-200 dark:bg-gray-700">
        {/* Center zero line */}
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gray-400/70" />
        {/* Positive (up) */}
        <div
          className="absolute bottom-1/2 left-0 w-full bg-red-600"
          style={{ height: `${upFrac * 50}%` }}
        />
        {/* Negative (down) */}
        <div
          className="absolute top-1/2 left-0 w-full bg-green-600"
          style={{ height: `${downFrac * 50}%` }}
        />
      </div>
      <div className="text-sm font-semibold whitespace-nowrap tabular-nums text-gray-900 dark:text-gray-100">
        {label} <span className="font-normal text-gray-500 dark:text-gray-400">kW</span>
      </div>
    </div>
  );
}
