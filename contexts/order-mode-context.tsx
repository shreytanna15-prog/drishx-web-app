"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type OrderMode = "retail" | "wholesale";

const STORAGE_KEY = "drishx-order-mode";

type OrderModeContextValue = {
  mode: OrderMode;
  setMode: (mode: OrderMode) => void;
  isWholesale: boolean;
  isRetail: boolean;
};

const OrderModeContext = createContext<OrderModeContextValue | undefined>(
  undefined
);

function readStoredMode(): OrderMode {
  if (typeof window === "undefined") {
    return "wholesale";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "retail" ? "retail" : "wholesale";
}

export function OrderModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<OrderMode>("wholesale");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setModeState(readStoredMode());
    setHydrated(true);
  }, []);

  const setMode = useCallback((next: OrderMode) => {
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({
      mode: hydrated ? mode : "wholesale",
      setMode,
      isWholesale: (hydrated ? mode : "wholesale") === "wholesale",
      isRetail: (hydrated ? mode : "wholesale") === "retail",
    }),
    [hydrated, mode, setMode]
  );

  return (
    <OrderModeContext.Provider value={value}>
      {children}
    </OrderModeContext.Provider>
  );
}

export function useOrderMode() {
  const context = useContext(OrderModeContext);
  if (!context) {
    throw new Error("useOrderMode must be used within OrderModeProvider");
  }
  return context;
}
