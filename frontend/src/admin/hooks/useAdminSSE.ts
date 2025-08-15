import { useSSE as useSharedSSE } from '../../shared/hooks/useSSE';
import type { CarState, HistoryWindow, PathPoint } from '../../shared/api/types';

export function useAdminSSE(carId: number | undefined) {
    const ssePath = carId ? `/api/v1/admin/cars/${carId}/stream` : undefined;
    return useSharedSSE<CarState, HistoryWindow, PathPoint>({ ssePath });
}


