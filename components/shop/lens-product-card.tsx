"use client";

import Link from "next/link";
import {
  formatLensItemLabel,
  formatLensProductDetail,
  formatLensProductCardTitle,
  LENS_PRICE_PER_PAIR_LABEL,
} from "@/lib/lens-display";
import { formatProgressiveEyeLabel } from "@/lib/progressive-eye";
import type { LensItem } from "@/lib/types/lens";
import { cn } from "@/lib/utils";

type LensProductCardProps = {
  item: LensItem;
  href?: string;
  className?: string;
  /** Optional line under price (e.g. ordered pairs on employee order cards). */
  quantityHint?: string;
};

export function LensProductCard({
  item,
  href,
  className,
  quantityHint,
}: LensProductCardProps) {
  const title = formatLensProductCardTitle(item);
  const detail = formatLensProductDetail(item);
  const eyeLabel = formatProgressiveEyeLabel(item.eye);
  const itemLabel = formatLensItemLabel(item);
  const showItemLine =
    Boolean(item.item?.trim()) &&
    itemLabel.toLowerCase() !== title.toLowerCase();
  const stockQty = Math.max(0, Number(item.quantity) || 0);
  const inStock = stockQty > 0;

  const content = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold text-[var(--brand-text)]">
            {title}
          </h3>
          {eyeLabel ? (
            <span className="rounded-md border border-[var(--brand-primary)]/35 bg-[var(--brand-primary)]/14 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[var(--brand-primary)]">
              {eyeLabel}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold leading-snug text-[var(--brand-text)]">
          {detail}
        </p>
        {showItemLine ? (
          <p className="mt-2 text-xs font-medium text-[var(--brand-text-muted)]">
            {itemLabel}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-lg font-extrabold text-[var(--brand-primary)]">
          ₹{item.price}
          <span className="ml-0.5 text-[10px] font-bold text-[var(--brand-text-muted)]">
            {LENS_PRICE_PER_PAIR_LABEL}
          </span>
        </p>
        {quantityHint ? (
          <p className="mt-1 text-xs font-semibold text-[var(--brand-text-muted)]">
            {quantityHint}
          </p>
        ) : null}
        <p
          className={cn(
            "mt-1 text-xs font-semibold",
            inStock
              ? "text-[var(--brand-success)]"
              : "text-[var(--brand-text-muted)]"
          )}
        >
          {inStock ? `${stockQty} in stock` : "Out of stock"}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "block rounded-2xl border p-4 transition-all",
          "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
          "hover:border-[var(--brand-primary)]/45 hover:shadow-[0_8px_24px_-10px_rgba(240,161,50,0.28)] hover:-translate-y-0.5",
          className
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <article
      className={cn(
        "rounded-2xl border p-4 transition-all",
        "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
        className
      )}
    >
      {content}
    </article>
  );
}
