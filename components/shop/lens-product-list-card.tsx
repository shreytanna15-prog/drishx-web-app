import {
  formatLensProductCardDetail,
  formatLensProductCardTitle,
  LENS_PRICE_PER_PAIR_LABEL,
} from "@/lib/lens-display";
import { formatProgressiveEyeLabel } from "@/lib/progressive-eye";
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
  const eyeLabel = formatProgressiveEyeLabel(item.eye);

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-[var(--brand-text)]">{title}</p>
            {eyeLabel ? (
              <span className="rounded-md border border-[var(--brand-primary)]/35 bg-[var(--brand-primary)]/14 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[var(--brand-primary)]">
                {eyeLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm font-extrabold leading-snug text-[var(--brand-text)]">
            {detailLine}
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
  );
}
