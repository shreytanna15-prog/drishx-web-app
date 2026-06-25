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
  getStoredToken,
  getStoredUser,
  setAuthSession,
} from "@/lib/auth-storage";
import type { SafeUser } from "@/lib/types";

type AuthContextValue = {
  user: SafeUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: SafeUser) => void;
  logout: () => void;
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

  const logout = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((nextUser: SafeUser) => {
    const storedToken = getStoredToken();
    if (storedToken) {
      setAuthSession(storedToken, nextUser);
      setToken(storedToken);
    }
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      logout();
      return;
    }

    try {
      const currentUser = await fetchCurrentUser();
      setAuthSession(storedToken, currentUser);
      setToken(storedToken);
      setUser(currentUser);
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const storedToken = getStoredToken();
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
