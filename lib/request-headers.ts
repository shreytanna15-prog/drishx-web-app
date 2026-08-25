import { randomUUID } from "crypto";

export const CLIENT_HEADER = "X-Client";
export const REQUEST_ID_HEADER = "X-Request-Id";
export const OFFLINE_REPLAY_HEADER = "X-Offline-Replay";

export function createRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return randomUUID();
}

export function webClientHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    [CLIENT_HEADER]: "web",
    [REQUEST_ID_HEADER]: createRequestId(),
    ...extra,
  };
}

export function mergeClientHeaders(
  init?: HeadersInit,
  extra?: Record<string, string>
): Headers {
  const headers = new Headers(init);
  const clientHeaders = webClientHeaders(extra);
  for (const [key, value] of Object.entries(clientHeaders)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  return headers;
}
