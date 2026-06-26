"use client";

import { ChevronDown } from "lucide-react";
import { RX_DIAMETER_PRESETS } from "@/lib/rx-order";
import { cn } from "@/lib/utils";

export function RxDiameterField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const handleManualChange = (text: string) => {
    onChange(text.replace(/[^0-9]/g, ""));
  };

  return (
    <div
      className={cn(
        "flex items-center overflow-hidden rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-background)]",
        disabled && "opacity-50"
      )}
    >
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => handleManualChange(event.target.value)}
        placeholder="—"
        maxLength={4}
        disabled={disabled}
        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-center text-sm font-bold text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-text-muted)]"
      />
      <span className="shrink-0 pr-1 text-xs font-semibold text-[var(--brand-text-muted)]">
        mm
      </span>
      <div className="h-6 w-px bg-[var(--brand-card-border)]" />
      <div className="relative shrink-0">
        <select
          value={RX_DIAMETER_PRESETS.includes(value as (typeof RX_DIAMETER_PRESETS)[number]) ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="appearance-none bg-transparent py-2 pl-2 pr-7 text-sm font-semibold text-[var(--brand-primary)] outline-none disabled:cursor-not-allowed"
          aria-label="Diameter preset"
        >
          <option value="">—</option>
          {RX_DIAMETER_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {preset}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-4 -translate-y-1/2 text-[var(--brand-primary)]" />
      </div>
    </div>
  );
}
