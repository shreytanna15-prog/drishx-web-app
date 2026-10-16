"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isAuthFailureError,
  isStaleRequest,
  toHookError,
} from "@/lib/hooks/api-hook-utils";
import type { QueryOptions } from "@/lib/types/api-client";

export type UseApiQueryResult<TData> = {
  data: TData | undefined;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Shared read hook — mount + deps when enabled; loading / refreshing / error / refetch.
 * Transport owns auth refresh; AuthError skips onError UI callbacks.
 */
export function useApiQuery<TData>(
  _queryKey: string,
  fetcher: () => Promise<TData>,
  deps: readonly unknown[] = [],
  options?: QueryOptions<TData>
): UseApiQueryResult<TData> {
  const enabled = options?.enabled ?? true;

  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(() => enabled);
  const [refreshing, setRefreshing] = useState(false);

  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(options?.onSuccess);
  const onErrorRef = useRef(options?.onError);
  const latestRequestIdRef = useRef(0);
  const hasDataRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    fetcherRef.current = fetcher;
    onSuccessRef.current = options?.onSuccess;
    onErrorRef.current = options?.onError;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      latestRequestIdRef.current += 1;
    };
  }, []);

  const runFetch = useCallback(async (mode: "initial" | "refresh") => {
    const requestId = ++latestRequestIdRef.current;

    if (mode === "refresh" || hasDataRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await fetcherRef.current();
      if (
        !mountedRef.current ||
        isStaleRequest(requestId, latestRequestIdRef.current)
      ) {
        return;
      }
      hasDataRef.current = true;
      setData(result);
      setError(null);
      onSuccessRef.current?.(result);
    } catch (err) {
      if (
        !mountedRef.current ||
        isStaleRequest(requestId, latestRequestIdRef.current)
      ) {
        return;
      }
      if (isAuthFailureError(err)) {
        setError(null);
        return;
      }
      const nextError = toHookError(err);
      setError(nextError);
      onErrorRef.current?.(nextError);
    } finally {
      if (
        !mountedRef.current ||
        isStaleRequest(requestId, latestRequestIdRef.current)
      ) {
        return;
      }
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      // Invalidate in-flight work; loading flags are gated below when !enabled.
      latestRequestIdRef.current += 1;
      return;
    }

    const mode = hasDataRef.current ? "refresh" : "initial";
    void runFetch(mode);
    // Caller-owned deps drive refetch; runFetch is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional deps array
  }, [enabled, runFetch, ...deps]);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    await runFetch("refresh");
  }, [enabled, runFetch]);

  return {
    data,
    loading: enabled ? loading : false,
    refreshing: enabled ? refreshing : false,
    error: enabled ? error : null,
    refetch,
  };
}
