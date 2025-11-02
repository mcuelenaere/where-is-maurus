import React from "react";
import { useLingui } from "@lingui/react/macro";
import { PercentFormatter } from "~/shared/utils/format";

export function BatteryBar({ socPct }: { socPct?: number }) {
  const { t } = useLingui();
  const pct = socPct != null ? Math.max(0, Math.min(100, socPct)) : undefined;

  function colorFor(p: number) {
    if (p >= 60) return "bg-green-600";
    if (p >= 30) return "bg-yellow-500";
    return "bg-red-600";
  }

  return (
    <div className="flex items-center gap-3" aria-label={t`Battery state of charge`}>
      <div className="relative w-4 h-8 rounded-sm border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900">
        {/* Cap (top) */}
        <div className="absolute left-1/2 top-[-6px] h-1.5 w-3 -translate-x-1/2 rounded-sm border border-gray-300 bg-gray-200 dark:border-gray-600 dark:bg-gray-700" />
        {/* Fill (bottom-up) */}
        {pct != null && (
          <div
            className={`absolute bottom-0 left-0 w-full ${colorFor(pct)}`}
            style={{ height: `${pct}%` }}
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        )}
        {pct == null && <div className="absolute bottom-0 left-0 h-0 w-full" />}
      </div>
      <div className="text-sm whitespace-nowrap">
        <PercentFormatter
          value={pct}
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
