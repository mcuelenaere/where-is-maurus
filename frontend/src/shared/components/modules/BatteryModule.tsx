import React from "react";

import type { HistoryWindow } from "../../api/types";
import { MetricCard } from "../MetricCard";
import { Sparkline } from "../Sparkline";
import { BatteryBar } from "../BatteryBar";
import { PowerBar } from "../PowerBar";

type Props = {
  socPct?: number;
  powerW?: number;
  historySoc?: HistoryWindow["soc_pct"];
  historyPower?: HistoryWindow["power_w"];
};

export function BatteryModule({ socPct, powerW, historySoc, historyPower }: Props) {
  return (
    <MetricCard label="Battery" hideValue>
      <div className="flex flex-col gap-3">
        <BatteryBar socPct={socPct} />
        <div>
          <PowerBar powerW={powerW} />
        </div>
        {(historySoc || historyPower) && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400">SOC</div>
              <Sparkline data={historySoc} />
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Power</div>
              <Sparkline data={historyPower} />
            </div>
          </div>
        )}
      </div>
    </MetricCard>
  );
}
