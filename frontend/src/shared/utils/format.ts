const kilometersFormatter = new Intl.NumberFormat(undefined, {
  style: "unit",
  unit: "kilometer",
  unitDisplay: "short",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

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

const celsiusFormatter = new Intl.NumberFormat(undefined, {
  style: "unit",
  unit: "celsius",
  unitDisplay: "short",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatKilometers(v?: number) {
  if (!v) return "—";

  return kilometersFormatter.format(v);
}

export function formatMinutes(v?: number) {
  if (!v) return "—";

  return minutesFormatter.format(v);
}

export function formatCelsius(v?: number) {
  if (!v) return "—";

  return celsiusFormatter.format(v);
}

export function formatTime(d: Date) {
  return timeFormatter.format(d);
}
