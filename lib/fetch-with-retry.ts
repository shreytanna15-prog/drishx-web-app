import { authFetch } from "./auth-fetch";

const RETRIABLE_STATUS = new Set([500, 502, 503, 504]);

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry authenticated fetch on transient server / gateway errors. */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { retries?: number; baseDelayMs?: number }
): Promise<Response> {
  const retries = options?.retries ?? 2;
  const baseDelayMs = options?.baseDelayMs ?? 400;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await authFetch(input, init, true);
      if (!RETRIABLE_STATUS.has(response.status) || attempt === retries) {
        return response;
      }
    } catch (error) {
      if (attempt === retries) throw error;
    }

    await wait(baseDelayMs * (attempt + 1));
  }

  throw new Error("Failed to fetch after retries.");
}
