"use client";

import {
  ChevronLeft,
  Download,
  Loader2,
  Printer,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  EmployeeOrderGroupDetail,
  EmployeePhotoOrderDetail,
} from "@/components/employee/employee-order-group-detail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { groupOrdersForList, filterStaffFulfillmentOrders } from "@/lib/order-list-display";
import {
  downloadEmployeeOrderPdf,
  printEmployeeOrder,
} from "@/lib/order-print";
import type { OrderTrackingStatus } from "@/lib/order-tracking";
import { fetchOrders, updateOrderStatus } from "@/lib/orders-api";
import type { OrderRecord } from "@/lib/types/orders";

export function EmployeeOrderDetailScreen() {
  const params = useParams<{ id: string }>();
  const groupKey = decodeURIComponent(params.id);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"print" | "download" | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const orderGroup = useMemo(() => {
    const targetKey =
      groupKey ||
      orders.find((order) => order.id === groupKey)?.checkoutBatchId?.trim() ||
      groupKey;

    // Match Orders list: never include procurement lines in fulfillment detail.
    const staffOrders = filterStaffFulfillmentOrders(orders);

    const batch = staffOrders.filter(
      (order) => (order.checkoutBatchId?.trim() || order.id) === targetKey
    );

    if (batch.length === 0) {
      const single = staffOrders.find((order) => order.id === groupKey);
      if (!single) return null;
      return groupOrdersForList([single])[0] ?? null;
    }

    return groupOrdersForList(batch)[0] ?? null;
  }, [groupKey, orders]);

  const handleUpdateLine = useCallback(
    async (
      orderId: string,
      payload: { status: OrderTrackingStatus; pickedQuantity: number }
    ) => {
      setUpdatingOrderId(orderId);
      try {
        await updateOrderStatus(
          orderId,
          payload.status,
          payload.pickedQuantity
        );
        await loadOrders();
      } catch (err) {
        window.alert(
          err instanceof Error ? err.message : "Failed to update order."
        );
      } finally {
        setUpdatingOrderId(null);
      }
    },
    [loadOrders]
  );

  const handlePrintOrder = useCallback(async () => {
    if (!orderGroup) return;
    setExporting("print");
    try {
      await printEmployeeOrder(orderGroup);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Could not print order."
      );
    } finally {
      setExporting(null);
    }
  }, [orderGroup]);

  const handleDownloadOrder = useCallback(async () => {
    if (!orderGroup) return;
    setExporting("download");
    try {
      await downloadEmployeeOrderPdf(orderGroup);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Could not download order."
      );
    } finally {
      setExporting(null);
    }
  }, [orderGroup]);

  const showExportActions = Boolean(orderGroup) && !loading && !error;

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-2 border-b border-[var(--brand-card-border)] pb-4 sm:gap-3">
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-xl border-[var(--brand-input-border)]"
          asChild
        >
          <Link href="/employee/orders" aria-label="Back to orders">
            <ChevronLeft className="size-5 text-[var(--brand-primary)]" />
          </Link>
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-center text-lg font-extrabold text-[var(--brand-text)] sm:text-xl">
          {orderGroup?.displayOrderId ?? "Order details"}
        </h1>
        {showExportActions ? (
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-xl border-[var(--brand-input-border)]"
              onClick={() => void handlePrintOrder()}
              disabled={exporting !== null}
              aria-label="Print order"
            >
              {exporting === "print" ? (
                <Loader2 className="size-4 animate-spin text-[var(--brand-primary)]" />
              ) : (
                <Printer className="size-4 text-[var(--brand-primary)]" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-xl border-[var(--brand-input-border)]"
              onClick={() => void handleDownloadOrder()}
              disabled={exporting !== null}
              aria-label="Download order"
            >
              {exporting === "download" ? (
                <Loader2 className="size-4 animate-spin text-[var(--brand-primary)]" />
              ) : (
                <Download className="size-4 text-[var(--brand-primary)]" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-xl border-[var(--brand-input-border)]"
              onClick={() => {
                setRefreshing(true);
                void loadOrders();
              }}
              disabled={loading || refreshing || exporting !== null}
              aria-label="Refresh order"
            >
              {refreshing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="w-9 shrink-0 sm:w-[7.5rem]" aria-hidden />
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[var(--brand-danger-border)] bg-[var(--brand-danger-bg)] px-4 py-8 text-center">
          <p className="text-sm font-medium text-[var(--brand-danger)]">{error}</p>
          <Button className="mt-4 rounded-xl" onClick={() => void loadOrders()}>
            Retry
          </Button>
        </div>
      ) : !orderGroup ? (
        <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-16 text-center">
          <p className="text-sm font-medium text-[var(--brand-text-muted)]">
            Order not found.
          </p>
          <Button className="mt-4 rounded-xl" asChild>
            <Link href="/employee/orders">Back to Orders</Link>
          </Button>
        </div>
      ) : orderGroup.isPhotoOrder ? (
        <EmployeePhotoOrderDetail
          group={orderGroup}
          onUpdateStatus={(orderId, status) =>
            handleUpdateLine(orderId, {
              status,
              pickedQuantity: (() => {
                const order = orderGroup.orders.find(
                  (entry) => entry.id === orderId
                );
                const value = order?.pickedQuantity;
                return typeof value === "number" && Number.isFinite(value)
                  ? Math.floor(value)
                  : 0;
              })(),
            })
          }
          updatingOrderId={updatingOrderId}
        />
      ) : (
        <EmployeeOrderGroupDetail
          group={orderGroup}
          onUpdateLine={handleUpdateLine}
          updatingOrderId={updatingOrderId}
        />
      )}
    </div>
  );
}
