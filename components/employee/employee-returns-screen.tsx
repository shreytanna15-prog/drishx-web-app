"use client";

import Link from "next/link";
import {
  ChevronRight,
  Loader2,
  Package,
  RefreshCw,
  RotateCcw,
  UserRound,
} from "lucide-react";
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
  { key: "APPROVED_CREDIT", label: "Credit" },
  { key: "AWAITING_MATERIAL", label: "Replacement" },
  { key: "MORE_INFO_REQUIRED", label: "More info" },
  { key: "CLOSED", label: "Closed" },
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusClass(status: ReturnRequestStatus) {
  switch (status) {
    case "SUBMITTED":
      return "border-amber-400/40 bg-amber-500/15 text-amber-300";
    case "MORE_INFO_REQUIRED":
      return "border-sky-400/40 bg-sky-500/15 text-sky-300";
    case "AWAITING_MATERIAL":
    case "APPROVED_REPLACEMENT":
    case "APPROVED_CREDIT":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-300";
    case "REJECTED":
      return "border-rose-400/40 bg-rose-500/15 text-rose-300";
    default:
      return "border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text-muted)]";
  }
}

function customerLabel(request: ReturnRequestRecord) {
  return (
    request.customer?.businessName ||
    request.customer?.name ||
    request.customer?.email ||
    "Customer"
  );
}

function itemSummary(request: ReturnRequestRecord) {
  const labels = request.items.map((item) => item.lensLabel).filter(Boolean);
  if (labels.length === 0) return "No items";
  if (labels.length === 1) return labels[0]!;
  return `${labels[0]} +${labels.length - 1} more`;
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
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-3xl">
            Returns
          </h1>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
            Assigned after admin approval — process credit and replacement work here
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-xl border-[var(--brand-input-border)]"
          disabled={loading || refreshing}
          onClick={() => {
            setRefreshing(true);
            void loadRequests();
          }}
          aria-label="Refresh returns"
        >
          {refreshing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {FILTERS.map((filter) => {
          const active = activeFilter === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors",
                active
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]"
                  : "border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-8 text-center text-sm text-rose-300">
          {error}
          <div className="mt-4">
            <Button
              className="rounded-xl"
              onClick={() => {
                setLoading(true);
                void loadRequests();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : !error && filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-16 text-center">
          <RotateCcw className="mx-auto mb-3 size-10 text-[var(--brand-text-muted)]" />
          <p className="font-semibold text-[var(--brand-text)]">No return requests</p>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
            Returns appear here after admin approval and assignment.
          </p>
        </div>
      ) : !error ? (
        <div className="space-y-3">
          {filtered.map((request) => (
            <Link
              key={request.id}
              href={`/employee/returns/${request.id}`}
              className={cn(
                "block rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 transition-all sm:p-5",
                "hover:border-[var(--brand-primary)]/45 hover:bg-[var(--brand-primary)]/5 hover:shadow-sm"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-extrabold text-[var(--brand-text)] sm:text-lg">
                    {request.requestNumber}
                  </p>
                  <p className="mt-1 text-sm font-bold capitalize text-[var(--brand-text)]">
                    {request.requestType.toLowerCase()}
                    <span className="font-medium text-[var(--brand-text-muted)]">
                      {" "}
                      · {request.items.length} item
                      {request.items.length === 1 ? "" : "s"}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs font-bold",
                      statusClass(request.status)
                    )}
                  >
                    {formatReturnStatus(request.status)}
                  </span>
                  <ChevronRight className="hidden size-4 text-[var(--brand-text-muted)] sm:block" />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--brand-text)]">
                <UserRound className="size-4 shrink-0 text-[var(--brand-primary)]" />
                <span className="truncate">{customerLabel(request)}</span>
              </div>

              <div className="mt-2 flex items-start gap-2 text-sm text-[var(--brand-text-muted)]">
                <Package className="mt-0.5 size-4 shrink-0 text-[var(--brand-primary)]" />
                <p className="line-clamp-2 font-medium">{itemSummary(request)}</p>
              </div>

              <p className="mt-3 text-xs font-semibold text-[var(--brand-text-muted)]">
                {formatDate(request.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
