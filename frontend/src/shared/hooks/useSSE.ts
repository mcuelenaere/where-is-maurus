import { useEffect, useRef, useState } from "react";
import { t } from "@lingui/macro";

import { getEnv } from "../../shared/api/client";
import type { DeltaPayload, SnapshotPayload } from "../api/types";

type Options = {
  token?: string;
  ssePath?: string;
};

export function useSSE(options: Options) {
  const { apiBaseUrl, sessionPath, ssePath: defaultSSEPath } = getEnv();
  const [state, setState] = useState<SnapshotPayload | undefined>();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (options.token) {
          await fetch(`${apiBaseUrl || ""}${sessionPath}`, {
            method: "POST",
            credentials: "include",
            mode: "cors",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ token: options.token }),
          });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t`Session exchange failed`);
        return;
      }

      const path = options.ssePath || defaultSSEPath;
      const es = new EventSource(`${apiBaseUrl || ""}${path}`, { withCredentials: true });
      esRef.current = es;

      es.addEventListener("open", () => setConnected(true));
      es.addEventListener("error", () => setConnected(false));

      es.addEventListener("snapshot", (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as SnapshotPayload;
        setState(data);
      });

      es.addEventListener("delta", (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as DeltaPayload;
        setState(
          (prev) =>
            ({
              ...(prev ?? ({} as any)),
              ...(data ?? ({} as any)),
              history_30s: {
                ...(prev?.history_30s ?? ({} as any)),
                ...(data?.history_30s ?? ({} as any)),
              },
            }) as SnapshotPayload
        );
      });

      es.addEventListener("heartbeat", () => {
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
