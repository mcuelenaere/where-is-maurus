import { useEffect, useRef, useState } from 'react';

export function usePolling(fn: () => void | Promise<void>, intervalMs: number, deps: unknown[] = []) {
    const [isPolling, setIsPolling] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<number | undefined>();
    const timerRef = useRef<number | undefined>();
    const backoffRef = useRef(0);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        async function tick() {
            setIsPolling(true);
            try {
                await fn();
                backoffRef.current = 0;
                setLastUpdated(Date.now());
            } catch (e) {
                backoffRef.current = Math.min(backoffRef.current ? backoffRef.current * 2 : 2000, 30000);
            } finally {
                setIsPolling(false);
                if (!cancelled && isMounted.current) {
                    const wait = backoffRef.current || intervalMs;
                    timerRef.current = window.setTimeout(tick, wait);
                }
            }
        }
        tick();
        return () => {
            cancelled = true;
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intervalMs, ...deps]);

    return { isPolling, lastUpdated } as const;
}


