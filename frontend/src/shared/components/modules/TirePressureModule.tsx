import React from "react";

import { MetricCard } from "../MetricCard";
import { TPMSWheels } from "../TPMSWheels";

type Props = {
  fl?: number;
  fr?: number;
  rl?: number;
  rr?: number;
};

export function TirePressureModule({ fl, fr, rl, rr }: Props) {
  return (
    <MetricCard label="Tire Pressure" hideValue>
      <TPMSWheels fl={fl} fr={fr} rl={rl} rr={rr} />
    </MetricCard>
  );
}
