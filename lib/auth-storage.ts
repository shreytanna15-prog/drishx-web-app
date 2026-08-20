import type { SafeUser } from "./types";

const ACCESS_TOKEN_KEY = "drishx_access_token";
const LEGACY_TOKEN_KEY = "drishx_token";
const USER_KEY = "drishx_user";

let memoryAccessToken: string | null = null;

function readSessionStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionStorage(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    // ignore quota / privacy mode errors
  }
}

function migrateLegacyToken(): string | null {
  if (typeof window === "undefined") return null;
  const legacy = localStorage.getItem(LEGACY_TOKEN_KEY);
  if (!legacy) return null;
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  setAccessToken(legacy);
  return legacy;
}

export function getAccessToken(): string | null {
  if (memoryAccessToken) return memoryAccessToken;
  const stored = readSessionStorage(ACCESS_TOKEN_KEY);
  if (stored) {
    memoryAccessToken = stored;
    return stored;
  }
  return migrateLegacyToken();
}

/** @deprecated Use getAccessToken */
export function getStoredToken(): string | null {
  return getAccessToken();
}

export function setAccessToken(token: string | null) {
  memoryAccessToken = token;
  writeSessionStorage(ACCESS_TOKEN_KEY, token);
  if (typeof window !== "undefined") {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
}

export function getStoredUser(): SafeUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SafeUser;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: SafeUser): void {
  setAccessToken(token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  setAccessToken(null);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}
