"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { LensProductCard } from "@/components/shop/lens-product-card";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import {
  formatOrderAmount,
  formatOrderDateTime,
  isColorLensOrder,
  isRxOrder,
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
  const [expanded, setExpanded] = useState(false);
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
  const hasColorOrder = visibleOrders.some(isColorLensOrder);
  const hasRxOrder = visibleOrders.some(isRxOrder);

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
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold text-[var(--brand-text)] sm:text-lg">
            {group.displayOrderId}
          </p>
          <p className="mt-2 text-sm font-bold text-[var(--brand-text)]">
            {group.companyName}
          </p>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
            {formatOrderDateTime(group.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <OrderStatusPill
            label={group.status.label}
            variant={group.status.variant}
          />
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary)]/10"
            aria-expanded={expanded}
            aria-label={
              expanded
                ? `Collapse products for ${group.displayOrderId}`
                : `Expand products for ${group.displayOrderId}`
            }
          >
            {formatPairQuantity(pairCount)} pr
            {expanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
        </div>
      </div>

      {hasColorOrder || hasRxOrder ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {hasColorOrder ? (
            <span className="rounded-lg border border-violet-500/35 bg-violet-500/14 px-2.5 py-1 text-xs font-bold text-violet-500">
              Color order
            </span>
          ) : null}
          {hasRxOrder ? (
            <span className="rounded-lg border border-sky-500/35 bg-sky-500/14 px-2.5 py-1 text-xs font-bold text-sky-500">
              RX order
            </span>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="mt-3 flex w-full items-center justify-between gap-3 text-left"
      >
        <p className="text-sm font-bold text-[var(--brand-text)]">
          {visibleOrders.length} Product
          {visibleOrders.length === 1 ? "" : "s"} ·{" "}
          {formatPairQuantity(pairCount)} Pair
          {pairCount === 1 ? "" : "s"}
          <span className="ml-2 text-xs font-semibold text-[var(--brand-primary)]">
            {expanded ? "Hide" : "Show"}
          </span>
        </p>
        <p className="text-base font-extrabold text-[var(--brand-text)]">
          ₹{formatOrderAmount(totalAmount)}
        </p>
      </button>

      {expanded ? (
        <div className="mt-3 space-y-2 border-t border-[var(--brand-card-border)] pt-3">
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
      ) : null}
    </div>
  );
}
