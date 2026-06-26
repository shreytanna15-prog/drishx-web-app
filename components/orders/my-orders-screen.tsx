"use client";

import { ClipboardList, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OrderListCard } from "@/components/orders/order-list-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import {
  groupOrdersForList,
  type OrderListGroup,
} from "@/lib/order-list-display";
import { normalizeOrderStatus } from "@/lib/order-tracking";
import { fetchOrders } from "@/lib/orders-api";
import type { OrderRecord } from "@/lib/types/orders";
import { cn } from "@/lib/utils";

type FilterKey = "ALL" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

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
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

  const orderGroups = useMemo(
    () => groupOrdersForList(orders, user?.businessName, "Your company"),
    [orders, user?.businessName]
  );

  const loadOrders = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const filteredGroups = useMemo(
    () => orderGroups.filter((group) => groupMatchesFilter(group, activeFilter)),
    [orderGroups, activeFilter]
  );

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--brand-text)] sm:text-3xl">
            My Orders
          </h1>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
            Track your lens orders
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-xl border-[var(--brand-input-border)]"
          onClick={() => {
            setRefreshing(true);
            void loadOrders();
          }}
          disabled={loading || refreshing}
          aria-label="Refresh orders"
        >
          {refreshing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
        </Button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FILTER_OPTIONS.map((entry) => {
          const active = activeFilter === entry.key;
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => setActiveFilter(entry.key)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors",
                active
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]"
                  : "border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
              )}
            >
              {entry.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[var(--brand-danger-border)] bg-[var(--brand-danger-bg)] px-4 py-8 text-center">
          <p className="text-sm font-medium text-[var(--brand-danger)]">{error}</p>
          <Button
            className="mt-4 rounded-xl"
            onClick={() => {
              setLoading(true);
              void loadOrders();
            }}
          >
            Retry
          </Button>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-16 text-center">
          <ClipboardList className="mx-auto mb-3 size-10 text-[var(--brand-text-muted)]" />
          <p className="text-sm font-medium text-[var(--brand-text-muted)]">
            {activeFilter === "ALL"
              ? "No orders yet. Place your first order from the shop."
              : "No orders match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group) => (
            <OrderListCard key={group.key} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
