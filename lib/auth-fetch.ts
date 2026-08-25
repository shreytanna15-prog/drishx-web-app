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

type RefreshResponse = {
  accessToken?: string;
  token?: string;
  user?: SafeUser;
  error?: string;
  code?: AuthErrorCode;
};

let refreshPromise: Promise<boolean> | null = null;
let onAuthFailure: (() => void) | null = null;

export function registerAuthFailureHandler(handler: () => void) {
  onAuthFailure = handler;
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

export async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        return false;
      }

      const data = (await res.json()) as RefreshResponse;
      const nextToken = resolveAccessToken(data);
      if (!nextToken) return false;

      setAccessToken(nextToken);
      if (data.user) {
        setAuthSession(nextToken, data.user);
      }
      return true;
    } catch {
      return false;
    } finally {
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
  if (init?.body && !headers.has("Content-Type")) {
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
  if (authError.code !== "TOKEN_EXPIRED" && authError.code !== "TOKEN_INVALID" && authError.code !== "TOKEN_MISSING") {
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
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
