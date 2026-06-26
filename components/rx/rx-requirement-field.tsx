"use client";

import { ChevronDown } from "lucide-react";

export function RxRequirementField({
  label,
  value,
  onChange,
  presets,
  manualPlaceholder = "Custom",
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  presets: readonly string[];
  manualPlaceholder?: string;
}) {
  const displayValue = value.trim() || presets[0] || "";

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-[var(--brand-text)]">{label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="relative">
          <select
            value={presets.includes(displayValue) ? displayValue : ""}
            onChange={(event) => {
              if (event.target.value) {
                onChange(event.target.value);
              }
            }}
            className="w-full appearance-none rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-background)] px-3 py-2.5 pr-9 text-sm font-semibold text-[var(--brand-text)] outline-none focus:border-[var(--brand-primary)]/50"
          >
            {presets.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--brand-text-muted)]" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={manualPlaceholder}
          className="w-full rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-background)] px-3 py-2.5 text-sm font-medium text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-text-muted)] focus:border-[var(--brand-primary)]/50"
        />
      </div>
    </div>
  );
}
