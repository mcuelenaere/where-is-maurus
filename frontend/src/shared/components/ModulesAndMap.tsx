import React, { useMemo } from "react";
import type { SnapshotPayload } from "../api/types";
import { MapView } from "./MapView";
import { RouteModule } from "./modules/RouteModule";
import { SpeedModule } from "./modules/SpeedModule";
import { BatteryModule } from "./modules/BatteryModule";
import { TempModule } from "./modules/TempModule";
import { TirePressureModule } from "./modules/TirePressureModule";
import { ElevationModule } from "./modules/ElevationModule";

type Current = { lat: number; lon: number; heading?: number } | undefined;

export const ModulesAndMap = React.memo(function ModulesAndMap({ state }: { state?: SnapshotPayload }) {
  const current: Current = useMemo(() => {
    return state?.location
      ? {
        lat: state.location.lat,
        lon: state.location.lon,
        heading: state.location.heading,
      }
      : undefined;
  }, [state?.location?.lat, state?.location?.lon, state?.location?.heading]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="min-h-[360px] lg:col-span-2">
        <MapView
          current={current}
          dest={state?.route?.dest}
          path={state?.path_30s}
          speedKph={state?.location?.speed_kph}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
        <RouteModule route={state?.route} />
        <SpeedModule
          speedKph={state?.location?.speed_kph}
          history={state?.history_30s?.speed_kph}
        />
        <BatteryModule
          socPct={state?.battery?.soc_pct}
          powerW={state?.battery?.power_w}
          historySoc={state?.history_30s?.soc_pct}
          historyPower={state?.history_30s?.power_w}
        />
        <TempModule
          insideC={state?.climate?.inside_c}
          outsideC={state?.climate?.outside_c}
          historyInside={state?.history_30s?.inside_c}
          historyOutside={state?.history_30s?.outside_c}
        />
        <TirePressureModule
          fl={state?.tpms_bar?.fl}
          fr={state?.tpms_bar?.fr}
          rl={state?.tpms_bar?.rl}
          rr={state?.tpms_bar?.rr}
        />
        <ElevationModule
          elevationM={state?.location?.elevation_m}
          history={state?.history_30s?.elevation_m}
        />
      </div>
    </div>
  );
});
