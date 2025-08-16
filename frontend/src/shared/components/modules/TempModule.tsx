import React from "react";

import type { HistoryWindow } from "../../api/types";
import { MetricCard } from "../MetricCard";
import { Sparkline } from "../Sparkline";
import { formatCelsius } from "../../utils/format";

type Props = {
  insideC?: number;
  outsideC?: number;
  historyInside?: HistoryWindow["inside_c"];
  historyOutside?: HistoryWindow["outside_c"];
};

export function TempModule({ insideC, outsideC, historyInside, historyOutside }: Props) {
  return (
    <MetricCard label="Temp" hideValue>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Inside</span>
          <span className="whitespace-nowrap tabular-nums font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
            {formatCelsius(insideC)} °C
          </span>
        </div>
        <Sparkline data={historyInside} />
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Outside</span>
          <span className="whitespace-nowrap tabular-nums font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
            {formatCelsius(outsideC)} °C
          </span>
        </div>
        <Sparkline data={historyOutside} />
      </div>
    </MetricCard>
  );
}
