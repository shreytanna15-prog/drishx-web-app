"use client";

import { LensProductCard } from "@/components/shop/lens-product-card";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import {
  formatOrderAmount,
  formatOrderDateTime,
  orderToLensItem,
  type OrderListGroup,
} from "@/lib/order-list-display";
import { formatPairQuantity, pairsFromPieces } from "@/lib/order-quantity";
import { normalizeOrderStatus } from "@/lib/order-tracking";
import type { OrderRecord } from "@/lib/types/orders";
import { cn } from "@/lib/utils";

type EmployeeProcurementOrderCardProps = {
  group: OrderListGroup;
  onProductPress: (order: OrderRecord) => void;
};

export function EmployeeProcurementOrderCard({
  group,
  onProductPress,
}: EmployeeProcurementOrderCardProps) {
  const visibleOrders = group.orders.filter(
    (order) => normalizeOrderStatus(order.status) === "AWAITING_PROCUREMENT"
  );
  const pairCount = visibleOrders.reduce(
    (sum, order) =>
      sum + pairsFromPieces(Math.max(1, Number(order.quantity) || 1)),
    0
  );
  const totalAmount = visibleOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0
  );

  if (visibleOrders.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 sm:p-5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-extrabold text-[var(--brand-text)] sm:text-lg">
          {group.displayOrderId}
        </p>
        <OrderStatusPill
          label={group.status.label}
          variant={group.status.variant}
        />
      </div>

      <p className="mt-2 text-sm font-bold text-[var(--brand-text)]">
        {group.companyName}
      </p>
      <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
        {formatOrderDateTime(group.createdAt)}
      </p>

      <div className="mt-3 space-y-2">
        {visibleOrders.map((order) => {
          const orderedPairs = pairsFromPieces(
            Math.max(1, Number(order.quantity) || 1)
          );
          return (
            <button
              key={order.id}
              type="button"
              onClick={() => onProductPress(order)}
              className="block w-full text-left transition-opacity hover:opacity-90"
            >
              <LensProductCard
                item={orderToLensItem(order)}
                quantityHint={`${formatPairQuantity(orderedPairs)} ordered`}
                className="border-[var(--brand-primary)]/20 bg-[color-mix(in_srgb,var(--brand-card)_94%,var(--brand-primary)_6%)] p-3"
              />
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[var(--brand-text)]">
          {visibleOrders.length} Product
          {visibleOrders.length === 1 ? "" : "s"} · {formatPairQuantity(pairCount)}{" "}
          Pair
          {pairCount === 1 ? "" : "s"}
        </p>
        <p className="text-base font-extrabold text-[var(--brand-text)]">
          ₹{formatOrderAmount(totalAmount)}
        </p>
      </div>
    </div>
  );
}
