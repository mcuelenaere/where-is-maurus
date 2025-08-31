import React from "react";
import { Trans } from "@lingui/react/macro";

import type { HistoryWindow } from "../../api/types";
import { MetricCard } from "../MetricCard";
import { Sparkline } from "../Sparkline";
import { MetersFormatter } from "../../utils/format";

type Props = {
  elevationM?: number;
  history?: HistoryWindow["elevation_m"];
};

export function ElevationModule({ elevationM, history }: Props) {
  return (
    <MetricCard label={<Trans>Elevation</Trans>} hideValue>
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="whitespace-nowrap">
          <MetersFormatter
            value={elevationM}
            renderValue={(parts) => (
              <span className="tabular-nums font-semibold text-gray-900 dark:text-gray-100">
                {parts}
              </span>
            )}
            renderUnit={(parts) => (
              <span className="font-normal text-gray-500 dark:text-gray-400">{parts}</span>
            )}
          />
        </div>
        <Sparkline data={history} />
      </div>
    </MetricCard>
  );
}
