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
  clearAuthSession,
  getAccessToken,
  getStoredUser,
  setAuthSession,
} from "@/lib/auth-storage";
import {
  logoutSession,
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
    const storedToken = getAccessToken();
    if (!storedToken) {
      await logout();
      return;
    }

    try {
      const currentUser = await fetchCurrentUser();
      setAuthSession(storedToken, currentUser);
      setToken(storedToken);
      setUser(currentUser);
    } catch {
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
  }, [logout]);

  useEffect(() => {
    const storedToken = getAccessToken();
    const storedUser = getStoredUser();

    if (!storedToken || !storedUser) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    setUser(storedUser);
    refreshUser().finally(() => setIsLoading(false));
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
