"use client";

import Link from "next/link";
import { Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchReturnRequests,
  formatReturnStatus,
  type ReturnRequestRecord,
  type ReturnRequestStatus,
} from "@/lib/returns-api";
import { cn } from "@/lib/utils";

type FilterKey = "ALL" | ReturnRequestStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "MORE_INFO_REQUIRED", label: "More info" },
  { key: "ESCALATED_TO_ADMIN", label: "Escalated" },
  { key: "REJECTED", label: "Rejected" },
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusClass(status: ReturnRequestStatus) {
  switch (status) {
    case "SUBMITTED":
      return "border-amber-500/35 bg-amber-500/14 text-amber-600";
    case "MORE_INFO_REQUIRED":
      return "border-sky-500/35 bg-sky-500/14 text-sky-600";
    case "ESCALATED_TO_ADMIN":
      return "border-fuchsia-500/35 bg-fuchsia-500/14 text-fuchsia-600";
    case "REJECTED":
      return "border-rose-500/35 bg-rose-500/14 text-rose-600";
    default:
      return "border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text-muted)]";
  }
}

export function EmployeeReturnsScreen() {
  const [requests, setRequests] = useState<ReturnRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

  const loadRequests = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchReturnRequests();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load returns.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const filtered = useMemo(() => {
    if (activeFilter === "ALL") return requests;
    return requests.filter((request) => request.status === activeFilter);
  }, [activeFilter, requests]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-text)]">
            Returns
          </h1>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
            Review assigned return and replacement requests
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={loading || refreshing}
          onClick={() => {
            setRefreshing(true);
            void loadRequests();
          }}
          className="rounded-xl"
        >
          {refreshing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setActiveFilter(filter.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
              activeFilter === filter.key
                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]"
                : "border-[var(--brand-card-border)] text-[var(--brand-text-muted)]"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--brand-card-border)] px-6 py-16 text-center">
          <RotateCcw className="mb-3 size-8 text-[var(--brand-text-muted)]" />
          <p className="font-semibold text-[var(--brand-text)]">No return requests</p>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
            Assigned return requests will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => (
            <Link
              key={request.id}
              href={`/employee/returns/${request.id}`}
              className="block rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 transition-colors hover:bg-[var(--brand-card-hover,rgba(0,0,0,0.02))] sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-extrabold text-[var(--brand-text)]">
                    {request.requestNumber}
                  </p>
                  <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
                    {request.customer?.businessName ||
                      request.customer?.name ||
                      request.customer?.email ||
                      "Customer"}{" "}
                    · {request.requestType.toLowerCase()} · {request.items.length} item
                    {request.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-bold",
                    statusClass(request.status)
                  )}
                >
                  {formatReturnStatus(request.status)}
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-[var(--brand-text-muted)]">
                {formatDate(request.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
