import React, { useMemo } from "react";

const minutesFormatter = new Intl.NumberFormat(undefined, {
  style: "unit",
  unit: "minute",
  unitDisplay: "short",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  timeStyle: "medium",
});

export function formatMinutes(v?: number) {
  if (!v) return "—";

  return minutesFormatter.format(v);
}

export function formatTime(d: Date) {
  return timeFormatter.format(d);
}

function NumberFormatter({
  formatterOptions,
  value,
  renderValue,
  renderUnit,
}: {
  formatterOptions: Intl.NumberFormatOptions;
  value?: number;
  renderValue: (parts: React.ReactNode[]) => React.ReactNode;
  renderUnit: (parts: React.ReactNode[]) => React.ReactNode;
}) {
  const formatter = useMemo(
    () => new Intl.NumberFormat(undefined, formatterOptions),
    [formatterOptions]
  );

  const groups = useMemo(() => {
    if (value === undefined || value === null) return [];

    const parts = formatter.formatToParts(value);

    // Group consecutive parts by type using RLE approach
    const groups: Array<{ type: "value" | "unit"; parts: string[] }> = [];
    let currentGroup: { type: "value" | "unit"; parts: string[] } | null = null;

    for (const part of parts) {
      const isUnitPart =
        part.type === "unit" ||
        part.type === "currency" ||
        part.type === "percentSign" ||
        part.type === "compact";
      const groupType = isUnitPart ? "unit" : "value";

      if (currentGroup && currentGroup.type === groupType) {
        // Continue current group
        currentGroup.parts.push(part.value);
      } else {
        // Start new group
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = { type: groupType, parts: [part.value] };
      }
    }

    // Add the last group
    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  }, [value, formatter]);

  // Render each group using the appropriate render function
  return useMemo(() => {
    if (groups.length === 0) return <>{`—`}</>;

    return (
      <>
        {groups.map((group, index) => {
          if (group.type === "unit") {
            return <React.Fragment key={index}>{renderUnit(group.parts)}</React.Fragment>;
          } else {
            return <React.Fragment key={index}>{renderValue(group.parts)}</React.Fragment>;
          }
        })}
      </>
    );
  }, [groups, renderValue, renderUnit]);
}

export function CelsiusFormatter({
  value,
  renderValue,
  renderUnit,
}: {
  value?: number;
  renderValue: (parts: React.ReactNode[]) => React.ReactNode;
  renderUnit: (parts: React.ReactNode[]) => React.ReactNode;
}) {
  return (
    <NumberFormatter
      formatterOptions={{
        style: "unit",
        unit: "celsius",
        unitDisplay: "short",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }}
      value={value}
      renderValue={renderValue}
      renderUnit={renderUnit}
    />
  );
}

export function KilometersFormatter({
  value,
  renderValue,
  renderUnit,
}: {
  value?: number;
  renderValue: (parts: React.ReactNode[]) => React.ReactNode;
  renderUnit: (parts: React.ReactNode[]) => React.ReactNode;
}) {
  return (
    <NumberFormatter
      formatterOptions={{
        style: "unit",
        unit: "kilometer",
        unitDisplay: "short",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }}
      value={value}
      renderValue={renderValue}
      renderUnit={renderUnit}
    />
  );
}

export function MinutesFormatter({
  value,
  renderValue,
  renderUnit,
}: {
  value?: number;
  renderValue: (parts: React.ReactNode[]) => React.ReactNode;
  renderUnit: (parts: React.ReactNode[]) => React.ReactNode;
}) {
  return (
    <NumberFormatter
      formatterOptions={{
        style: "unit",
        unit: "minute",
        unitDisplay: "short",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }}
      value={value}
      renderValue={renderValue}
      renderUnit={renderUnit}
    />
  );
}

export function MetersFormatter({
  value,
  renderValue,
  renderUnit,
}: {
  value?: number;
  renderValue: (parts: React.ReactNode[]) => React.ReactNode;
  renderUnit: (parts: React.ReactNode[]) => React.ReactNode;
}) {
  return (
    <NumberFormatter
      formatterOptions={{
        style: "unit",
        unit: "meter",
        unitDisplay: "short",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }}
      value={value}
      renderValue={renderValue}
      renderUnit={renderUnit}
    />
  );
}

export function BarFormatter({
  value,
  renderValue,
  renderUnit,
}: {
  value?: number;
  renderValue: (parts: React.ReactNode[]) => React.ReactNode;
  renderUnit: (parts: React.ReactNode[]) => React.ReactNode;
}) {
  return (
    <NumberFormatter
      formatterOptions={{
        style: "unit",
        unit: "meter",
        unitDisplay: "short",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }}
      value={value}
      renderValue={renderValue}
      renderUnit={() => renderUnit(["bar"])}
    />
  );
}

export function KilowattFormatter({
  value,
  renderValue,
  renderUnit,
}: {
  value?: number;
  renderValue: (parts: React.ReactNode[]) => React.ReactNode;
  renderUnit: (parts: React.ReactNode[]) => React.ReactNode;
}) {
  return (
    <NumberFormatter
      formatterOptions={{
        style: "unit",
        unit: "meter",
        unitDisplay: "short",
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }}
      value={value}
      renderValue={renderValue}
      renderUnit={() => renderUnit(["kW"])}
    />
  );
}

export function PercentFormatter({
  value,
  renderValue,
  renderUnit,
}: {
  value?: number;
  renderValue: (parts: React.ReactNode[]) => React.ReactNode;
  renderUnit: (parts: React.ReactNode[]) => React.ReactNode;
}) {
  return (
    <NumberFormatter
      formatterOptions={{
        style: "unit",
        unit: "percent",
        unitDisplay: "short",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }}
      value={value}
      renderValue={renderValue}
      renderUnit={renderUnit}
    />
  );
}
