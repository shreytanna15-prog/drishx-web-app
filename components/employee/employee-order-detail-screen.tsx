"use client";

import { ChevronLeft, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  EmployeeOrderGroupDetail,
  EmployeePhotoOrderDetail,
} from "@/components/employee/employee-order-group-detail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { groupOrdersForList } from "@/lib/order-list-display";
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

    const batch = orders.filter(
      (order) => (order.checkoutBatchId?.trim() || order.id) === targetKey
    );

    if (batch.length === 0) {
      const single = orders.find((order) => order.id === groupKey);
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

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3 border-b border-[var(--brand-card-border)] pb-4">
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
        <h1 className="flex-1 text-center text-lg font-extrabold text-[var(--brand-text)] sm:text-xl">
          {orderGroup?.displayOrderId ?? "Order details"}
        </h1>
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-xl border-[var(--brand-input-border)]"
          onClick={() => {
            setRefreshing(true);
            void loadOrders();
          }}
          disabled={loading || refreshing}
          aria-label="Refresh order"
        >
          {refreshing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
        </Button>
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
