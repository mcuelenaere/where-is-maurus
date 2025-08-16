import React from "react";

import type { PathPoint } from "../api/types";
import { MapView } from "./MapView";
import { RouteModule } from "./modules/RouteModule";
import { SpeedModule } from "./modules/SpeedModule";
import { BatteryModule } from "./modules/BatteryModule";
import { TempModule } from "./modules/TempModule";
import { TirePressureModule } from "./modules/TirePressureModule";

type Current = { lat: number; lon: number; heading?: number } | undefined;

export function ModulesAndMap({
  className,
  current,
  dest,
  path,
  // Modules data
  route,
  speedKph,
  historySpeed,
  batterySoc,
  batteryPower,
  historySoc,
  historyPower,
  insideC,
  outsideC,
  historyInside,
  historyOutside,
  tpms,
}: {
  className?: string;
  current: Current;
  dest?: { lat: number; lon: number };
  path?: PathPoint[];
  route?: any;
  speedKph?: number;
  historySpeed?: any;
  batterySoc?: number;
  batteryPower?: number;
  historySoc?: any;
  historyPower?: any;
  insideC?: number;
  outsideC?: number;
  historyInside?: any;
  historyOutside?: any;
  tpms?: { fl?: number; fr?: number; rl?: number; rr?: number };
}) {
  return (
    <div className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${className ?? ""}`.trim()}>
      <div className="min-h-[360px] lg:col-span-2">
        <MapView current={current} dest={dest} path={path} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
        <RouteModule route={route} />
        <SpeedModule speedKph={speedKph} history={historySpeed} />
        <BatteryModule
          socPct={batterySoc}
          powerW={batteryPower}
          historySoc={historySoc}
          historyPower={historyPower}
        />
        <TempModule
          insideC={insideC}
          outsideC={outsideC}
          historyInside={historyInside}
          historyOutside={historyOutside}
        />
        <TirePressureModule fl={tpms?.fl} fr={tpms?.fr} rl={tpms?.rl} rr={tpms?.rr} />
      </div>
    </div>
  );
}
