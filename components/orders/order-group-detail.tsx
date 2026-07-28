"use client";

import { useMemo, useState } from "react";
import { ImageOff } from "lucide-react";
import { OrderProductSectionCard } from "@/components/orders/order-product-section";
import { ReturnRequestPanel } from "@/components/orders/return-request-panel";
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
import { resolveOrderImageUrl } from "@/lib/orders-api";

import { OrderNotesDisplay } from "@/components/orders/order-notes-display";

type OrderGroupDetailProps = {
  group: OrderListGroup;
};

export function OrderGroupDetail({ group }: OrderGroupDetailProps) {
  const productSections = useMemo(
    () => buildOrderProductSections(group.orders),
    [group.orders]
  );
  const trackingStatus = useMemo(
    () => getBatchTrackingStatus(group.orders),
    [group.orders]
  );
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const [failedReferenceUrl, setFailedReferenceUrl] = useState<string | null>(null);

  const orderReferenceUrl = useMemo(() => {
    const orderWithImage = group.orders.find(
      (order) =>
        (isColorLensOrder(order) || isRxOrder(order)) &&
        order.orderImageUrl?.trim()
    );
    const raw = orderWithImage?.orderImageUrl?.trim() ?? null;
    return raw ? resolveOrderImageUrl(raw) : null;
  }, [group.orders]);

  if (group.isPhotoOrder) {
    const order = group.orders[0];
    const rawImageUrl = group.photoUrl ?? order.orderImageUrl ?? null;
    const photoUri = rawImageUrl ? resolveOrderImageUrl(rawImageUrl) : null;
    const photoLoadFailed = photoUri != null && failedPhotoUrl === photoUri;

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
              onError={() => setFailedPhotoUrl(photoUri)}
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
      </div>
    );
  }

  const referenceLoadFailed =
    orderReferenceUrl != null && failedReferenceUrl === orderReferenceUrl;

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
              onError={() => setFailedReferenceUrl(orderReferenceUrl)}
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

      <ReturnRequestPanel group={group} />
    </div>
  );
}
