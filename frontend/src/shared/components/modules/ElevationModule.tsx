import React from "react";
import { Trans } from "@lingui/react/macro";

import type { HistoryWindow } from "~/shared/api/types";
import { MetricCard } from "~/shared/components/MetricCard";
import { Sparkline } from "~/shared/components/Sparkline";
import { MetersFormatter } from "~/shared/utils/format";

type Props = {
  elevationM?: number;
  history?: HistoryWindow["elevation_m"];
};

export const ElevationModule = React.memo(function ElevationModule({ elevationM, history }: Props) {
  return (
    <MetricCard label={<Trans>Elevation</Trans>} hideValue>
      <div className="flex flex-col gap-2">
        <div className="flex justify-center text-sm">
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
        </div>
        {history && <Sparkline data={history} />}
      </div>
    </MetricCard>
  );
});
