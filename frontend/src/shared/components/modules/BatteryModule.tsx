import React from "react";
import { Trans } from "@lingui/react/macro";

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
    <MetricCard label={<Trans>Battery</Trans>} hideValue>
      <div className="flex flex-col gap-3">
        <BatteryBar socPct={socPct} />
        <div>
          <PowerBar powerW={powerW} />
        </div>
        {(historySoc || historyPower) && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <Trans>SOC</Trans>
              </div>
              <Sparkline data={historySoc} />
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <Trans>Power</Trans>
              </div>
              <Sparkline data={historyPower} />
            </div>
          </div>
        )}
      </div>
    </MetricCard>
  );
}
