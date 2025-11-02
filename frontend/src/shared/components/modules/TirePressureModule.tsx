import React from "react";
import { Trans } from "@lingui/react/macro";

import { MetricCard } from "../MetricCard";
import { TPMSWheels } from "../TPMSWheels";

type Props = {
  fl?: number;
  fr?: number;
  rl?: number;
  rr?: number;
};

export const TirePressureModule = React.memo(function TirePressureModule({ fl, fr, rl, rr }: Props) {
  return (
    <MetricCard label={<Trans>Tire Pressure</Trans>} hideValue>
      <TPMSWheels fl={fl} fr={fr} rl={rl} rr={rr} />
    </MetricCard>
  );
});
