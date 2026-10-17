"use client";

import {
  CheckCircle2,
  ClipboardList,
  Search,
  Timer,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { OrderListCard } from "@/components/orders/order-list-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { usePaginatedListState } from "@/lib/hooks/use-paginated-list-state";
import {
  groupOrdersForList,
  type OrderListGroup,
} from "@/lib/order-list-display";
import { useGetOrders } from "@/lib/modules/orders/query/use-get-orders";
import { normalizeOrderStatus } from "@/lib/order-tracking";
import type { OrderRecord } from "@/lib/types/orders";
import { cn } from "@/lib/utils";

type FilterKey = "ALL" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const FILTER_OPTIONS: {
  key: FilterKey;
  label: string;
  icon: typeof ClipboardList;
}[] = [
  { key: "ALL", label: "All Orders", icon: ClipboardList },
  { key: "IN_PROGRESS", label: "In Progress", icon: Timer },
  { key: "COMPLETED", label: "Completed", icon: CheckCircle2 },
  { key: "CANCELLED", label: "Cancelled", icon: XCircle },
];

const IN_PROGRESS_STATUS =
  "PENDING,PICKING,PACKED,DISPATCHED,PARTIALLY_FULFILLED,AWAITING_PROCUREMENT";

function statusParamForFilter(filter: FilterKey): string | undefined {
  if (filter === "ALL") return undefined;
  if (filter === "COMPLETED") return "COMPLETED";
  if (filter === "CANCELLED") return "CANCELLED";
  return IN_PROGRESS_STATUS;
}

function isInProgressStatus(status: string): boolean {
  const normalized = normalizeOrderStatus(status);
  return (
    normalized === "PENDING" ||
    normalized === "PICKING" ||
    normalized === "PACKED" ||
    normalized === "DISPATCHED" ||
    normalized === "PARTIALLY_FULFILLED" ||
    normalized === "AWAITING_PROCUREMENT"
  );
}

function orderMatchesFilter(order: OrderRecord, filter: FilterKey): boolean {
  const normalized = normalizeOrderStatus(order.status);
  if (filter === "ALL") return true;
  if (filter === "COMPLETED") return normalized === "COMPLETED";
  if (filter === "CANCELLED") return normalized === "CANCELLED";
  return isInProgressStatus(normalized);
}

function groupMatchesFilter(group: OrderListGroup, filter: FilterKey): boolean {
  return group.orders.some((order) => orderMatchesFilter(order, filter));
}

export function MyOrdersScreen() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchQuery.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  const listResetKey = `${activeFilter}|${debouncedQ}`;
  const { page, setPage, items, onPageSuccess } =
    usePaginatedListState<OrderRecord>(listResetKey);

  const {
    data,
    loading,
    refreshing,
    error,
    refetch,
  } = useGetOrders(
    {
      page,
      limit: 20,
      status: statusParamForFilter(activeFilter),
      q: debouncedQ || undefined,
    },
    { onSuccess: onPageSuccess }
  );

  const orderGroups = useMemo(
    () => groupOrdersForList(items, user?.businessName, "Your company"),
    [items, user?.businessName]
  );

  // Server already filtered by status/q; keep group-level match for multi-line batches.
  const filteredGroups = useMemo(() => {
    return orderGroups.filter((group) => groupMatchesFilter(group, activeFilter));
  }, [orderGroups, activeFilter]);

  const showInitialLoading = loading && page === 1 && items.length === 0;
  const hasMore = Boolean(data?.hasMore);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--brand-text)] sm:text-3xl">
            My Orders
          </h1>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
            Track, manage & reorder your lens orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "size-10 shrink-0 rounded-full border-[var(--brand-primary)] text-[var(--brand-primary)]",
              searchOpen && "bg-[var(--brand-primary)]/12"
            )}
            onClick={() => setSearchOpen((open) => !open)}
            aria-label="Search orders"
          >
            <Search className="size-4" />
          </Button>
        </div>
      </div>

      {searchOpen ? (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-3 py-2.5">
          <Search className="size-4 text-[var(--brand-text-muted)]" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by order ID or company"
            className="w-full bg-transparent text-sm text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-placeholder)]"
            autoFocus
          />
        </div>
      ) : null}

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map((entry) => {
          const active = activeFilter === entry.key;
          const Icon = entry.icon;
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => setActiveFilter(entry.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors",
                active
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]"
                  : "border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
              )}
            >
              <Icon className="size-3.5" />
              {entry.label}
            </button>
          );
        })}
      </div>

      {showInitialLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[var(--brand-danger-border)] bg-[var(--brand-danger-bg)] px-4 py-8 text-center">
          <p className="text-sm font-medium text-[var(--brand-danger)]">
            {error.message}
          </p>
          <Button
            className="mt-4 rounded-xl"
            onClick={() => {
              void refetch();
            }}
          >
            Retry
          </Button>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-16 text-center">
          <ClipboardList className="mx-auto mb-3 size-10 text-[var(--brand-text-muted)]" />
          <p className="text-sm font-medium text-[var(--brand-text-muted)]">
            {activeFilter === "ALL" && !searchQuery.trim()
              ? "No orders yet. Place your first order from the shop."
              : "No orders match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group) => (
            <OrderListCard key={group.key} group={group} />
          ))}
          {hasMore ? (
            <Button
              variant="outline"
              className="w-full rounded-xl"
              disabled={loading || refreshing}
              onClick={() => setPage((p) => p + 1)}
            >
              {loading || refreshing ? "Loading…" : "Load more"}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
