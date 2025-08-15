import { useMemo } from 'react';
import { MapView } from '../shared/components/MapView';
import { MetricCard } from '../shared/components/MetricCard';
import { Sparkline } from '../shared/components/Sparkline';
import { useSSE } from './hooks/useSSE';
import { formatCelsius, formatHeading, formatKilometers, formatPercent, formatPower, formatSpeedKph } from '../shared/utils/format';

export default function App() {
    const token = useMemo(() => (window.location.hash || '').replace(/^#/, '') || undefined, []);
    const { state, connected, error } = useSSE(token);
    const hasRoute = Boolean(state?.route?.dest);

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
                    <h1 className="text-lg font-semibold text-gray-900">Where is Maurus</h1>
                </div>
            </header>
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                <div className="text-sm text-gray-600 mb-2">
                    {connected ? 'Live' : 'Connecting…'} {error && <span className="text-red-600">• {error}</span>}
                </div>
                <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 min-h-[360px]">
                        <MapView
                            current={state?.location ? { lat: state.location.lat, lon: state.location.lon } : undefined}
                            dest={state?.route?.dest}
                            path={state?.path_30s}
                        />
                        {!hasRoute && (
                            <div className="text-xs text-gray-600 mt-2">No active route</div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <MetricCard label="Speed" value={formatSpeedKph(state?.location?.speed_kph)} unit="km/h">
                            <Sparkline data={state?.history_30s?.speed_kph} />
                        </MetricCard>
                        <MetricCard label="Heading" value={formatHeading(state?.location?.heading)} unit="°" />
                        <MetricCard label="Elevation" value={state?.location?.elevation_m?.toFixed(0)} unit="m" />
                        <MetricCard label="SOC" value={formatPercent(state?.battery?.soc_pct)} unit="%">
                            <Sparkline data={state?.history_30s?.soc_pct} />
                        </MetricCard>
                        <MetricCard label="Power" value={formatPower(state?.battery?.power_w)} unit="W">
                            <Sparkline data={state?.history_30s?.power_w} />
                        </MetricCard>
                        <MetricCard label="Inside" value={formatCelsius(state?.climate?.inside_c)} unit="°C">
                            <Sparkline data={state?.history_30s?.inside_c} />
                        </MetricCard>
                        <MetricCard label="Outside" value={formatCelsius(state?.climate?.outside_c)} unit="°C">
                            <Sparkline data={state?.history_30s?.outside_c} />
                        </MetricCard>
                        <MetricCard label="TPMS FL" value={state?.tpms_bar?.fl?.toFixed(2)} unit="bar">
                            <Sparkline data={state?.history_30s?.tpms_fl} />
                        </MetricCard>
                        <MetricCard label="TPMS FR" value={state?.tpms_bar?.fr?.toFixed(2)} unit="bar">
                            <Sparkline data={state?.history_30s?.tpms_fr} />
                        </MetricCard>
                        <MetricCard label="TPMS RL" value={state?.tpms_bar?.rl?.toFixed(2)} unit="bar">
                            <Sparkline data={state?.history_30s?.tpms_rl} />
                        </MetricCard>
                        <MetricCard label="TPMS RR" value={state?.tpms_bar?.rr?.toFixed(2)} unit="bar">
                            <Sparkline data={state?.history_30s?.tpms_rr} />
                        </MetricCard>
                        <MetricCard label="Dist to Dest" value={state?.route?.dist_km != null ? formatKilometers(state.route.dist_km) : undefined} unit="km" />
                        <MetricCard label="ETA" value={state?.route?.eta_min != null ? `${state.route.eta_min} min` : undefined} />
                    </div>
                </div>
            </div>
        </div>
    );
}


