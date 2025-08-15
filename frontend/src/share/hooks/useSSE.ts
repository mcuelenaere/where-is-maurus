import { useEffect, useRef, useState } from 'react';
import { getEnv } from '../../shared/api/client';
import type { CarState, HistoryWindow, PathPoint } from '../../shared/api/types';

type SnapshotPayload = CarState & {
    history_30s: HistoryWindow;
    path_30s: PathPoint[];
};
type DeltaPayload = Partial<SnapshotPayload>;

export function useSSE(token: string | undefined) {
    const { apiBaseUrl, sessionPath, ssePath } = getEnv();
    const [state, setState] = useState<SnapshotPayload | undefined>();
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const esRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        (async () => {
            try {
                await fetch(`${apiBaseUrl || ''}${sessionPath}`, {
                    method: 'POST',
                    credentials: 'include',
                    mode: 'cors',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ token })
                });
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Session exchange failed');
                return;
            }

            const es = new EventSource(`${apiBaseUrl || ''}${ssePath}`, { withCredentials: true });
            esRef.current = es;

            es.addEventListener('open', () => setConnected(true));
            es.addEventListener('error', () => setConnected(false));

            es.addEventListener('snapshot', (ev) => {
                const data = JSON.parse((ev as MessageEvent).data) as SnapshotPayload;
                setState(data);
            });

            es.addEventListener('delta', (ev) => {
                const data = JSON.parse((ev as MessageEvent).data) as DeltaPayload;
                setState((prev) => ({
                    ...(prev ?? {}),
                    ...(data ?? {}),
                    history_30s: { ...(prev?.history_30s ?? {}), ...(data?.history_30s ?? {}) },
                } as SnapshotPayload));
            });

            es.addEventListener('heartbeat', () => {
                // no-op for now
            });
        })();
        return () => {
            cancelled = true;
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }
        };
    }, [token, apiBaseUrl, sessionPath, ssePath]);

    return { state, connected, error } as const;
}


