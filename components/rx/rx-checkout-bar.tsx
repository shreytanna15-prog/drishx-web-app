"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RxCheckoutBarProps = {
  orderSummaryLabel: string;
  summaryDetails: string;
  showSummary: boolean;
  onToggleSummary: () => void;
  placingOrder: boolean;
  onPlaceOrder: () => void;
  className?: string;
};

export function RxCheckoutBar({
  orderSummaryLabel,
  summaryDetails,
  showSummary,
  onToggleSummary,
  placingOrder,
  onPlaceOrder,
  className,
}: RxCheckoutBarProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--brand-card-border)]",
        "bg-[var(--brand-card)] shadow-[0_12px_40px_-16px_rgba(0,0,0,0.45)]",
        className
      )}
    >
      <div
        className={cn(
          "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--brand-card)_92%,var(--brand-primary)_8%)_0%,var(--brand-card)_100%)]",
          "p-4 sm:p-5"
        )}
      >
        <div className="flex items-start justify-between gap-4 sm:gap-8">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-text-muted)]">
              Order summary
            </p>
            <p className="mt-1 text-base font-extrabold leading-snug text-[var(--brand-text)] sm:text-lg">
              {orderSummaryLabel}
            </p>
            <button
              type="button"
              onClick={onToggleSummary}
              className="mt-1.5 text-xs font-bold text-[var(--brand-primary)] hover:underline"
            >
              {showSummary ? "Hide details" : "View details"}
            </button>
            {showSummary ? (
              <pre className="mt-3 max-h-28 overflow-y-auto whitespace-pre-wrap rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-background)] p-3 text-xs leading-relaxed text-[var(--brand-text-muted)]">
                {summaryDetails}
              </pre>
            ) : null}
          </div>

          <div className="hidden shrink-0 border-l border-[var(--brand-card-border)] pl-6 sm:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-text-muted)]">
              Est. total
            </p>
            <p className="mt-1 text-3xl font-extrabold leading-none text-[var(--brand-text)]">
              —
            </p>
            <p className="mt-1.5 max-w-[9rem] text-[10px] leading-snug text-[var(--brand-text-muted)]">
              Inclusive of all charges
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[var(--brand-card-border)] pt-4 sm:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-text-muted)]">
              Est. total
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--brand-text-muted)]">
              Inclusive of all charges
            </p>
          </div>
          <p className="text-2xl font-extrabold text-[var(--brand-text)]">—</p>
        </div>

        <Button
          onClick={onPlaceOrder}
          disabled={placingOrder}
          className={cn(
            "mt-4 h-12 w-full rounded-2xl px-6 text-base font-extrabold",
            "bg-gradient-to-r from-[#f5ad42] to-[#e8941f] text-[var(--brand-primary-text)]",
            "shadow-[0_10px_28px_-10px_rgba(240,161,50,0.7)] transition-all hover:opacity-95 hover:shadow-[0_12px_32px_-8px_rgba(240,161,50,0.8)]",
            "disabled:opacity-70"
          )}
        >
          {placingOrder ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <span className="flex items-center justify-center gap-2">
              Place Order
              <ChevronRight className="size-5" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
