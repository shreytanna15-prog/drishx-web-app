"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RxPowerStepper({
  value,
  onDecrease,
  onIncrease,
  disabled,
}: {
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-background)]",
        disabled && "opacity-50"
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 rounded-l-xl"
        onClick={onDecrease}
        disabled={disabled}
        aria-label="Decrease"
      >
        <Minus className="size-4" />
      </Button>
      <span className="min-w-[3.5rem] flex-1 text-center text-sm font-bold text-[var(--brand-text)]">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 rounded-r-xl"
        onClick={onIncrease}
        disabled={disabled}
        aria-label="Increase"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
