import { getStoredToken } from "@/lib/auth-storage";

export type NotificationType =
  | "ORDER_STATUS_UPDATED"
  | "ORDER_PLACED"
  | "TASK_ASSIGNED"
  | string;

export type NotificationRecord = {
  id: string;
  userId: string;
  orderId?: string | null;
  taskId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  order?: {
    id: string;
    status: string;
    updatedAt: string;
  } | null;
  task?: {
    id: string;
    title: string;
    dueDate: string;
    status: string;
  } | null;
};

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchNotifications(): Promise<NotificationRecord[]> {
  const response = await fetch("/api/notifications", {
    headers: authHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result?.error || "Failed to load notifications.");
  }

  return response.json();
}

export async function markAllNotificationsRead(): Promise<void> {
  const response = await fetch("/api/notifications", {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result?.error || "Failed to mark notifications as read.");
  }
}

export function countUnreadNotifications(
  notifications: NotificationRecord[]
): number {
  return notifications.filter((item) => !item.isRead).length;
}
