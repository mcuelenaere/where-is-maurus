import React from "react";

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
    <MetricCard label="Speed" hideValue>
      <div className="flex flex-col items-center">
        <Speedometer value={speedKph} unit="km/h" />
        <div className="mt-2 w-full max-w-[140px]">
          <Sparkline data={history} />
        </div>
      </div>
    </MetricCard>
  );
}
