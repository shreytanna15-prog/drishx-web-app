import { getAuthHeaders } from "./auth-fetch";
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

export async function fetchMyTasks(): Promise<TaskRecord[]> {
  const response = await fetchWithRetry("/api/tasks", {
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error || "Failed to update task.");
  }

  return result as TaskRecord;
}
