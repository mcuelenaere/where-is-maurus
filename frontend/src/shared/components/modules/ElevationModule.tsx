import React from "react";
import { Trans } from "@lingui/react/macro";

import type { HistoryWindow } from "../../api/types";
import { MetricCard } from "../MetricCard";
import { Sparkline } from "../Sparkline";

type Props = {
  elevationM?: number;
  history?: HistoryWindow["elevation_m"];
};

export function ElevationModule({ elevationM, history }: Props) {
  return (
    <MetricCard label={<Trans>Elevation</Trans>} hideValue>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="whitespace-nowrap tabular-nums font-semibold text-gray-900 dark:text-gray-100">
          {elevationM != null ? Math.round(elevationM) : "—"} {elevationM != null ? "m" : ""}
        </span>
        <Sparkline data={history} />
      </div>
    </MetricCard>
  );
}
