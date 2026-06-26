"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Eye, Minus } from "lucide-react";
import type { OrderProductSection, PickState, PowerLineRow } from "@/lib/order-detail-display";
import { cn } from "@/lib/utils";

function PackedStatusCell({
  state,
  picked,
  ordered,
}: {
  state: PickState;
  picked: number;
  ordered: number;
}) {
  const fraction = `${picked}/${ordered}`;

  if (state === "cancelled") {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs font-bold text-[var(--brand-text-muted)]">—</span>
        <div className="flex size-6 items-center justify-center rounded-full border-2 border-[var(--brand-card-border)]">
          <Minus className="size-3.5 text-[var(--brand-text-muted)]" />
        </div>
      </div>
    );
  }

  if (state === "full") {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs font-bold text-green-500">{fraction}</span>
        <div className="flex size-6 items-center justify-center rounded-full border-2 border-green-500 bg-green-500">
          <Check className="size-3.5 text-white" />
        </div>
      </div>
    );
  }

  if (state === "partial") {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs font-bold text-orange-400">{fraction}</span>
        <div className="flex size-6 items-center justify-center rounded-full border-2 border-orange-500 bg-orange-500">
          <Check className="size-3.5 text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-xs font-bold text-[var(--brand-danger)]">{fraction}</span>
      <div className="size-6 rounded-full border-2 border-[var(--brand-danger)]" />
    </div>
  );
}

function PowerTableRow({ line }: { line: PowerLineRow }) {
  return (
    <div className="grid grid-cols-[1.5fr_0.7fr_0.75fr_0.75fr_1.1fr] items-center border-b border-[var(--brand-card-border)] py-2 last:border-b-0">
      <p className="text-[11px] font-semibold text-[var(--brand-text)]">
        {line.sphCylLabel}
      </p>
      <p className="text-center text-[11px] font-semibold text-[var(--brand-text)]">
        {line.addLabel}
      </p>
      <p className="text-center text-[11px] font-semibold text-[var(--brand-text)]">
        {line.axisLabel}
      </p>
      <p className="text-center text-[11px] font-semibold text-[var(--brand-text)]">
        {line.ordered}
      </p>
      <PackedStatusCell
        state={line.pickState}
        picked={line.picked}
        ordered={line.ordered}
      />
    </div>
  );
}

export function OrderProductSectionCard({
  section,
}: {
  section: OrderProductSection;
}) {
  const [expanded, setExpanded] = useState(true);
  const progress =
    section.totalPairs > 0
      ? Math.round((section.pickedPairs / section.totalPairs) * 100)
      : 0;

  return (
    <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-primary)]/12">
            <Eye className="size-5 text-[var(--brand-primary)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-[var(--brand-text)]">
              {section.title}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--brand-text-muted)]">
              {section.subtitle}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="text-xs font-bold text-[var(--brand-primary)]">
            {section.totalPairs} Pairs
          </p>
          {expanded ? (
            <ChevronUp className="size-5 text-[var(--brand-text-muted)]" />
          ) : (
            <ChevronDown className="size-5 text-[var(--brand-text-muted)]" />
          )}
        </div>
      </button>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-[var(--brand-text-muted)]">
            {section.pickedPairs} / {section.totalPairs} Picked
          </span>
          <span className="font-bold text-[var(--brand-primary)]">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--brand-background)]">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {expanded ? (
        <div className="mt-3 border-t border-[var(--brand-card-border)] pt-3">
          <div className="grid grid-cols-[1.5fr_0.7fr_0.75fr_0.75fr_1.1fr] pb-2">
            <p className="text-[9px] font-bold uppercase text-[var(--brand-text-muted)]">
              SPH / CYL
            </p>
            <p className="text-center text-[9px] font-bold uppercase text-[var(--brand-text-muted)]">
              ADD
            </p>
            <p className="text-center text-[9px] font-bold uppercase text-[var(--brand-text-muted)]">
              AXIS
            </p>
            <p className="text-center text-[9px] font-bold uppercase text-[var(--brand-text-muted)]">
              Ordered
            </p>
            <p className="text-right text-[9px] font-bold uppercase text-[var(--brand-text-muted)]">
              Packed
            </p>
          </div>
          {section.lines.map((line) => (
            <PowerTableRow
              key={line.orderIds?.join(":") ?? line.orderId}
              line={line}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
