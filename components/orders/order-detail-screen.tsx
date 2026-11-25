"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { OrderGroupDetail } from "@/components/orders/order-group-detail";
import { DeliverySummary } from "@/components/delivery/delivery-service-picker";
import { BrandConfirmDialog } from "@/components/shared/brand-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useBrandConfirm } from "@/hooks/use-brand-confirm";
import { groupOrdersForList } from "@/lib/order-list-display";
import { useGetOrderGroup } from "@/lib/modules/orders/query/use-get-order-group";
import { cancelOrder } from "@/lib/orders-api";

const CUSTOMER_CANCEL_STATUSES = new Set(["PENDING", "AWAITING_PROCUREMENT"]);

/**
 * Order detail loads the checkout batch (or single order) via batchId / detail GET —
 * not the full unbounded orders list (RW-11 Phase B).
 */
export function OrderDetailScreen() {
  const params = useParams<{ id: string }>();
  const groupKey = decodeURIComponent(params.id);
  const { user } = useAuth();
  const { data: orders = [], loading, error, refetch } = useGetOrderGroup(groupKey);
  const { confirm, open, options, onConfirm, onCancel } = useBrandConfirm();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const group = useMemo(() => {
    const groups = groupOrdersForList(orders, user?.businessName, "Your company");
    return (
      groups.find((entry) => entry.key === groupKey) ??
      groups.find((entry) => entry.orders.some((order) => order.id === groupKey)) ??
      null
    );
  }, [orders, user?.businessName, groupKey]);

  async function handleCancel(orderId: string, label: string) {
    setCancelError(null);
    const ok = await confirm({
      title: "Cancel this order?",
      description: `Order #${label} will be cancelled and reserved stock released.`,
      confirmLabel: "Cancel order",
      destructive: true,
    });
    if (!ok) return;
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
      await refetch();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Could not cancel order.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3 border-b border-(--brand-card-border) pb-4">
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-xl border-(--brand-input-border)"
          asChild
        >
          <Link href="/my-orders" aria-label="Back to orders">
            <ChevronLeft className="size-5 text-(--brand-primary)" />
          </Link>
        </Button>
        <h1 className="flex-1 text-center text-lg font-extrabold text-(--brand-text) sm:text-xl">
          {group?.displayOrderId ?? "Order Details"}
        </h1>
        <div className="size-9 shrink-0" aria-hidden />
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-(--brand-danger-border) bg-(--brand-danger-bg) px-4 py-8 text-center">
          <p className="text-sm font-medium text-(--brand-danger)">
            {error.message}
          </p>
          <Button className="mt-4 rounded-xl" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : !group ? (
        <div className="rounded-2xl border border-(--brand-card-border) bg-(--brand-card) px-4 py-16 text-center">
          <p className="text-sm font-medium text-(--brand-text-muted)">
            Order not found.
          </p>
          <Button className="mt-4 rounded-xl" asChild>
            <Link href="/my-orders">Back to My Orders</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <OrderGroupDetail group={group} />
          <DeliverySummary order={group.orders[0]!} />
          {cancelError ? <p role="alert" className="text-sm text-(--brand-danger)">{cancelError}</p> : null}
          {group.orders.filter((order) => CUSTOMER_CANCEL_STATUSES.has(order.status)).map((order) => {
            const label = String(order.orderNumber ?? order.id.slice(-8));
            return (
              <Button
                key={`cancel-${order.id}`}
                variant="outline"
                className="border-red-400/40 text-red-600 hover:bg-red-50"
                disabled={cancellingId === order.id}
                onClick={() => void handleCancel(order.id, label)}
              >
                {cancellingId === order.id ? "Cancelling…" : `Cancel order #${label}`}
              </Button>
            );
          })}
          {group.orders.filter((order) => order.lensProductPowerId && !['CANCELLED', 'COMPLETED', 'DISPATCHED'].includes(order.status)).map((order) => (
            <Button key={order.id} variant="outline" asChild>
              <Link href={`/my-orders/${order.id}/change`}>Request change to order #{order.orderNumber ?? order.id.slice(-8)}</Link>
            </Button>
          ))}
        </div>
      )}
      <BrandConfirmDialog open={open} options={options} onConfirm={onConfirm} onCancel={onCancel} />
    </div>
  );
}
