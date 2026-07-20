"use client";

import Link from "next/link";
import {
  formatAddAxisLabel,
  formatLensItemLabel,
  formatLensProductCardTitle,
  formatSphCylSlash,
  LENS_PRICE_PER_PAIR_LABEL,
} from "@/lib/lens-display";
import type { LensItem } from "@/lib/types/lens";
import { cn } from "@/lib/utils";

type RelatedLensCardProps = {
  item: LensItem;
  href: string;
  className?: string;
};

export function RelatedLensCard({ item, href, className }: RelatedLensCardProps) {
  const title = formatLensProductCardTitle(item);
  const indexLabel =
    item.index != null && item.lensType === "Single Vision"
      ? `${Number(item.index)} `
      : "";
  const itemLabel = formatLensItemLabel(item);
  const showItemLine =
    Boolean(itemLabel) && itemLabel.toLowerCase() !== title.toLowerCase();
  const sphCyl = formatSphCylSlash(item);
  const addAxis = formatAddAxisLabel(item);

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 transition-all",
        "hover:border-[var(--brand-primary)]/45 hover:shadow-[0_8px_24px_-10px_rgba(240,161,50,0.28)] hover:-translate-y-0.5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-[var(--brand-text)]">
            {`${indexLabel}${title}`.trim()}
          </p>
          {showItemLine ? (
            <p className="mt-0.5 text-xs font-semibold text-[var(--brand-text-muted)]">
              {itemLabel}
            </p>
          ) : null}
          <p className="mt-2 text-lg font-extrabold text-[var(--brand-text)]">
            {sphCyl}
          </p>
          <p className="mt-1 text-xs font-semibold text-[var(--brand-text-muted)]">
            {addAxis}
          </p>
        </div>
        <p className="shrink-0 text-base font-extrabold text-[var(--brand-primary)]">
          ₹{item.price}
          <span className="ml-0.5 text-[10px] font-bold text-[var(--brand-text-muted)]">
            {LENS_PRICE_PER_PAIR_LABEL}
          </span>
        </p>
      </div>
    </Link>
  );
}
