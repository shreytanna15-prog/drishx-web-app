"use client";

import { Loader2 } from "lucide-react";
import { useOrderMode, type OrderMode } from "@/contexts/order-mode-context";
import { cn } from "@/lib/utils";

type CartOrderModeToggleProps = {
  disabled?: boolean;
  onChange: (mode: OrderMode) => void;
  className?: string;
};

const MODES: { id: OrderMode; label: string }[] = [
  { id: "retail", label: "Retail" },
  { id: "wholesale", label: "Wholesale" },
];

export function CartOrderModeToggle({
  disabled = false,
  onChange,
  className,
}: CartOrderModeToggleProps) {
  const { mode } = useOrderMode();

  return (
    <div className={cn("w-full sm:w-auto", className)}>
      <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)] sm:text-left">
        Order type
      </p>
      <div
        className={cn(
          "grid grid-cols-2 gap-1 rounded-2xl border p-1",
          "border-[var(--brand-card-border)] bg-[color-mix(in_srgb,var(--brand-card)_88%,var(--brand-primary)_12%)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        )}
        role="tablist"
        aria-label="Order type"
      >
        {MODES.map(({ id, label }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => onChange(id)}
              className={cn(
                "relative rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/50",
                active
                  ? "bg-gradient-to-r from-[#f5ad42] to-[#e8941f] text-[var(--brand-primary-text)] shadow-[0_6px_18px_-8px_rgba(240,161,50,0.75)]"
                  : "text-[var(--brand-text-muted)] hover:bg-[var(--brand-primary)]/8 hover:text-[var(--brand-text)]",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {label}
              {disabled && active ? (
                <Loader2 className="absolute top-1/2 right-2 size-3.5 -translate-y-1/2 animate-spin opacity-80" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
