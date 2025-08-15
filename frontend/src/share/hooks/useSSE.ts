import type { CarState, HistoryWindow, PathPoint } from '../../shared/api/types';
import { useSSE as useSharedSSE } from '../../shared/hooks/useSSE';

export function useSSE(token: string | undefined) {
    return useSharedSSE<CarState, HistoryWindow, PathPoint>({ token });
}


