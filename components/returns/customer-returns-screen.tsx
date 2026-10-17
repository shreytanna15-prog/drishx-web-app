"use client";

import Link from "next/link";
import {
  ChevronRight,
  Loader2,
  Package,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

import {
  QueryEmptyState,
  QueryErrorState,
  QueryLoadMoreButton,
} from "@/components/query-list-states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginatedListState } from "@/lib/hooks/use-paginated-list-state";
import {
  formatReturnStatus,
  type ReturnRequestRecord,
  type ReturnRequestStatus,
  type ReturnRequestType,
} from "@/lib/returns-api";
import { useGetReturnRequests } from "@/lib/modules/returns/query/use-get-return-requests";
import { cn } from "@/lib/utils";

type FilterKey = "ALL" | "ACTIVE" | "HISTORY" | ReturnRequestType;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "HISTORY", label: "History" },
  { key: "RETURN", label: "Returns" },
  { key: "REPLACEMENT", label: "Replacements" },
];

const ACTIVE_STATUSES: ReturnRequestStatus[] = [
  "SUBMITTED",
  "MORE_INFO_REQUIRED",
  "ESCALATED_TO_ADMIN",
  "AWAITING_MATERIAL",
  "APPROVED_CREDIT",
  "APPROVED_REPLACEMENT",
];

const HISTORY_STATUSES: ReturnRequestStatus[] = ["REJECTED", "CLOSED"];

const PAGE_SIZE = 20;

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
    case "ESCALATED_TO_ADMIN":
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

function typeLabel(type: ReturnRequestType) {
  return type === "REPLACEMENT" ? "Replacement" : "Return";
}

function itemSummary(request: ReturnRequestRecord) {
  const labels = request.items.map((item) => item.lensLabel).filter(Boolean);
  if (labels.length === 0) return "No items";
  if (labels.length === 1) return labels[0]!;
  return `${labels[0]} +${labels.length - 1} more`;
}

function serverParamsForFilter(filter: FilterKey) {
  if (filter === "ACTIVE") {
    return { status: ACTIVE_STATUSES.join(",") };
  }
  if (filter === "HISTORY") {
    return { status: HISTORY_STATUSES.join(",") };
  }
  if (filter === "RETURN" || filter === "REPLACEMENT") {
    return { requestType: filter };
  }
  return {};
}

export function CustomerReturnsScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");
  const { page, setPage, items, onPageSuccess } =
    usePaginatedListState<ReturnRequestRecord>(activeFilter);

  const { data, loading, refreshing, error, refetch } = useGetReturnRequests(
    {
      page,
      limit: PAGE_SIZE,
      ...serverParamsForFilter(activeFilter),
    },
    { onSuccess: onPageSuccess }
  );

  const showInitialLoading = loading && page === 1 && items.length === 0;
  const hasMore = Boolean(data?.hasMore);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--brand-text)] sm:text-3xl">
            Returns &amp; Replacements
          </h1>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
            Track request status and full history for your orders
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-xl border-[var(--brand-input-border)]"
          disabled={loading || refreshing}
          onClick={() => {
            setPage(1);
            void refetch();
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

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
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

      {showInitialLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <QueryErrorState
          message={error.message}
          onRetry={() => {
            setPage(1);
            void refetch();
          }}
        />
      ) : items.length === 0 ? (
        <QueryEmptyState
          message={
            activeFilter === "ALL"
              ? "No return requests yet"
              : "No requests match this filter"
          }
        >
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
            Submit a return or replacement from an order detail page.
          </p>
          <Button asChild variant="outline" className="mt-4 rounded-xl">
            <Link href="/my-orders">Go to My Orders</Link>
          </Button>
        </QueryEmptyState>
      ) : (
        <div className="space-y-3">
          {items.map((request) => (
            <Link
              key={request.id}
              href={`/returns/${request.id}`}
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
                  <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">
                    {typeLabel(request.requestType)}
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

              <div className="mt-3 flex items-start gap-2 text-sm text-[var(--brand-text-muted)]">
                <Package className="mt-0.5 size-4 shrink-0 text-[var(--brand-primary)]" />
                <p className="line-clamp-2 font-medium">{itemSummary(request)}</p>
              </div>

              {request.rejectionReason ? (
                <p className="mt-3 text-sm font-medium text-[var(--brand-danger)]">
                  {request.rejectionReason}
                </p>
              ) : null}

              <p className="mt-3 text-xs font-semibold text-[var(--brand-text-muted)]">
                {formatDate(request.createdAt)}
              </p>
            </Link>
          ))}
          <QueryLoadMoreButton
            hasMore={hasMore}
            loading={loading || refreshing}
            onLoadMore={() => setPage((p) => p + 1)}
          />
        </div>
      )}
    </div>
  );
}
