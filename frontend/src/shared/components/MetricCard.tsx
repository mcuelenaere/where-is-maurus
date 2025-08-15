import { type ReactNode } from "react";

export function MetricCard({
  label,
  value,
  unit,
  children,
}: {
  label: string;
  value?: string | number;
  unit?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-md border bg-white p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-gray-900">
        {value ?? "—"} {unit && <span className="text-sm font-normal text-gray-500">{unit}</span>}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
