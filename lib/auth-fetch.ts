import type { SafeUser } from "./types";
import {
  mergeClientHeaders,
  REQUEST_ID_HEADER,
} from "./request-headers";
import {
  clearAuthSession,
  getAccessToken,
  setAccessToken,
  setAuthSession,
} from "./auth-storage";

export type AuthErrorCode =
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "TOKEN_MISSING"
  | "ACCOUNT_PENDING"
  | "ACCOUNT_INACTIVE"
  | "MISSING_PERMISSION"
  | "FORBIDDEN";

export class AuthError extends Error {
  code: AuthErrorCode;
  status: number;

  constructor(message: string, code: AuthErrorCode, status = 401) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }
}

/** Outcome of a refresh attempt — transient failures must not force logout. */
export type RefreshOutcome =
  | { status: "refreshed" }
  | { status: "auth_failed" }
  | { status: "transient" };

type RefreshResponse = {
  accessToken?: string;
  token?: string;
  user?: SafeUser;
  error?: string;
  code?: AuthErrorCode;
};

const REFRESH_TIMEOUT_MS = 15_000;

let refreshPromise: Promise<RefreshOutcome> | null = null;
let onAuthFailure: (() => void) | null = null;
let onAccessTokenRefreshed: ((token: string) => void) | null = null;

export function registerAuthFailureHandler(handler: () => void) {
  onAuthFailure = handler;
}

/** Keep React auth state in sync after a silent access-token refresh. */
export function registerAccessTokenRefreshHandler(
  handler: ((token: string) => void) | null
) {
  onAccessTokenRefreshed = handler;
}

function resolveAccessToken(data: RefreshResponse) {
  return data.accessToken ?? data.token ?? null;
}

async function parseAuthError(res: Response): Promise<AuthError> {
  try {
    const data = (await res.json()) as { error?: string; code?: AuthErrorCode };
    return new AuthError(
      data.error ?? "Unauthorized.",
      data.code ?? "TOKEN_INVALID",
      res.status
    );
  } catch {
    return new AuthError("Unauthorized.", "TOKEN_INVALID", res.status);
  }
}

function isTransientRefreshStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

export async function refreshAccessToken(): Promise<RefreshOutcome> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      if (!res.ok) {
        if (isTransientRefreshStatus(res.status)) {
          return { status: "transient" };
        }
        return { status: "auth_failed" };
      }

      const data = (await res.json()) as RefreshResponse;
      const nextToken = resolveAccessToken(data);
      if (!nextToken) return { status: "auth_failed" };

      setAccessToken(nextToken);
      if (data.user) {
        setAuthSession(nextToken, data.user);
      }
      onAccessTokenRefreshed?.(nextToken);
      return { status: "refreshed" };
    } catch {
      // Network blip / timeout / aborted — keep the session.
      return { status: "transient" };
    } finally {
      clearTimeout(timer);
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function logoutSession(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // best effort
  } finally {
    clearAuthSession();
  }
}

function withAuthHeaders(init?: RequestInit): RequestInit {
  const headers = mergeClientHeaders(init?.headers);
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return { ...init, headers };
}

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  allowRetry = true
): Promise<Response> {
  let response = await fetch(input, withAuthHeaders(init));

  if (response.status !== 401 || !allowRetry) {
    return response;
  }

  const authError = await parseAuthError(response.clone());
  // Refresh only for token problems (including bare 401 without a code,
  // which parseAuthError maps to TOKEN_INVALID). Never silent-refresh
  // permission / account-state failures.
  const nonRefreshable: AuthErrorCode[] = [
    "ACCOUNT_PENDING",
    "ACCOUNT_INACTIVE",
    "MISSING_PERMISSION",
    "FORBIDDEN",
  ];
  if (nonRefreshable.includes(authError.code)) {
    return response;
  }

  const outcome = await refreshAccessToken();
  if (outcome.status === "transient") {
    // Keep session; surface the original 401 so the caller can retry later.
    return response;
  }
  if (outcome.status !== "refreshed") {
    onAuthFailure?.();
    throw authError;
  }

  response = await fetch(input, withAuthHeaders(init));
  if (response.status === 401) {
    onAuthFailure?.();
    throw await parseAuthError(response);
  }

  return response;
}

export async function authFetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await authFetch(input, init);
  if (!response.ok) {
    const error = await parseAuthError(response);
    throw error;
  }
  return response.json() as Promise<T>;
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client": "web",
    [REQUEST_ID_HEADER]: crypto.randomUUID?.() ?? `${Date.now()}`,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function handleAuthRedirect(code?: AuthErrorCode) {
  if (typeof window === "undefined") return;
  if (code === "ACCOUNT_PENDING") {
    window.location.href = "/pending-approval";
    return;
  }
  window.location.href = "/login?session=expired";
}
