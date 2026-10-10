"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchCurrentUser } from "@/lib/api";
import {
  getAccessToken,
  getStoredUser,
  setAuthSession,
} from "@/lib/auth-storage";
import {
  AuthError,
  logoutSession,
  refreshAccessToken,
  registerAccessTokenRefreshHandler,
  registerAuthFailureHandler,
} from "@/lib/auth-fetch";
import type { SafeUser } from "@/lib/types";

type AuthContextValue = {
  user: SafeUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: SafeUser) => void;
  logout: () => Promise<void>;
  updateUser: (user: SafeUser) => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function applyStoredSession(
  setToken: (t: string | null) => void,
  setUser: (u: SafeUser | null) => void
) {
  const token = getAccessToken();
  const stored = getStoredUser();
  if (token) setToken(token);
  if (stored) setUser(stored);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((newToken: string, newUser: SafeUser) => {
    setAuthSession(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await logoutSession();
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((nextUser: SafeUser) => {
    const storedToken = getAccessToken();
    if (storedToken) {
      setAuthSession(storedToken, nextUser);
      setToken(storedToken);
    }
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    let beforeToken = getAccessToken();

    // Empty sessionStorage but refresh cookie may still be valid (new tab).
    if (!beforeToken) {
      const outcome = await refreshAccessToken();
      if (outcome.status === "transient") {
        applyStoredSession(setToken, setUser);
        return;
      }
      if (outcome.status !== "refreshed") {
        await logout();
        return;
      }
      beforeToken = getAccessToken();
      if (!beforeToken) {
        await logout();
        return;
      }
    }

    try {
      const currentUser = await fetchCurrentUser();
      const afterToken = getAccessToken() ?? beforeToken;
      setAuthSession(afterToken, currentUser);
      setToken(afterToken);
      setUser(currentUser);
    } catch (err) {
      // Non-auth failures (5xx / network) must not force logout.
      if (!(err instanceof AuthError) || err.status !== 401) {
        applyStoredSession(setToken, setUser);
        return;
      }

      // authFetch may have already returned a 401 after a transient refresh.
      // Re-check explicitly so blips never clear a still-valid refresh cookie.
      const outcome = await refreshAccessToken();
      if (outcome.status === "transient") {
        applyStoredSession(setToken, setUser);
        return;
      }
      if (outcome.status === "refreshed") {
        try {
          const currentUser = await fetchCurrentUser();
          const afterToken = getAccessToken() ?? beforeToken;
          setAuthSession(afterToken, currentUser);
          setToken(afterToken);
          setUser(currentUser);
          return;
        } catch {
          await logout();
          return;
        }
      }
      await logout();
    }
  }, [logout]);

  useEffect(() => {
    registerAuthFailureHandler(() => {
      void logout();
      if (typeof window !== "undefined") {
        window.location.href = "/login?session=expired";
      }
    });
    registerAccessTokenRefreshHandler((nextToken) => {
      setToken(nextToken);
    });
    return () => {
      registerAccessTokenRefreshHandler(null);
    };
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      let storedToken = getAccessToken();
      let storedUser = getStoredUser();

      if (!storedToken) {
        const outcome = await refreshAccessToken();
        if (cancelled) return;
        if (outcome.status === "refreshed") {
          storedToken = getAccessToken();
          storedUser = getStoredUser();
        } else {
          // auth_failed or transient — leave logged out; do not clear cookie here.
          setIsLoading(false);
          return;
        }
      }

      if (cancelled) return;

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }

      await refreshUser();
      if (!cancelled) setIsLoading(false);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout, updateUser, refreshUser }),
    [user, token, isLoading, login, logout, updateUser, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
