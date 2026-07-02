"use client";

import { Check } from "lucide-react";
import type { PredefinedLensColor } from "@/lib/color-lens";
import { cn } from "@/lib/utils";

export function ColorSwatch({
  color,
  selected,
  onSelect,
}: {
  color: PredefinedLensColor;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex flex-col items-center gap-2.5 rounded-xl p-2 transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
      aria-pressed={selected}
      aria-label={`Select ${color.name}`}
    >
      <div className="relative">
        <div
          className={cn(
            "relative size-14 overflow-hidden rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.22)] transition-shadow sm:size-16",
            selected && "ring-2 ring-[var(--brand-primary)] ring-offset-2 ring-offset-[var(--brand-card)]"
          )}
          style={{ backgroundColor: color.hex }}
        >
          <div
            className="absolute left-2.5 top-2 size-4 rounded-full opacity-55"
            style={{ backgroundColor: color.highlight }}
          />
          <div
            className="absolute bottom-1.5 right-2 size-5 rounded-full opacity-35"
            style={{ backgroundColor: color.shadow }}
          />
        </div>
        {selected ? (
          <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-[var(--brand-card)] bg-[var(--brand-primary)] text-[var(--brand-primary-text)]">
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : null}
      </div>
      <span className="text-xs font-bold text-[var(--brand-text)] sm:text-sm">
        {color.name}
      </span>
    </button>
  );
}
