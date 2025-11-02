import React from "react";
import { Trans } from "@lingui/react/macro";

import type { HistoryWindow } from "~/shared/api/types";
import { MetricCard } from "~/shared/components/MetricCard";
import { Sparkline } from "~/shared/components/Sparkline";
import { CelsiusFormatter } from "~/shared/utils/format";
import { MetersFormatter } from "~/shared/utils/format";
import { ThermometerIcon } from "~/shared/components/icons/ThermometerIcon";
import { ElevationIcon } from "~/shared/components/icons/ElevationIcon";

type Props = {
  insideC?: number;
  outsideC?: number;
  elevationM?: number;
  historyInside?: HistoryWindow["inside_c"];
  historyOutside?: HistoryWindow["outside_c"];
  historyElevation?: HistoryWindow["elevation_m"];
};

export const EnvironmentModule = React.memo(function EnvironmentModule({
  insideC,
  outsideC,
  elevationM,
  historyInside,
  historyOutside,
  historyElevation,
}: Props) {
  return (
    <MetricCard label={<Trans>Environment</Trans>} hideValue>
      <div className="flex flex-col gap-3">
        {/* Inside Temperature */}
        <div className="flex gap-2">
          <div className="flex items-center">
            <ThermometerIcon className="h-8 w-8 flex-shrink-0 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                <Trans>Inside</Trans>
              </span>
              <div className="whitespace-nowrap">
                <CelsiusFormatter
                  value={insideC}
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
            {historyInside && <Sparkline data={historyInside} />}
          </div>
        </div>

        {/* Outside Temperature */}
        <div className="flex gap-2">
          <div className="flex items-center">
            <ThermometerIcon className="h-8 w-8 flex-shrink-0 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                <Trans>Outside</Trans>
              </span>
              <div className="whitespace-nowrap">
                <CelsiusFormatter
                  value={outsideC}
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
            {historyOutside && <Sparkline data={historyOutside} />}
          </div>
        </div>

        {/* Elevation */}
        <div className="flex gap-2">
          <div className="flex items-center">
            <ElevationIcon className="h-8 w-8 flex-shrink-0 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                <Trans>Elevation</Trans>
              </span>
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
            {historyElevation && <Sparkline data={historyElevation} />}
          </div>
        </div>
      </div>
    </MetricCard>
  );
});
