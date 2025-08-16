import React from "react";
import { Trans } from "@lingui/react/macro";

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
    <MetricCard label={<Trans>Temp</Trans>} hideValue>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            <Trans>Inside</Trans>
          </span>
          <span className="whitespace-nowrap tabular-nums font-semibold text-gray-900 dark:text-gray-100">
            {formatCelsius(insideC)} °C
          </span>
          <Sparkline data={historyInside} />
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            <Trans>Outside</Trans>
          </span>
          <span className="whitespace-nowrap tabular-nums font-semibold text-gray-900 dark:text-gray-100">
            {formatCelsius(outsideC)} °C
          </span>
          <Sparkline data={historyOutside} />
        </div>
      </div>
    </MetricCard>
  );
}
