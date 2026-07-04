"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  countUnreadNotifications,
  fetchNotifications,
} from "@/lib/notifications-api";

type NotificationUnreadContextValue = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
};

const NotificationUnreadContext =
  createContext<NotificationUnreadContextValue | null>(null);

export function NotificationUnreadProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const notifications = await fetchNotifications();
      setUnreadCount(countUnreadNotifications(notifications));
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount, pathname]);

  useEffect(() => {
    function handleFocus() {
      void refreshUnreadCount();
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshUnreadCount]);

  return (
    <NotificationUnreadContext.Provider
      value={{ unreadCount, refreshUnreadCount }}
    >
      {children}
    </NotificationUnreadContext.Provider>
  );
}

export function useNotificationUnread(): NotificationUnreadContextValue {
  const context = useContext(NotificationUnreadContext);
  if (!context) {
    throw new Error(
      "useNotificationUnread must be used within NotificationUnreadProvider"
    );
  }
  return context;
}
