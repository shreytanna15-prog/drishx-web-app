"use client";

import {
  ArrowLeft,
  ClipboardList,
  FlaskConical,
  Loader2,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmployeeOrderListCard } from "@/components/employee/employee-order-list-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { mergePaginatedItems, usePaginatedListState } from "@/lib/hooks/use-paginated-list-state";
import {
  enrichOrdersWithCatalogStock,
  filterStaffFulfillmentOrders,
  groupOrdersForList,
  type OrderListGroup,
} from "@/lib/order-list-display";
import { normalizeOrderStatus } from "@/lib/order-tracking";
import { useGetOrders } from "@/lib/modules/orders/query/use-get-orders";
import type { OrderRecord } from "@/lib/types/orders";
import { cn } from "@/lib/utils";

type StaffOrderFilter =
  | "ALL"
  | "PENDING"
  | "PICKING"
  | "PACKED"
  | "COMPLETED";

const FILTERS: { key: StaffOrderFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "PICKING", label: "Picking" },
  { key: "PACKED", label: "Packed" },
  { key: "COMPLETED", label: "Completed" },
];

/** Statuses that belong under each staff filter tab. */
const FILTER_STATUSES: Record<
  Exclude<StaffOrderFilter, "ALL">,
  ReturnType<typeof normalizeOrderStatus>[]
> = {
  PENDING: ["PENDING"],
  PICKING: ["PICKING", "PARTIALLY_FULFILLED"],
  PACKED: ["PACKED", "DISPATCHED"],
  COMPLETED: ["COMPLETED"],
};

function groupMatchesStaffFilter(
  group: OrderListGroup,
  filter: StaffOrderFilter
): boolean {
  if (filter === "ALL") return true;
  const allowed = FILTER_STATUSES[filter];
  return group.orders.some((order) =>
    allowed.includes(normalizeOrderStatus(order.status))
  );
}

export type EmployeeOrdersScreenVariant = "standard" | "rx";

type EmployeeOrdersScreenProps = {
  variant?: EmployeeOrdersScreenVariant;
};

export function EmployeeOrdersScreen({
  variant = "standard",
}: EmployeeOrdersScreenProps) {
  const isRx = variant === "rx";
  const [activeFilter, setActiveFilter] = useState<StaffOrderFilter>("ALL");
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const listResetKey = `${activeFilter}|${isRx ? "rx" : "std"}`;
  const { page, setPage, items: orders, setItems: setOrders } =
    usePaginatedListState<OrderRecord>(listResetKey);

  const [enrichEpoch, setEnrichEpoch] = useState(0);
  const [enrichEpochKey, setEnrichEpochKey] = useState(listResetKey);
  if (listResetKey !== enrichEpochKey) {
    setEnrichEpochKey(listResetKey);
    setEnrichEpoch((e) => e + 1);
  }
  const enrichEpochRef = useRef(enrichEpoch);
  useEffect(() => {
    enrichEpochRef.current = enrichEpoch;
  }, [enrichEpoch]);

  const staffStatus =
    activeFilter === "ALL"
      ? undefined
      : FILTER_STATUSES[activeFilter].join(",");

  const {
    data: rawPage,
    loading,
    refreshing,
    error,
    refetch,
  } = useGetOrders(
    {
      page,
      limit: 30,
      status: staffStatus,
      scope: isRx ? "rx_lab" : "catalog",
    },
    {
      // Catalog stock enrichment stays client-side after the shared orders fetch.
      onSuccess: (pageData) => {
        const startedEpoch = enrichEpochRef.current;
        setEnriching(true);
        setEnrichError(null);
        void (async () => {
          try {
            const withStock = await enrichOrdersWithCatalogStock(pageData.items);
            if (startedEpoch !== enrichEpochRef.current) return;
            setOrders((prev) =>
              mergePaginatedItems(prev, { page: pageData.page, items: withStock })
            );
          } catch (err) {
            if (startedEpoch !== enrichEpochRef.current) return;
            setOrders([]);
            setEnrichError(
              err instanceof Error ? err.message : "Failed to load orders."
            );
          } finally {
            if (startedEpoch === enrichEpochRef.current) setEnriching(false);
          }
        })();
      },
    }
  );

  const orderGroups = useMemo(() => {
    const fulfillment = filterStaffFulfillmentOrders(orders);
    return groupOrdersForList(fulfillment);
  }, [orders]);

  const filteredGroups = useMemo(
    () =>
      orderGroups.filter((group) => groupMatchesStaffFilter(group, activeFilter)),
    [orderGroups, activeFilter]
  );

  const showLoading =
    (loading && page === 1 && orders.length === 0) || (enriching && page === 1);
  const displayError = error?.message ?? enrichError;
  const hasMore = Boolean(rawPage?.hasMore);

  const emptyMessage =
    activeFilter === "ALL"
      ? isRx
        ? "No RX orders assigned to you yet."
        : "No orders assigned to you yet."
      : isRx
        ? "No assigned RX orders match this filter."
        : "No assigned orders match this filter.";

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
              {isRx ? "Rx Orders" : "Orders"}
            </h1>
            <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
              {isRx
                ? "Prescription RX orders assigned to you"
                : "Orders assigned to you"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {isRx ? (
              <Button
                asChild
                variant="outline"
                className="h-9 rounded-xl border-[var(--brand-input-border)] px-3 text-xs font-extrabold sm:px-4 sm:text-sm"
              >
                <Link href="/employee/orders">
                  <ArrowLeft className="size-4" />
                  <span className="hidden sm:inline">All Orders</span>
                  <span className="sm:hidden">Orders</span>
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="h-9 rounded-xl border-[var(--brand-input-border)] px-3 text-xs font-extrabold sm:px-4 sm:text-sm"
                >
                  <Link href="/employee/orders/rx">
                    <FlaskConical className="size-4" />
                    <span className="hidden sm:inline">Rx Orders</span>
                    <span className="sm:hidden">Rx</span>
                  </Link>
                </Button>
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
              </>
            )}
            <Button
              variant="outline"
              size="icon"
              className="size-9 shrink-0 rounded-xl border-[var(--brand-input-border)]"
              onClick={() => {
                void refetch();
              }}
              disabled={showLoading || refreshing}
              aria-label={isRx ? "Refresh RX orders" : "Refresh orders"}
            >
              {refreshing || enriching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-5 gap-1.5 sm:gap-2">
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  "rounded-xl border px-1.5 py-2.5 text-center text-[11px] font-bold transition-colors sm:px-3 sm:text-sm",
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

        {showLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : displayError ? (
          <div className="rounded-2xl border border-[var(--brand-danger-border)] bg-[var(--brand-danger-bg)] px-4 py-8 text-center">
            <p className="text-sm font-medium text-[var(--brand-danger)]">
              {displayError}
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
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((group) => (
              <EmployeeOrderListCard key={group.key} group={group} />
            ))}
            {hasMore ? (
              <Button
                variant="outline"
                className="w-full rounded-xl"
                disabled={loading || refreshing || enriching}
                onClick={() => setPage((p) => p + 1)}
              >
                {loading || refreshing || enriching ? "Loading…" : "Load more"}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
