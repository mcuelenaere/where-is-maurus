export function formatKilometers(v?: number) {
  return v != null ? v.toFixed(2) : undefined;
}

export function formatCelsius(v?: number) {
  return v != null ? v.toFixed(1) : undefined;
}

export function formatTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getHours()}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
