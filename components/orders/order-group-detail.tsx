"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { OrderProductSectionCard } from "@/components/orders/order-product-section";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import { OrderTrackingHorizontal } from "@/components/orders/order-tracking-horizontal";
import {
  buildOrderProductSections,
  getBatchTrackingStatus,
} from "@/lib/order-detail-display";
import {
  formatOrderAmount,
  formatOrderDateTime,
  isColorLensOrder,
  isRxOrder,
  type OrderListGroup,
} from "@/lib/order-list-display";
import { normalizeOrderStatus } from "@/lib/order-tracking";
import { cancelOrder, resolveOrderImageUrl } from "@/lib/orders-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OrderGroupDetailProps = {
  group: OrderListGroup;
  onOrderCancelled?: () => void;
};

function OrderNotesDisplay({ notes }: { notes: string }) {
  const lines = notes.split("\n").filter((line) => line.trim());

  return (
    <div className="space-y-1">
      {lines.map((line, index) => (
        <p
          key={`${index}-${line}`}
          className="text-sm leading-5 text-[var(--brand-text)]"
        >
          {line}
        </p>
      ))}
    </div>
  );
}

export function OrderGroupDetail({ group, onOrderCancelled }: OrderGroupDetailProps) {
  const productSections = useMemo(
    () => buildOrderProductSections(group.orders),
    [group.orders]
  );
  const trackingStatus = useMemo(
    () => getBatchTrackingStatus(group.orders),
    [group.orders]
  );
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const [referenceLoadFailed, setReferenceLoadFailed] = useState(false);

  const orderReferenceUrl = useMemo(() => {
    const orderWithImage = group.orders.find(
      (order) =>
        (isColorLensOrder(order) || isRxOrder(order)) &&
        order.orderImageUrl?.trim()
    );
    const raw = orderWithImage?.orderImageUrl?.trim() ?? null;
    return raw ? resolveOrderImageUrl(raw) : null;
  }, [group.orders]);

  useEffect(() => {
    setPhotoLoadFailed(false);
    setReferenceLoadFailed(false);
  }, [group.key, group.photoUrl, orderReferenceUrl]);

  const cancellableOrders = group.orders.filter((order) => {
    const status = normalizeOrderStatus(order.status);
    return status === "PENDING" || status === "AWAITING_PROCUREMENT";
  });

  async function handleCancel(orderId: string) {
    const confirmed = window.confirm(
      "Cancel this product line from your order?"
    );
    if (!confirmed) {
      return;
    }

    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
      onOrderCancelled?.();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Failed to cancel order."
      );
    } finally {
      setCancellingId(null);
    }
  }

  if (group.isPhotoOrder) {
    const order = group.orders[0];
    const rawImageUrl = group.photoUrl ?? order.orderImageUrl ?? null;
    const photoUri = rawImageUrl ? resolveOrderImageUrl(rawImageUrl) : null;
    const canCancel = normalizeOrderStatus(order.status) === "PENDING";

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 sm:p-5">
          <p className="text-2xl font-extrabold text-[var(--brand-text)]">
            {group.displayOrderId}
          </p>
          <div className="mt-2">
            <OrderStatusPill
              label={group.status.label}
              variant={group.status.variant}
            />
          </div>
          <p className="mt-3 text-lg font-extrabold text-[var(--brand-text)]">
            {group.companyName}
          </p>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
            {formatOrderDateTime(group.createdAt)}
          </p>
          <p className="mt-3 text-sm font-semibold text-[var(--brand-primary)]">
            Your order will be placed soon. Details are in your photo.
          </p>
        </div>

        {photoUri && !photoLoadFailed ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUri}
              alt="Prescription photo"
              className="size-full object-contain"
              onError={() => setPhotoLoadFailed(true)}
            />
          </div>
        ) : (
          <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)]">
            <ImageOff className="size-10 text-[var(--brand-text-muted)]" />
            <p className="px-4 text-center text-sm text-[var(--brand-text-muted)]">
              {photoUri ? "Could not load prescription photo" : "Photo unavailable"}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 sm:p-5">
          <OrderTrackingHorizontal status={trackingStatus} />
        </div>

        {canCancel ? (
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl border-[var(--brand-card-border)] bg-[var(--brand-primary)]/8 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/12"
            disabled={cancellingId === order.id}
            onClick={() => void handleCancel(order.id)}
          >
            {cancellingId === order.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Cancel photo order"
            )}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 sm:p-5">
        <p className="text-2xl font-extrabold text-[var(--brand-text)]">
          {group.displayOrderId}
        </p>
        <div className="mt-2">
          <OrderStatusPill
            label={group.status.label}
            variant={group.status.variant}
          />
        </div>
        <p className="mt-3 text-lg font-extrabold text-[var(--brand-text)]">
          {group.companyName}
        </p>
        <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
          {formatOrderDateTime(group.createdAt)}
        </p>
      </div>

      {orderReferenceUrl && !referenceLoadFailed ? (
        <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--brand-text)]">
            Prescription reference
          </p>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-[var(--brand-card-border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={orderReferenceUrl}
              alt="Prescription reference"
              className="size-full object-contain"
              onError={() => setReferenceLoadFailed(true)}
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-3 divide-x divide-[var(--brand-card-border)] rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] py-4">
        <div className="flex flex-col items-center px-2">
          <p className="text-base font-extrabold text-[var(--brand-text)]">
            {group.productCount}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[var(--brand-text-muted)]">
            Products
          </p>
        </div>
        <div className="flex flex-col items-center px-2">
          <p className="text-base font-extrabold text-[var(--brand-text)]">
            {group.pairCount}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[var(--brand-text-muted)]">
            Pairs
          </p>
        </div>
        <div className="flex flex-col items-center px-2">
          <p className="text-base font-extrabold text-[var(--brand-text)]">
            ₹{formatOrderAmount(group.totalAmount)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[var(--brand-text-muted)]">
            Amount
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-bold text-[var(--brand-text)]">
          Products & power combinations
        </h2>
        <div className="space-y-3">
          {productSections.map((section) => (
            <OrderProductSectionCard key={section.key} section={section} />
          ))}
        </div>
      </div>

      {group.orders.some((order) => order.notes?.trim()) ? (
        <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--brand-primary)]">
            Order notes
          </p>
          <OrderNotesDisplay
            notes={
              group.orders.find((order) => order.notes?.trim())?.notes?.trim() ??
              ""
            }
          />
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 sm:p-5">
        <OrderTrackingHorizontal status={trackingStatus} />
      </div>

      {cancellableOrders.length > 0 ? (
        <div className="space-y-2">
          {cancellableOrders.map((order) => (
            <Button
              key={order.id}
              variant="outline"
              className={cn(
                "h-12 w-full rounded-xl border-[var(--brand-card-border)] bg-[var(--brand-primary)]/8 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/12"
              )}
              disabled={cancellingId === order.id}
              onClick={() => void handleCancel(order.id)}
            >
              {cancellingId === order.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                `Cancel line · ${order.quantity} pairs`
              )}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
