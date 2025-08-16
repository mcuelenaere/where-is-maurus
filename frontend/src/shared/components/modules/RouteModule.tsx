import React from "react";

import type { CarState } from "../../api/types";
import { MetricCard } from "../MetricCard";
import { formatKilometers } from "../../utils/format";

type Props = { route?: CarState["route"] };

export function RouteModule({ route }: Props) {
  const hasRoute = Boolean(route?.dest);
  const label = route?.dest_label ? `Route • ${route.dest_label}` : "Route";
  return (
    <MetricCard label={label} hideValue>
      {hasRoute ? (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Distance</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {route?.dist_km != null ? `${formatKilometers(route.dist_km)} km` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">ETA</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {route?.eta_min != null ? `${route.eta_min} min` : "—"}
            </span>
          </div>
          {route?.traffic_delay_min != null && route.traffic_delay_min > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Traffic delay</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {route.traffic_delay_min} min
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-gray-600 dark:text-gray-400">No active route</div>
      )}
    </MetricCard>
  );
}
