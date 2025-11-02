import { useSSE as useSharedSSE } from "~/shared/hooks/useSSE";

export function useSSE(token: string | undefined) {
  return useSharedSSE({ token });
}
