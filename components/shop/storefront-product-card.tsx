"use client";

import { CoatingDot } from "@/components/shop/coating-dot";
import type { StorefrontShopProduct } from "@/lib/lenses-api";
import { cn } from "@/lib/utils";

type StorefrontProductCardProps = {
  item: StorefrontShopProduct;
  className?: string;
};

/** Browse-only parent row under a storefront card (buy/detail is a follow-up). */
export function StorefrontProductCard({
  item,
  className,
}: StorefrontProductCardProps) {
  const coating = item.coatingName?.trim() || item.coating?.trim() || null;
  const variants = Math.max(0, Number(item.variantCount) || 0);

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[var(--brand-text)]">
            {item.name}
          </h3>
          {coating ? (
            <p className="mt-1 flex items-start gap-1.5 text-sm font-semibold leading-snug text-[var(--brand-text)]">
              <CoatingDot coating={coating} className="mt-1.5 size-1.5" />
              <span>{coating}</span>
            </p>
          ) : null}
          <p className="mt-1 text-xs font-medium text-[var(--brand-text-muted)]">
            {item.familyName}
            {item.baseCode ? ` · ${item.baseCode}` : ""}
          </p>
        </div>
        <p className="shrink-0 text-right text-xs font-semibold text-[var(--brand-text-muted)]">
          {variants} variant{variants === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
