"use client";

import { ClipboardList, Loader2, RefreshCw, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmployeeOrderListCard } from "@/components/employee/employee-order-list-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  enrichOrdersWithCatalogStock,
  groupOrdersForList,
  type OrderListGroup,
} from "@/lib/order-list-display";
import { normalizeOrderStatus } from "@/lib/order-tracking";
import { fetchOrders } from "@/lib/orders-api";
import type { OrderRecord } from "@/lib/types/orders";
import { cn } from "@/lib/utils";

type StaffOrderFilter = "ALL" | "IN_PROGRESS" | "COMPLETED";

const FILTERS: { key: StaffOrderFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
];

function isInProgressStatus(status: string): boolean {
  const normalized = normalizeOrderStatus(status);
  return normalized !== "COMPLETED" && normalized !== "CANCELLED";
}

function groupMatchesStaffFilter(
  group: OrderListGroup,
  filter: StaffOrderFilter
): boolean {
  if (filter === "ALL") return true;
  if (filter === "COMPLETED") {
    return group.orders.some(
      (order) => normalizeOrderStatus(order.status) === "COMPLETED"
    );
  }
  return group.orders.some((order) => isInProgressStatus(order.status));
}

export function EmployeeOrdersScreen() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<StaffOrderFilter>("ALL");

  const loadOrders = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchOrders();
      const withStock = await enrichOrdersWithCatalogStock(data);
      setOrders(withStock);
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

  const orderGroups = useMemo(() => {
    const staffOrders = orders.filter(
      (order) => normalizeOrderStatus(order.status) !== "AWAITING_PROCUREMENT"
    );
    return groupOrdersForList(staffOrders);
  }, [orders]);

  const filteredGroups = useMemo(
    () => orderGroups.filter((group) => groupMatchesStaffFilter(group, activeFilter)),
    [orderGroups, activeFilter]
  );

  return (
    <div className="relative mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(100%,36rem)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--brand-text)] sm:text-3xl">
              Orders
            </h1>
            <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
              Manage and update customer orders
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              asChild
              className="h-9 rounded-xl bg-[var(--brand-primary)] px-3 text-xs font-extrabold text-[var(--brand-primary-text)] hover:opacity-95 sm:px-4 sm:text-sm"
            >
              <Link href="/employee/orders/on-behalf">
                <ShoppingCart className="size-4" />
                <span className="hidden sm:inline">Order on Behalf</span>
                <span className="sm:hidden">On Behalf</span>
              </Link>
            </Button>
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
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
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

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
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
                ? "No orders found."
                : "No orders match this filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((group) => (
              <EmployeeOrderListCard key={group.key} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
