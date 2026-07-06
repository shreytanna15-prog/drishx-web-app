import { getStoredToken } from "./auth-storage";
import { fetchWithRetry } from "./fetch-with-retry";

export type TaskStatus = "PENDING" | "COMPLETED";

export type TaskRecord = {
  id: string;
  title: string;
  details?: string | null;
  dueDate: string;
  status: TaskStatus;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
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

export async function fetchMyTasks(): Promise<TaskRecord[]> {
  const response = await fetchWithRetry("/api/tasks", {
    headers: authHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result?.error || "Failed to load tasks.");
  }

  return response.json() as Promise<TaskRecord[]>;
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<TaskRecord> {
  const response = await fetchWithRetry(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error || "Failed to update task.");
  }

  return result as TaskRecord;
}
