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

export const BatteryModule = React.memo(function BatteryModule({ socPct, powerW, historySoc, historyPower }: Props) {
  return (
    <MetricCard label={<Trans>Power</Trans>} hideValue>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex justify-center">
            <BatteryBar socPct={socPct} />
          </div>
          {historySoc && (
            <Sparkline data={historySoc} />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-center">
            <PowerBar powerW={powerW ?? 0} />
          </div>
          {historyPower && (
            <Sparkline data={historyPower} />
          )}
        </div>
      </div>
    </MetricCard>
  );
});
