"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  Copy,
  Eye,
  Package,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";
import {
  formatOrderAmount,
  formatOrderDateTime,
  type OrderCardStatusVariant,
  type OrderListGroup,
} from "@/lib/order-list-display";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import { cn } from "@/lib/utils";

function accentForVariant(variant: OrderCardStatusVariant): string {
  switch (variant) {
    case "ready":
      return "#22C55E";
    case "completed":
      return "#16A34A";
    case "procurement":
      return "#EF4444";
    case "partial":
      return "#14B8A6";
    case "cancelled":
      return "#9CA3AF";
    case "progress":
    default:
      return "#F0A132";
  }
}

function IconForVariant({ variant }: { variant: OrderCardStatusVariant }) {
  const className = "size-5";
  switch (variant) {
    case "ready":
    case "completed":
      return <ShoppingBag className={className} />;
    case "procurement":
      return <Package className={className} />;
    case "cancelled":
      return <ClipboardList className={className} />;
    default:
      return <ClipboardList className={className} />;
  }
}

export function OrderListCard({ group }: { group: OrderListGroup }) {
  const [copied, setCopied] = useState(false);
  const accent = accentForVariant(group.status.variant);
  const productLabel = `${group.productCount} Product${group.productCount === 1 ? "" : "s"}`;
  const pairLabel = `${group.pairCount} Pair${group.pairCount === 1 ? "" : "s"}`;
  const readyTotal =
    group.productCount > 0
      ? group.productCount
      : Math.max(group.readyProductCount + group.procurementProductCount, 1);
  const readyCount = group.readyProductCount;
  const progress =
    group.isPhotoOrder || readyTotal <= 0
      ? 0
      : Math.min(1, readyCount / readyTotal);
  const showProgress =
    !group.isPhotoOrder &&
    (group.readyProductCount > 0 ||
      group.procurementProductCount > 0 ||
      group.productCount > 0);

  async function copyId(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(group.displayOrderId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Link
      href={`/my-orders/${encodeURIComponent(group.key)}`}
      className={cn(
        "block rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 transition-all sm:p-5",
        "hover:border-[var(--brand-primary)]/45 hover:shadow-[0_12px_28px_-18px_rgba(0,0,0,0.45)]"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          <IconForVariant variant={group.status.variant} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-extrabold text-[var(--brand-text)] sm:text-lg">
              {group.displayOrderId}
            </p>
            <button
              type="button"
              onClick={copyId}
              className="rounded-md p-1 text-[var(--brand-text-muted)] transition-colors hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)]"
              aria-label="Copy order ID"
              title={copied ? "Copied" : "Copy order ID"}
            >
              <Copy className="size-3.5" />
            </button>
          </div>
          <p className="mt-0.5 truncate text-sm text-[var(--brand-text-muted)]">
            {group.companyName}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <OrderStatusPill
            label={group.status.label}
            variant={group.status.variant}
            className="inline-flex items-center gap-1 rounded-full"
          />
          <ChevronRight className="size-4 text-[var(--brand-text-muted)]" />
        </div>
      </div>

      {group.isPhotoOrder ? (
        <p className="mt-3 text-sm font-semibold text-[var(--brand-primary)]">
          Image attached · our team will follow up
        </p>
      ) : (
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs text-[var(--brand-text-muted)] sm:text-sm">
              <CalendarDays className="size-3.5 shrink-0" />
              <span className="truncate">{formatOrderDateTime(group.createdAt)}</span>
            </p>
            <p className="flex items-center gap-1.5 text-xs text-[var(--brand-text-muted)] sm:text-sm">
              <Package className="size-3.5 shrink-0" />
              <span className="truncate">
                {productLabel} • {pairLabel}
              </span>
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-semibold tracking-wide text-[var(--brand-text-muted)] uppercase">
              Total Amount
            </p>
            <p className="text-lg font-extrabold text-[var(--brand-text)]">
              ₹{formatOrderAmount(group.totalAmount)}
            </p>
          </div>
        </div>
      )}

      {showProgress ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-[color-mix(in_srgb,var(--brand-card)_70%,var(--brand-background)_30%)] px-3 py-2.5 dark:bg-[var(--brand-background)]/55">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-text-muted)]">
            <Eye className="size-3.5" />
            <span>
              {readyCount} / {readyTotal} Ready
            </span>
          </div>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--brand-text-muted)_22%,transparent)]">
            <div
              className="h-full rounded-full transition-[width]"
              style={{
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: progress >= 1 ? "#22C55E" : accent,
              }}
            />
          </div>
          {progress >= 1 ? (
            <CheckCircle2 className="size-4 text-green-500" />
          ) : group.status.variant === "procurement" ? (
            <Circle className="size-3.5 text-red-400" />
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}
