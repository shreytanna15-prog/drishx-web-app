import { CatalogThumb } from "@/components/shop/catalog-thumb";
import { CoatingDot } from "@/components/shop/coating-dot";
import {
  formatLensProductCardDetail,
  formatLensProductCardTitle,
  LENS_PRICE_PER_PAIR_LABEL,
} from "@/lib/lens-display";
import type { LensItem } from "@/lib/types/lens";
import { cn } from "@/lib/utils";

type LensProductListCardProps = {
  item: LensItem;
  className?: string;
};

export function LensProductListCard({
  item,
  className,
}: LensProductListCardProps) {
  const title = formatLensProductCardTitle(item);
  const detailLine = formatLensProductCardDetail(item);

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <CatalogThumb
          src={item.imageUrl}
          alt={title}
          lensType={item.lensType}
          className="size-14"
        />
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[var(--brand-text)]">{title}</p>
            <p className="mt-0.5 flex items-start gap-1.5 text-sm font-extrabold leading-snug text-[var(--brand-text)]">
              <CoatingDot coating={item.coating} className="mt-1.5 size-1.5" />
              <span>{detailLine}</span>
            </p>
          </div>
          <p className="shrink-0 text-right text-base font-extrabold leading-tight text-[var(--brand-primary)]">
            ₹{item.price}
            <span className="text-[10px] font-bold text-[var(--brand-text-muted)]">
              {LENS_PRICE_PER_PAIR_LABEL}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
