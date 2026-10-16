import { AuthError } from "@/lib/auth-fetch";

/** Normalize unknown throwables to Error for hook state / callbacks. */
export function toHookError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Auth failures are handled by authFetch (refresh / redirect / onAuthFailure).
 * Hooks must not invoke UI onError for these.
 */
export function isAuthFailureError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/** True when a request generation is no longer the latest (stale / unmounted). */
export function isStaleRequest(
  requestId: number,
  latestRequestId: number
): boolean {
  return requestId !== latestRequestId;
}
