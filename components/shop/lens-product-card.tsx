"use client";

import {
  formatLensProductDetail,
  LENS_PRICE_PER_PAIR_LABEL,
} from "@/lib/lens-display";
import type { LensItem } from "@/lib/types/lens";
import { cn } from "@/lib/utils";

type LensProductCardProps = {
  item: LensItem;
  className?: string;
};

export function LensProductCard({ item, className }: LensProductCardProps) {
  const brand = item.brand?.trim() || "Lens";
  const detail = formatLensProductDetail(item);
  const inStock = item.quantity > 0;

  return (
    <article
      className={cn(
        "rounded-2xl border p-4 transition-all",
        "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
        "hover:border-[var(--brand-primary)]/45 hover:shadow-[0_8px_24px_-10px_rgba(240,161,50,0.28)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[var(--brand-text)]">
            {brand}
          </h3>
          <p className="mt-1 text-sm font-semibold leading-snug text-[var(--brand-text)]">
            {detail}
          </p>
          {item.item?.trim() && (
            <p className="mt-2 text-xs font-medium text-[var(--brand-text-muted)]">
              {item.item}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-extrabold text-[var(--brand-primary)]">
            ₹{item.price}
            <span className="ml-0.5 text-[10px] font-bold text-[var(--brand-text-muted)]">
              {LENS_PRICE_PER_PAIR_LABEL}
            </span>
          </p>
          <p
            className={cn(
              "mt-1 text-xs font-semibold",
              inStock
                ? "text-[var(--brand-success)]"
                : "text-[var(--brand-text-muted)]"
            )}
          >
            {inStock ? `${item.quantity} in stock` : "Out of stock"}
          </p>
        </div>
      </div>
    </article>
  );
}
