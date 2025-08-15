import { Sparklines, SparklinesLine } from 'react-sparklines';
import type { HistoryPoint } from '../api/types';

export function Sparkline({ data }: { data?: HistoryPoint[] }) {
    if (!data || data.length === 0) return null;
    const values = data
        .filter(([_, v]) => v != null)
        .map(([_, v]) => Number(v));
    if (values.length < 2) return null;
    return (
        <Sparklines data={values} svgWidth={100} svgHeight={24} margin={4}>
            <SparklinesLine color="#2563eb" style={{ fill: 'none' }} />
        </Sparklines>
    );
}


