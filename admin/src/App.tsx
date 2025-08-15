import { useEffect, useMemo, useState } from 'react';
import { CarSelector } from './components/CarSelector';
import { MapView } from './components/MapView';
import { MetricCard } from './components/MetricCard';
import { Sparkline } from './components/Sparkline';
import { ShareForm } from './components/ShareForm';
import Header from './components/Header';
import { usePolling } from './hooks/usePolling';
import { getCarState, getCars } from './api/admin';
import type { AdminCarState, CarState } from './api/types';
import { formatCelsius, formatHeading, formatKilometers, formatPercent, formatPower, formatSpeedKph, formatTime } from './utils/format';

const POLL_MS_DEFAULT = 2000;

export default function App() {
    const [carIds, setCarIds] = useState<number[]>([]);
    const [selectedCarId, setSelectedCarId] = useState<number | undefined>(undefined);
    const [adminState, setAdminState] = useState<AdminCarState | undefined>();
    const [state, setState] = useState<CarState | undefined>();
    const [error, setError] = useState<string | undefined>();

    const pollMs = POLL_MS_DEFAULT;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const ids = await getCars();
                if (!cancelled) {
                    setCarIds(ids);
                    if (ids.length > 0) setSelectedCarId((prev) => prev ?? ids[0]);
                }
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load cars');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const { isPolling, lastUpdated } = usePolling(async () => {
        if (!selectedCarId) return;
        try {
            const res = await getCarState(selectedCarId);
            setAdminState(res);
            setState(res.state);
            setError(undefined);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to fetch state');
        }
    }, pollMs, [selectedCarId]);

    const hasRoute = Boolean(state?.route?.dest);

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CarSelector carIds={carIds} value={selectedCarId} onChange={setSelectedCarId} />
                    <div className="text-sm text-gray-600">
                        {isPolling ? 'Polling…' : 'Idle'}{lastUpdated ? ` • Updated ${formatTime(new Date(lastUpdated))}` : ''}
                    </div>
                </div>

                {error && (
                    <div className="mt-3 rounded-md bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
                        {error}
                    </div>
                )}

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                            <Sparkline data={adminState?.history_30s?.speed_kph} />
                        </MetricCard>
                        <MetricCard label="Heading" value={formatHeading(state?.location?.heading)} unit="°" />
                        <MetricCard label="Elevation" value={state?.location?.elevation_m?.toFixed(0)} unit="m" />
                        <MetricCard label="SOC" value={formatPercent(state?.battery?.soc_pct)} unit="%">
                            <Sparkline data={adminState?.history_30s?.soc_pct} />
                        </MetricCard>
                        <MetricCard label="Power" value={formatPower(state?.battery?.power_w)} unit="W">
                            <Sparkline data={adminState?.history_30s?.power_w} />
                        </MetricCard>
                        <MetricCard label="Inside" value={formatCelsius(state?.climate?.inside_c)} unit="°C">
                            <Sparkline data={adminState?.history_30s?.inside_c} />
                        </MetricCard>
                        <MetricCard label="Outside" value={formatCelsius(state?.climate?.outside_c)} unit="°C">
                            <Sparkline data={adminState?.history_30s?.outside_c} />
                        </MetricCard>
                        <MetricCard label="TPMS FL" value={state?.tpms_bar?.fl?.toFixed(2)} unit="bar">
                            <Sparkline data={adminState?.history_30s?.tpms_fl} />
                        </MetricCard>
                        <MetricCard label="TPMS FR" value={state?.tpms_bar?.fr?.toFixed(2)} unit="bar">
                            <Sparkline data={adminState?.history_30s?.tpms_fr} />
                        </MetricCard>
                        <MetricCard label="TPMS RL" value={state?.tpms_bar?.rl?.toFixed(2)} unit="bar">
                            <Sparkline data={adminState?.history_30s?.tpms_rl} />
                        </MetricCard>
                        <MetricCard label="TPMS RR" value={state?.tpms_bar?.rr?.toFixed(2)} unit="bar">
                            <Sparkline data={adminState?.history_30s?.tpms_rr} />
                        </MetricCard>
                        <MetricCard label="Dist to Dest" value={state?.route?.dist_km != null ? formatKilometers(state.route.dist_km) : undefined} unit="km" />
                        <MetricCard label="ETA" value={state?.route?.eta_min != null ? `${state.route.eta_min} min` : undefined} />
                    </div>
                </div>

                <div className="mt-6">
                    <ShareForm carId={selectedCarId} />
                </div>
            </div>
        </div>
    );
}


