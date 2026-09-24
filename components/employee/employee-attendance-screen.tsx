"use client";

import { ChevronLeft, ChevronRight, Loader2, Smartphone } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchAttendanceCalendar,
  fetchAttendanceMe,
  type AttendanceCalendarResponse,
  type AttendanceMeResponse,
} from "@/lib/attendance-api";
import { cn } from "@/lib/utils";

export function EmployeeAttendanceScreen() {
  const [me, setMe] = useState<AttendanceMeResponse | null>(null);
  const [calendar, setCalendar] = useState<AttendanceCalendarResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meData, calData] = await Promise.all([
        fetchAttendanceMe(),
        fetchAttendanceCalendar(year, month),
      ]);
      setMe(meData);
      setCalendar(calData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attendance.");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  function shiftMonth(delta: number) {
    let y = year;
    let m = month + delta;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setYear(y);
    setMonth(m);
  }

  const monthLabel = useMemo(() => {
    const d = new Date(Date.UTC(year, month - 1, 1));
    return new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  }, [year, month]);

  const calendarGrid = useMemo(() => {
    if (!calendar) return [];
    const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    const cells: Array<(typeof calendar.days)[number] | null> = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (const day of calendar.days) cells.push(day);
    return cells;
  }, [calendar, year, month]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold text-(--brand-text)">
          Attendance
        </h1>
        <p className="mt-1 text-sm text-(--brand-text-muted)">
          Check in at the office with the shared QR code on your phone.
        </p>
      </div>

      <div className="rounded-2xl border border-(--brand-primary)/30 bg-(--brand-primary)/10 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--brand-primary)/20 text-(--brand-primary)">
            <Smartphone className="size-5" />
          </div>
          <div>
            <p className="font-extrabold text-(--brand-text)">
              Open the DrishX mobile app to scan
            </p>
            <p className="mt-1 text-sm leading-relaxed text-(--brand-text-muted)">
              Camera check-in is only available on the mobile app. Scan the office
              QR shown on the admin attendance screen.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
          {error}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void load()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      <section className="rounded-2xl border border-(--brand-card-border) bg-(--brand-card) p-4 sm:p-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-(--brand-text-muted)">
          Today
        </h2>
        {loading && !me ? (
          <Skeleton className="mt-3 h-16 w-full" />
        ) : me ? (
          <div className="mt-3">
            <p className="text-xs text-(--brand-text-muted)">{me.today.date}</p>
            <p
              className={cn(
                "mt-1 text-xl font-extrabold",
                me.today.present ? "text-emerald-500" : "text-amber-500"
              )}
            >
              {me.today.present ? "Present" : "Not marked yet"}
            </p>
            {me.today.record ? (
              <p className="mt-1 text-sm text-(--brand-text-muted)">
                {me.today.record.method === "QR_SCAN"
                  ? "Via office QR"
                  : "Marked by admin"}{" "}
                · {new Date(me.today.record.markedAt).toLocaleTimeString("en-IN")}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-(--brand-card-border) bg-(--brand-card) p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <h2 className="text-base font-extrabold text-(--brand-text)">
            {monthLabel}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>

        {loading && !calendar ? (
          <div className="mt-4 flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-(--brand-primary)" />
          </div>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-bold text-(--brand-text-muted)">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={`${d}-${i}`}>{d}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {calendarGrid.map((day, idx) => {
                if (!day) {
                  return <div key={`e-${idx}`} className="min-h-12" />;
                }
                const present = day.present === true;
                return (
                  <div
                    key={day.date}
                    className={cn(
                      "flex min-h-12 flex-col items-center justify-center rounded-lg border text-xs",
                      present
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-(--brand-card-border) text-(--brand-text-muted)"
                    )}
                  >
                    <span className="font-bold text-(--brand-text)">
                      {Number(day.date.slice(-2))}
                    </span>
                    <span className="font-extrabold">{present ? "P" : "—"}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
