import React from "react";

export function BatteryBar({ socPct }: { socPct?: number }) {
  const pct = socPct != null ? Math.max(0, Math.min(100, socPct)) : undefined;

  function colorFor(p: number) {
    if (p >= 60) return "bg-green-600";
    if (p >= 30) return "bg-yellow-500";
    return "bg-red-600";
  }

  return (
    <div className="flex items-center gap-3" aria-label="Battery state of charge">
      <div className="relative h-6 w-[50%] rounded-sm border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900">
        {/* Cap */}
        <div className="absolute right-[-6px] top-1/2 h-3 w-1.5 -translate-y-1/2 rounded-sm border border-gray-300 bg-gray-200 dark:border-gray-600 dark:bg-gray-700" />
        {/* Fill */}
        {pct != null && (
          <div
            className={`h-full ${colorFor(pct)}`}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        )}
        {pct == null && <div className="h-full w-0" />}
      </div>
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {pct != null ? `${Math.round(pct)}%` : "—"}
      </div>
    </div>
  );
}
