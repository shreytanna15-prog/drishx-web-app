"use client";

import { useEffect, useState } from "react";
import { parseRxCustomAxisInput } from "@/lib/rx-order";
import { cn } from "@/lib/utils";
import { RxPowerStepper } from "@/components/rx/rx-power-stepper";

export function RxAxisField({
  value,
  onDecrease,
  onIncrease,
  onCustomChange,
  disabled,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onCustomChange: (next: number) => void;
  disabled?: boolean;
}) {
  const [customText, setCustomText] = useState(String(Math.round(value)));

  useEffect(() => {
    setCustomText(String(Math.round(value)));
  }, [value]);

  return (
    <div className="space-y-1">
      <RxPowerStepper
        value={String(Math.round(value))}
        onDecrease={onDecrease}
        onIncrease={onIncrease}
        disabled={disabled}
      />
      <input
        type="text"
        inputMode="numeric"
        value={customText}
        onChange={(event) => {
          const next = event.target.value.replace(/[^0-9]/g, "");
          setCustomText(next);
          const parsed = parseRxCustomAxisInput(next);
          if (parsed !== null) {
            onCustomChange(parsed);
          }
        }}
        placeholder="Custom 0–180"
        maxLength={3}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-background)] px-2 py-1.5 text-center text-xs font-semibold text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-text-muted)]",
          disabled && "opacity-50"
        )}
        aria-label="Custom axis value"
      />
    </div>
  );
}
