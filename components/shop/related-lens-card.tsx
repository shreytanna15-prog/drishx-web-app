"use client";

import Link from "next/link";
import { CatalogThumb } from "@/components/shop/catalog-thumb";
import { LensPowerBadges } from "@/components/shop/lens-power-badges";
import {
  formatLensProductCardTitle,
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

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 transition-all",
        "hover:border-[var(--brand-primary)]/45 hover:shadow-[0_8px_24px_-10px_rgba(240,161,50,0.28)] hover:-translate-y-0.5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <CatalogThumb src={item.imageUrl} alt={title} lensType={item.lensType} className="size-14" />
        <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-[var(--brand-text)]">
              {`${indexLabel}${title}`.trim()}
            </p>
            <LensPowerBadges
              item={item}
              showAdd={item.lensType === "Kryptok" || item.lensType === "Progressive"}
            />
          </div>
          <p className="shrink-0 text-base font-extrabold text-[var(--brand-primary)]">
            ₹{item.price}
            <span className="ml-0.5 text-[10px] font-bold text-[var(--brand-text-muted)]">
              {LENS_PRICE_PER_PAIR_LABEL}
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
