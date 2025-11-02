import React, { useMemo } from "react";
import { Trans } from "@lingui/react/macro";

import type { HistoryWindow } from "~/shared/api/types";
import { MetricCard } from "~/shared/components/MetricCard";
import { Sparkline } from "~/shared/components/Sparkline";
import { PercentFormatter, KilowattFormatter } from "~/shared/utils/format";

type Props = {
  socPct?: number;
  powerW?: number;
  historySoc?: HistoryWindow["soc_pct"];
  historyPower?: HistoryWindow["power_w"];
};

export const EnergyModule = React.memo(function EnergyModule({
  socPct,
  powerW,
  historySoc,
  historyPower,
}: Props) {
  return (
    <MetricCard label={<Trans>Energy</Trans>} hideValue>
      <div className="flex flex-col gap-3">
        {/* Battery SOC */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <BatteryBarVisualization socPct={socPct} />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                <Trans>Battery</Trans>
              </span>
              <div className="whitespace-nowrap">
                <BatteryBarText socPct={socPct} />
              </div>
            </div>
            {historySoc && <Sparkline data={historySoc} min={0} max={100} />}
          </div>
        </div>

        {/* Power */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <PowerBarVisualization powerW={powerW ?? 0} />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                <Trans>Power</Trans>
              </span>
              <div className="whitespace-nowrap">
                <PowerBarText powerW={powerW ?? 0} />
              </div>
            </div>
            {historyPower && <Sparkline data={historyPower} min={-100} max={320} />}
          </div>
        </div>
      </div>
    </MetricCard>
  );
});

// Extract visualization parts
function BatteryBarVisualization({ socPct }: { socPct?: number }) {
  const pct = socPct != null ? Math.max(0, Math.min(100, socPct)) : undefined;

  function colorFor(p: number) {
    if (p >= 60) return "bg-green-600";
    if (p >= 30) return "bg-yellow-500";
    return "bg-red-600";
  }

  return (
    <div className="relative w-4 h-12 rounded-sm border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900">
      <div className="absolute left-1/2 top-[-6px] h-1.5 w-3 -translate-x-1/2 rounded-sm border border-gray-300 bg-gray-200 dark:border-gray-600 dark:bg-gray-700" />
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
  );
}

function BatteryBarText({ socPct }: { socPct?: number }) {
  const pct = socPct != null ? Math.max(0, Math.min(100, socPct)) : undefined;

  return (
    <PercentFormatter
      value={pct}
      renderValue={(parts) => (
        <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">{parts}</span>
      )}
      renderUnit={(parts) => (
        <span className="font-normal text-gray-500 dark:text-gray-400">{parts}</span>
      )}
    />
  );
}

const MAX_VALUE = 320;
const MIN_VALUE = -100;

function PowerBarVisualization({ powerW }: { powerW: number }) {
  const { upFrac, downFrac } = useMemo(() => {
    const up = powerW > 0 ? Math.min(1, powerW / MAX_VALUE) : 0;
    const down = powerW < 0 ? Math.min(1, Math.abs(powerW / MIN_VALUE)) : 0;
    return { upFrac: up, downFrac: down };
  }, [powerW]);

  return (
    <div className="relative h-16 w-4 rounded-sm bg-gray-200 dark:bg-gray-700">
      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gray-400/70" />
      <div
        className="absolute bottom-1/2 left-0 w-full bg-gray-800 dark:bg-gray-200"
        style={{ height: `${upFrac * 50}%` }}
      />
      <div
        className="absolute top-1/2 left-0 w-full bg-green-400 dark:bg-green-300"
        style={{ height: `${downFrac * 50}%` }}
      />
    </div>
  );
}

function PowerBarText({ powerW }: { powerW: number }) {
  return (
    <KilowattFormatter
      value={powerW}
      renderValue={(parts) => (
        <span className="font-semibold tabular-nums w-[4ch] inline-block text-right text-gray-900 dark:text-gray-100">
          {parts}
        </span>
      )}
      renderUnit={(parts) => (
        <span className="font-normal text-gray-500 dark:text-gray-400">{parts}</span>
      )}
    />
  );
}
