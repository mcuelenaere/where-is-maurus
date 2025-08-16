import { type ReactNode } from "react";

export function MetricCard({
  label,
  value,
  unit,
  children,
  hideValue = false,
}: {
  label: ReactNode;
  value?: string | number;
  unit?: string;
  children?: ReactNode;
  hideValue?: boolean;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      {!hideValue && (
        <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {value ?? "—"}{" "}
          {unit && (
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{unit}</span>
          )}
        </div>
      )}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
