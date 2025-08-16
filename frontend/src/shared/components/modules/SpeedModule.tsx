import React from "react";
import { Trans } from "@lingui/react/macro";

import type { HistoryWindow } from "../../api/types";
import { MetricCard } from "../MetricCard";
import { Sparkline } from "../Sparkline";
import { Speedometer } from "../Speedometer";

type Props = {
  speedKph?: number;
  history?: HistoryWindow["speed_kph"];
};

export function SpeedModule({ speedKph, history }: Props) {
  return (
    <MetricCard label={<Trans>Speed</Trans>} hideValue>
      <div className="flex flex-col items-center gap-2">
        <Speedometer value={speedKph} unit="km/h" />
        <div className="w-full flex flex-col items-center">
          <Sparkline data={history} />
        </div>
      </div>
    </MetricCard>
  );
}
