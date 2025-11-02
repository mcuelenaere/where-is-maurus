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

export const SpeedModule = React.memo(function SpeedModule({ speedKph, history }: Props) {
  return (
    <MetricCard label={<Trans>Speed</Trans>} hideValue>
      <div className="flex flex-col items-center gap-2">
        <Speedometer value={speedKph} unit="km/h" />
        {history && (
          <Sparkline data={history} />
        )}
      </div>
    </MetricCard>
  );
});
