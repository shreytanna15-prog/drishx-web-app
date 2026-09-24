import { getAuthHeaders } from "./auth-fetch";
import { fetchWithRetry } from "./fetch-with-retry";

export type AttendanceMeResponse = {
  today: {
    date: string;
    present: boolean;
    record: {
      id: string;
      method: "QR_SCAN" | "BY_ADMIN";
      markedAt: string;
      markedBy: { id: string; name: string | null; email: string } | null;
    } | null;
  };
  recent: Array<{
    id: string;
    date: string;
    method: "QR_SCAN" | "BY_ADMIN";
    markedAt: string;
    markedBy: { id: string; name: string | null; email: string } | null;
  }>;
};

export type AttendanceCalendarResponse = {
  year: number;
  month: number;
  timezone: string;
  days: Array<{
    date: string;
    presentCount: number;
    absentCount: number;
    present?: boolean;
  }>;
};

export async function fetchAttendanceMe(): Promise<AttendanceMeResponse> {
  const response = await fetchWithRetry("/api/attendance/me", {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Failed to load attendance."
    );
  }
  return data as AttendanceMeResponse;
}

export async function fetchAttendanceCalendar(
  year: number,
  month: number
): Promise<AttendanceCalendarResponse> {
  const qs = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  const response = await fetchWithRetry(`/api/attendance/calendar?${qs.toString()}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Failed to load calendar."
    );
  }
  return data as AttendanceCalendarResponse;
}
