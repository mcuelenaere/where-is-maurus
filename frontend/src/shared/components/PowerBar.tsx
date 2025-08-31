import React, { useMemo } from "react";
import { useLingui } from "@lingui/react/macro";
import { KilowattFormatter } from "../utils/format";

const MAX_VALUE = 320; // W
const MIN_VALUE = -100; // W

// Visual power bar similar to Tesla: center is 0, up is positive (red), down is negative (green)
// max positive ~320 W, min negative ~-100 W
export function PowerBar({ powerW }: { powerW: number }) {
  const { t } = useLingui();

  const { upFrac, downFrac } = useMemo(() => {
    const up = powerW > 0 ? Math.min(1, powerW / MAX_VALUE) : 0;
    const down = powerW < 0 ? Math.min(1, Math.abs(powerW / MIN_VALUE)) : 0; // negMin is negative
    return { upFrac: up, downFrac: down };
  }, [powerW]);

  return (
    <div className="flex items-center gap-3" aria-label={t`Power`}>
      <div className="relative h-16 w-4 rounded-sm bg-gray-200 dark:bg-gray-700">
        {/* Center zero line */}
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gray-400/70" />
        {/* Positive (up) */}
        <div
          className="absolute bottom-1/2 left-0 w-full bg-gray-800 dark:bg-gray-200"
          style={{ height: `${upFrac * 50}%` }}
        />
        {/* Negative (down) */}
        <div
          className="absolute top-1/2 left-0 w-full bg-green-400 dark:bg-green-300"
          style={{ height: `${downFrac * 50}%` }}
        />
      </div>
      <div className="text-sm whitespace-nowrap">
        <KilowattFormatter
          value={powerW}
          renderValue={(parts) => (
            <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {parts}
            </span>
          )}
          renderUnit={(parts) => (
            <span className="font-normal text-gray-500 dark:text-gray-400">{parts}</span>
          )}
        />
      </div>
    </div>
  );
}
