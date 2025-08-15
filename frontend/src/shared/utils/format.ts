export function formatSpeedKph(v?: number) {
    return v != null ? v.toFixed(0) : undefined;
}

export function formatHeading(v?: number) {
    return v != null ? v.toFixed(0) : undefined;
}

export function formatKilometers(v?: number) {
    return v != null ? v.toFixed(2) : undefined;
}

export function formatPercent(v?: number) {
    return v != null ? v.toFixed(0) : undefined;
}

export function formatPower(v?: number) {
    return v != null ? v.toFixed(0) : undefined;
}

export function formatCelsius(v?: number) {
    return v != null ? v.toFixed(1) : undefined;
}

export function formatTime(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getHours()}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}


