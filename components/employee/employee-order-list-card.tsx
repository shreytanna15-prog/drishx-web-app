"use client";

import Link from "next/link";
import { LensProductCard } from "@/components/shop/lens-product-card";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import {
  formatOrderAmount,
  formatOrderDateTime,
  orderToLensItem,
  type OrderListGroup,
} from "@/lib/order-list-display";
import { cn } from "@/lib/utils";

export function EmployeeOrderListCard({ group }: { group: OrderListGroup }) {
  const href = `/employee/orders/${encodeURIComponent(group.key)}`;
  const visibleOrders = group.orders;
  const pairCount = visibleOrders.reduce(
    (sum, order) => sum + Math.max(1, Number(order.quantity) || 1),
    0
  );
  const totalAmount = visibleOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0
  );

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 transition-all sm:p-5",
        "hover:border-[var(--brand-primary)]/45 hover:bg-[var(--brand-primary)]/5 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-extrabold text-[var(--brand-text)] sm:text-lg">
          {group.displayOrderId}
        </p>
        <OrderStatusPill label={group.status.label} variant={group.status.variant} />
      </div>

      <p className="mt-2 text-sm font-bold text-[var(--brand-text)]">
        {group.companyName}
      </p>
      <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
        {formatOrderDateTime(group.createdAt)}
      </p>

      {group.isPhotoOrder ? (
        <p className="mt-3 text-sm font-semibold text-[var(--brand-text-muted)]">
          Prescription photo order · details in image
        </p>
      ) : (
        <>
          <div className="mt-3 space-y-2">
            {visibleOrders.map((order) => (
              <LensProductCard
                key={order.id}
                item={orderToLensItem(order)}
                className="border-[var(--brand-primary)]/20 bg-[color-mix(in_srgb,var(--brand-card)_94%,var(--brand-primary)_6%)] p-3"
              />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-[var(--brand-text)]">
              {visibleOrders.length} Product{visibleOrders.length === 1 ? "" : "s"} ·{" "}
              {pairCount} Pair{pairCount === 1 ? "" : "s"}
            </p>
            <p className="text-base font-extrabold text-[var(--brand-text)]">
              ₹{formatOrderAmount(totalAmount)}
            </p>
          </div>

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
    </Link>
  );
}
