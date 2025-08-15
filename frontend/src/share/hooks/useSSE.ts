import { useSSE as useSharedSSE } from '../../shared/hooks/useSSE';
import type { CarState, HistoryWindow, PathPoint } from '../../shared/api/types';

export function useSSE(token: string | undefined) {
    return useSharedSSE<CarState, HistoryWindow, PathPoint>({ token });
}


