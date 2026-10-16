"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isAuthFailureError,
  isStaleRequest,
  toHookError,
} from "@/lib/hooks/api-hook-utils";
import type { MutationOptions } from "@/lib/types/api-client";

export type UseApiMutationResult<TData, TVariables> = {
  mutate: (variables: TVariables) => Promise<TData | undefined>;
  pending: boolean;
  error: Error | null;
};

/**
 * Shared write hook — mutate(variables) → pending / error.
 * AuthError skips onError UI; transport owns refresh / redirect.
 */
export function useApiMutation<TData, TVariables = null>(
  mutator: (variables: TVariables) => Promise<TData>,
  options?: MutationOptions<TData, TVariables>
): UseApiMutationResult<TData, TVariables> {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutatorRef = useRef(mutator);
  const onSuccessRef = useRef(options?.onSuccess);
  const onErrorRef = useRef(options?.onError);
  const latestMutationIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mutatorRef.current = mutator;
    onSuccessRef.current = options?.onSuccess;
    onErrorRef.current = options?.onError;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      latestMutationIdRef.current += 1;
    };
  }, []);

  const mutate = useCallback(async (variables: TVariables) => {
    const mutationId = ++latestMutationIdRef.current;
    setPending(true);
    setError(null);

    try {
      const result = await mutatorRef.current(variables);
      if (
        !mountedRef.current ||
        isStaleRequest(mutationId, latestMutationIdRef.current)
      ) {
        return undefined;
      }
      setError(null);
      onSuccessRef.current?.(result, variables);
      return result;
    } catch (err) {
      if (
        !mountedRef.current ||
        isStaleRequest(mutationId, latestMutationIdRef.current)
      ) {
        return undefined;
      }
      if (isAuthFailureError(err)) {
        setError(null);
        return undefined;
      }
      const nextError = toHookError(err);
      setError(nextError);
      onErrorRef.current?.(nextError, variables);
      return undefined;
    } finally {
      if (
        mountedRef.current &&
        !isStaleRequest(mutationId, latestMutationIdRef.current)
      ) {
        setPending(false);
      }
    }
  }, []);

  return { mutate, pending, error };
}
