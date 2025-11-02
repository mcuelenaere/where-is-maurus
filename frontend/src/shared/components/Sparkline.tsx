import { Sparklines, SparklinesLine } from "react-sparklines";

import type { HistoryPoint } from "~/shared/api/types";

export function Sparkline({ data }: { data?: HistoryPoint[] }) {
  if (!data || data.length === 0) return null;
  const values = data.filter((p) => p.v != null).map((p) => Number(p.v));
  if (values.length < 2) return null;
  return (
    <div className="w-full">
      <Sparklines data={values} svgWidth={1000} svgHeight={36} style={{ maxWidth: "100%" }}>
        <SparklinesLine color="#2563eb" style={{ fill: "none" }} />
      </Sparklines>
    </div>
  );
}
