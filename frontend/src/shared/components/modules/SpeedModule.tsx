import React from "react";
import { Trans } from "@lingui/react/macro";

import type { HistoryWindow } from "~/shared/api/types";
import { MetricCard } from "~/shared/components/MetricCard";
import { Sparkline } from "~/shared/components/Sparkline";
import { Speedometer } from "~/shared/components/Speedometer";

type Props = {
  speedKph?: number;
  history?: HistoryWindow["speed_kph"];
};

export const SpeedModule = React.memo(function SpeedModule({ speedKph, history }: Props) {
  return (
    <MetricCard label={<Trans>Speed</Trans>} hideValue>
      <div className="flex flex-col items-center gap-2">
        <Speedometer value={speedKph} unit="km/h" />
        {history && <Sparkline data={history} min={0} max={200} />}
      </div>
    </MetricCard>
  );
});
