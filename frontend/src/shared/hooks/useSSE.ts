import { useEffect, useRef, useState } from 'react';
import { getEnv } from '../../shared/api/client';

type SnapshotPayload<TState, THistory, TPath> = TState & { history_30s: THistory; path_30s: TPath[] };
type DeltaPayload<TState, THistory, TPath> = Partial<SnapshotPayload<TState, THistory, TPath>>;

type Options = {
    // If provided, will first POST to session endpoint to exchange token for cookie (share flow)
    token?: string;
    // Direct SSE path (for admin or custom endpoints). If omitted, uses env.ssePath
    ssePath?: string;
};

export function useSSE<TState extends object, THistory extends object, TPath extends { ts_ms: number }>(options: Options) {
    const { apiBaseUrl, sessionPath, ssePath: defaultSSEPath } = getEnv();
    const [state, setState] = useState<SnapshotPayload<TState, THistory, TPath> | undefined>();
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const esRef = useRef<EventSource | null>(null);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                if (options.token) {
                    await fetch(`${apiBaseUrl || ''}${sessionPath}`, {
                        method: 'POST',
                        credentials: 'include',
                        mode: 'cors',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ token: options.token })
                    });
                }
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Session exchange failed');
                return;
            }

            const path = options.ssePath || defaultSSEPath;
            const es = new EventSource(`${apiBaseUrl || ''}${path}`, { withCredentials: true });
            esRef.current = es;

            es.addEventListener('open', () => setConnected(true));
            es.addEventListener('error', () => setConnected(false));

            es.addEventListener('snapshot', (ev) => {
                const data = JSON.parse((ev as MessageEvent).data) as SnapshotPayload<TState, THistory, TPath>;
                setState(data);
            });

            es.addEventListener('delta', (ev) => {
                const data = JSON.parse((ev as MessageEvent).data) as DeltaPayload<TState, THistory, TPath>;
                setState((prev) => ({
                    ...(prev ?? {} as any),
                    ...(data ?? {} as any),
                    history_30s: { ...(prev?.history_30s ?? {} as any), ...(data?.history_30s ?? {} as any) },
                }) as SnapshotPayload<TState, THistory, TPath>);
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
    }, [options.token, options.ssePath, apiBaseUrl, sessionPath, defaultSSEPath]);

    return { state, connected, error } as const;
}


