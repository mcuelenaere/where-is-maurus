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
    <MetricCard label={<Trans>Power</Trans>} hideValue>
      <div className="flex flex-col gap-3">
        <div className="flex flex-row gap-2">
          <div>
            <BatteryBar socPct={socPct} />
          </div>
          {historySoc && (
            <div className="self-center">
              <Sparkline data={historySoc} />
            </div>
          )}
        </div>
        <div className="flex flex-row gap-2">
          <PowerBar powerW={powerW ?? 0} />
          {historyPower && (
            <div className="self-center">
              <Sparkline data={historyPower} />
            </div>
          )}
        </div>
      </div>
    </MetricCard>
  );
}
