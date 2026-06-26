"use client";

import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CartCheckoutBarProps = {
  productCount: number;
  countLabel: string;
  totalPrice: number;
  placingOrder: boolean;
  disabled?: boolean;
  onPlaceOrder: () => void;
  className?: string;
};

export function CartCheckoutBar({
  productCount,
  countLabel,
  totalPrice,
  placingOrder,
  disabled = false,
  onPlaceOrder,
  className,
}: CartCheckoutBarProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--brand-card-border)]",
        "bg-[var(--brand-card)] shadow-[0_12px_40px_-16px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5",
          "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--brand-card)_92%,var(--brand-primary)_8%)_0%,var(--brand-card)_100%)]"
        )}
      >
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-text-muted)]">
            Order total
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
            {productCount} product{productCount === 1 ? "" : "s"} · {countLabel}
          </p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--brand-primary)] sm:text-[2rem]">
            ₹{totalPrice.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="w-full shrink-0 sm:w-auto sm:min-w-[240px]">
          <Button
            onClick={onPlaceOrder}
            disabled={disabled || placingOrder}
            className={cn(
              "h-12 w-full rounded-2xl px-6 text-base font-extrabold",
              "bg-gradient-to-r from-[#f5ad42] to-[#e8941f] text-[var(--brand-primary-text)]",
              "shadow-[0_10px_28px_-10px_rgba(240,161,50,0.7)] transition-all hover:opacity-95 hover:shadow-[0_12px_32px_-8px_rgba(240,161,50,0.8)]",
              "disabled:opacity-70"
            )}
          >
            {placingOrder ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ShoppingBag className="size-5" />
            )}
            Place order
          </Button>
        </div>
      </div>
    </div>
  );
}
