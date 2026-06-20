import { useCallback, useEffect, useState } from 'react';

/**
 * Thin fetch wrapper + a reusable data-fetching hook used by every page hook.
 * Requests go to relative `/api/*` paths; Vite proxies them to the API in dev
 * (see vite.config.ts). All UI data flows through here — nothing is hardcoded
 * in components.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { signal, headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError(`Network error contacting ${path}`, undefined);
  }
  if (!res.ok) {
    throw new ApiError(`Request to ${path} failed (${res.status})`, res.status);
  }
  return (await res.json()) as T;
}

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  /** Re-run the request (used by the ErrorMessage retry button). */
  reload: () => void;
}

/**
 * Fetch `path` on mount and whenever `reload()` is called. Aborts the in-flight
 * request on unmount/re-fetch so state is never set after teardown.
 */
export function useApi<T>(path: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    apiFetch<T>(path, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err : new ApiError('Unexpected error'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, nonce]);

  return { data, loading, error, reload };
}
