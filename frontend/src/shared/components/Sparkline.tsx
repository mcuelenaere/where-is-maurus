import { Sparklines, SparklinesLine, SparklinesSpots } from "react-sparklines";

import type { HistoryPoint } from "~/shared/api/types";

export function Sparkline({
  data,
  min,
  max,
}: {
  data?: HistoryPoint[];
  min?: number;
  max?: number;
}) {
  if (!data || data.length === 0) return null;
  const values = data.filter((p) => p.v != null).map((p) => Number(p.v));
  if (values.length < 2) return null;
  return (
    <div className="w-full">
      <Sparklines
        data={values}
        svgWidth={1000}
        svgHeight={36}
        style={{ maxWidth: "100%" }}
        min={min}
        max={max}
      >
        <SparklinesLine color="#2563eb" />
        <SparklinesSpots style={{ fill: "#2563eb" }} />
      </Sparklines>
    </div>
  );
}
