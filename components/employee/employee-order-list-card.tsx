"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { LensProductCard } from "@/components/shop/lens-product-card";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import {
  formatOrderAmount,
  formatOrderDateTime,
  getOrderPowerDisplayLines,
  isColorLensOrder,
  isCrossOrder,
  isRxOrder,
  orderPowerLineToLensItem,
  type OrderListGroup,
} from "@/lib/order-list-display";
import { formatPairQuantity, pairsFromPieces } from "@/lib/order-quantity";
import { cn } from "@/lib/utils";

function OrderTypeBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        "rounded-lg border px-2.5 py-1 text-xs font-bold",
        className
      )}
    >
      {label}
    </span>
  );
}

export function EmployeeOrderListCard({ group }: { group: OrderListGroup }) {
  const [expanded, setExpanded] = useState(false);
  const href = `/employee/orders/${encodeURIComponent(group.key)}`;
  const visibleOrders = group.orders;
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
  const hasCrossOrder = visibleOrders.some(isCrossOrder);

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 sm:p-5",
        "transition-all hover:border-[var(--brand-primary)]/45 hover:bg-[var(--brand-primary)]/5 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Link href={href} className="min-w-0 flex-1 text-left">
          <p className="text-base font-extrabold text-[var(--brand-text)] sm:text-lg">
            {group.displayOrderId}
          </p>
          <p className="mt-2 text-sm font-bold text-[var(--brand-text)]">
            {group.companyName}
          </p>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
            {formatOrderDateTime(group.createdAt)}
          </p>
        </Link>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <OrderStatusPill
            label={group.status.label}
            variant={group.status.variant}
          />
          {!group.isPhotoOrder ? (
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
          ) : null}
        </div>
      </div>

      {group.isPhotoOrder || hasColorOrder || hasRxOrder || hasCrossOrder ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {group.isPhotoOrder ? (
            <OrderTypeBadge
              label="Photo order"
              className="border-[var(--brand-primary)]/35 bg-[var(--brand-primary)]/14 text-[var(--brand-primary)]"
            />
          ) : null}
          {hasCrossOrder ? (
            <OrderTypeBadge
              label="Cross order"
              className="border-amber-500/35 bg-amber-500/14 text-amber-600"
            />
          ) : null}
          {hasColorOrder ? (
            <OrderTypeBadge
              label="Color order"
              className="border-violet-500/35 bg-violet-500/14 text-violet-500"
            />
          ) : null}
          {hasRxOrder ? (
            <OrderTypeBadge
              label="RX order"
              className="border-sky-500/35 bg-sky-500/14 text-sky-500"
            />
          ) : null}
        </div>
      ) : null}

      {group.isPhotoOrder ? (
        <Link href={href} className="mt-3 block">
          <p className="text-sm font-semibold text-[var(--brand-text-muted)]">
            Prescription photo order · details in image
          </p>
        </Link>
      ) : (
        <>
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
              {visibleOrders.flatMap((order, orderIndex) =>
                getOrderPowerDisplayLines(order).map((line, lineIndex) => {
                  const orderedPairs = pairsFromPieces(line.quantity);
                  return (
                    <LensProductCard
                      key={`${line.key}:${orderIndex}:${lineIndex}`}
                      href={href}
                      item={orderPowerLineToLensItem(line)}
                      quantityHint={`${formatPairQuantity(orderedPairs)} ordered`}
                      className="border-[var(--brand-primary)]/20 bg-[color-mix(in_srgb,var(--brand-card)_94%,var(--brand-primary)_6%)] p-3"
                    />
                  );
                })
              )}
            </div>
          ) : null}

          {group.readyProductCount > 0 || group.procurementProductCount > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {group.readyProductCount > 0 ? (
                <span className="rounded-lg border border-green-500/35 bg-green-500/14 px-2.5 py-1 text-xs font-bold text-green-500">
                  {group.readyProductCount} Ready
                </span>
              ) : null}
              {group.procurementProductCount > 0 ? (
                <span className="rounded-lg border border-red-400/35 bg-red-400/14 px-2.5 py-1 text-xs font-bold text-red-400">
                  {group.procurementProductCount} Need Procurement
                </span>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
