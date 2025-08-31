import React from "react";
import { Trans, useLingui } from "@lingui/react/macro";

import type { CarState } from "../../api/types";
import { MetricCard } from "../MetricCard";
import { KilometersFormatter, MinutesFormatter } from "../../utils/format";

type Props = { route?: CarState["route"] };

export function RouteModule({ route }: Props) {
  const { t } = useLingui();

  const hasRoute = Boolean(route?.dest);
  const label = route?.dest_label ? t`Route • ${route.dest_label}` : t`Route`;

  return (
    <MetricCard label={label} hideValue>
      {hasRoute ? (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              <Trans>Distance</Trans>
            </span>
            <div className="whitespace-nowrap">
              <KilometersFormatter
                value={route?.dist_km}
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
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              <Trans>ETA</Trans>
            </span>
            <div className="whitespace-nowrap">
              <MinutesFormatter
                value={route?.eta_min}
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
          {route?.traffic_delay_min != null && route.traffic_delay_min > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                <Trans>Traffic delay</Trans>
              </span>
              <div className="whitespace-nowrap">
                <MinutesFormatter
                  value={route.traffic_delay_min}
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
          )}
        </div>
      ) : (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <Trans>No active route</Trans>
        </div>
      )}
    </MetricCard>
  );
}
