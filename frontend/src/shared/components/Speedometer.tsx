import { useMemo } from "react";
import { useLingui } from "@lingui/react/macro";

export function Speedometer({
  value,
  max = 200,
  width = 160,
  unit = "km/h",
}: {
  value?: number;
  max?: number;
  width?: number;
  unit?: string;
}) {
  const { t } = useLingui();
  const radius = 70;
  const strokeWidth = 12;
  const height = Math.ceil(radius + strokeWidth * 1.5);
  const viewBoxWidth = radius * 2 + strokeWidth * 2;
  const viewBoxHeight = radius + strokeWidth * 2;

  const { arcLength, dashArray } = useMemo(() => {
    const clamped = Math.max(0, Math.min(max, value ?? 0));
    const fraction = max > 0 ? clamped / max : 0;
    const length = Math.PI * radius;
    return {
      arcLength: length,
      dashArray: `${(fraction * length).toFixed(1)} ${length.toFixed(1)}`,
    };
  }, [value, max]);

  // Semi-circle path from left to right (top arc)
  const d = useMemo(() => {
    const cx = radius + strokeWidth;
    const cy = radius + strokeWidth;
    const startX = cx - radius;
    const startY = cy;
    const endX = cx + radius;
    const endY = cy;
    return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
  }, [radius, strokeWidth]);

  return (
    <div className="flex w-full items-center justify-center">
      <svg
        width={width}
        height={(width / (viewBoxWidth || 1)) * viewBoxHeight}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        role="img"
        aria-label={t`Speedometer`}
      >
        <path
          d={d}
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-700"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={d}
          stroke="currentColor"
          className="text-blue-600 dark:text-blue-500"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={0}
        />
        {/* Current value inside the gauge */}
        <g className="fill-gray-900 dark:fill-gray-100" textAnchor="middle">
          <text
            x={radius + strokeWidth}
            y={strokeWidth + radius * 0.72}
            fontSize="18"
            fontWeight="600"
          >
            {value != null ? Math.round(value) : "—"}
          </text>
          <text x={radius + strokeWidth} y={strokeWidth + radius * 0.72 + 12} fontSize="14">
            {unit}
          </text>
        </g>
        {/* Min/Max labels */}
        <g fontSize="10" className="fill-gray-500 dark:fill-gray-400">
          <text x={strokeWidth} y={viewBoxHeight - 4} textAnchor="start">
            0
          </text>
          <text x={viewBoxWidth - strokeWidth} y={viewBoxHeight - 4} textAnchor="end">
            {max}
          </text>
        </g>
      </svg>
    </div>
  );
}
