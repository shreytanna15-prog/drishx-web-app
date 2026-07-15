"use client";

import {
  ChevronDown,
  ChevronUp,
  Eye,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { CartPowerLine, CartProductSection } from "@/lib/cart-display";
import { buildWholesalePowerLines } from "@/lib/cart-display";
import { formatPairQuantity } from "@/lib/order-quantity";

type CartProductSectionCardProps = {
  section: CartProductSection;
  qtyColumnLabel: string;
  onIncrease: (line: CartPowerLine) => void;
  onDecrease: (line: CartPowerLine) => void;
  onRemove: (line: CartPowerLine) => void;
  onRemoveSection: (cartLineIds: string[]) => void;
};

function CartPowerRow({
  line,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  line: CartPowerLine;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-[var(--brand-card-border)] py-3 last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.8fr)]">
      <div className="min-w-0">
        <p className="text-sm font-bold leading-snug text-[var(--brand-text)]">
          {line.sphCylLabel}
          {line.eye ? (
            <span className="text-[var(--brand-primary)]"> · {line.eye}</span>
          ) : null}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onDecrease}
          className="flex size-8 items-center justify-center rounded-lg border border-[var(--brand-primary)]/60 text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary)]/10"
          aria-label="Decrease quantity"
        >
          <Minus className="size-4" />
        </button>
        <span className="min-w-[2rem] text-center text-sm font-bold text-[var(--brand-text)]">
          {formatPairQuantity(line.quantity)}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          className="flex size-8 items-center justify-center rounded-lg border border-[var(--brand-primary)]/60 text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary)]/10"
          aria-label="Increase quantity"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="text-sm font-extrabold text-[var(--brand-primary)]">
          ₹{line.lineTotal.toLocaleString("en-IN")}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-1.5 text-[var(--brand-danger)] transition-colors hover:bg-[var(--brand-danger)]/10"
          aria-label="Remove line"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function CartProductSectionCard({
  section,
  qtyColumnLabel,
  onIncrease,
  onDecrease,
  onRemove,
  onRemoveSection,
}: CartProductSectionCardProps) {
  const [expanded, setExpanded] = useState(!section.isWholesaleBatch);
  const sectionLineIds = section.parentCartLineId
    ? [section.parentCartLineId]
    : section.lines.map((line) => line.cartLineId);
  const displayLines = useMemo(() => {
    if (!section.isWholesaleBatch || expanded) {
      return section.isWholesaleBatch
        ? buildWholesalePowerLines(section)
        : section.lines;
    }
    return [];
  }, [expanded, section]);

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]">
            <Eye className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-extrabold text-[var(--brand-text)]">
                {section.title}
              </h3>
              <button
                type="button"
                onClick={() => onRemoveSection(sectionLineIds)}
                className="shrink-0 rounded-lg p-1 text-[var(--brand-danger)] transition-colors hover:bg-[var(--brand-danger)]/10"
                aria-label={`Remove ${section.title}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <p className="mt-0.5 truncate text-xs font-semibold text-[var(--brand-text-muted)]">
              {section.subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10"
        >
          {formatPairQuantity(section.totalPairs)} pr
          {expanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>
      </div>

      {expanded ? (
        <div className="border-t border-[var(--brand-card-border)] px-4 pb-2">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.8fr)] gap-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)] sm:grid">
            <span>SPH / CYL</span>
            <span className="text-center">{qtyColumnLabel}</span>
            <span className="text-right">Amt</span>
          </div>
          {displayLines.map((line) => (
            <CartPowerRow
              key={line.cartLineId}
              line={line}
              onIncrease={() => onIncrease(line)}
              onDecrease={() => onDecrease(line)}
              onRemove={() => onRemove(line)}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
