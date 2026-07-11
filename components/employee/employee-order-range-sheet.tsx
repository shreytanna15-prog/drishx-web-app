"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Check,
  Loader2,
  Minus,
  PackageCheck,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PowerLineRow } from "@/lib/order-detail-display";
import { getHalfPairs } from "@/lib/order-line-update";
import {
  formatOrderStatusLabel,
  normalizeOrderStatus,
  type OrderTrackingStatus,
} from "@/lib/order-tracking";
import { cn } from "@/lib/utils";

const ALL_ORDER_STATUSES: OrderTrackingStatus[] = [
  "PENDING",
  "PICKING",
  "PACKED",
  "DISPATCHED",
  "PARTIALLY_FULFILLED",
  "AWAITING_PROCUREMENT",
  "COMPLETED",
  "CANCELLED",
];

const PRIMARY_STATUSES: OrderTrackingStatus[] = [
  "PENDING",
  "PICKING",
  "PACKED",
  "DISPATCHED",
  "COMPLETED",
];

function formatPairCountLabel(count: number): string {
  return `${count} Pair${count === 1 ? "" : "s"}`;
}

type EmployeeOrderRangeSheetProps = {
  open: boolean;
  modal?: boolean;
  line: PowerLineRow | null;
  currentStatus: OrderTrackingStatus;
  onClose: () => void;
  onUpdate: (payload: {
    pickedQuantity: number;
    status: OrderTrackingStatus;
  }) => Promise<void>;
  updating?: boolean;
};

export function EmployeeOrderRangeSheet({
  open,
  modal = true,
  line,
  currentStatus,
  onClose,
  onUpdate,
  updating = false,
}: EmployeeOrderRangeSheetProps) {
  const ordered = line?.ordered ?? 0;
  const currentPicked = line?.picked ?? 0;
  const [pickedQuantity, setPickedQuantity] = useState(0);
  const [selectedStatus, setSelectedStatus] =
    useState<OrderTrackingStatus>(currentStatus);

  useEffect(() => {
    if (!open || !line) return;
    setPickedQuantity(currentPicked);
    setSelectedStatus(currentStatus);
  }, [open, line, currentPicked, currentStatus]);

  const quickOptions = useMemo(() => {
    const twoPairs = Math.min(2, ordered);
    const halfPairs = getHalfPairs(ordered);
    const candidates = [
      { label: formatPairCountLabel(twoPairs), value: twoPairs },
      { label: formatPairCountLabel(halfPairs), value: halfPairs },
      { label: formatPairCountLabel(ordered), value: ordered },
    ];
    const seen = new Set<number>();
    return candidates.filter((option) => {
      if (seen.has(option.value)) {
        return false;
      }
      seen.add(option.value);
      return true;
    });
  }, [ordered]);

  const pickProgress =
    ordered > 0 ? Math.round((pickedQuantity / ordered) * 100) : 0;
  const remaining = Math.max(0, ordered - pickedQuantity);

  const specialStatuses = ALL_ORDER_STATUSES.filter(
    (status) => !PRIMARY_STATUSES.includes(status)
  );

  function clamp(value: number): number {
    return Math.max(0, Math.min(ordered, Math.floor(value)));
  }

  if (!line) return null;

  return (
    <Sheet open={open} modal={modal} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="bg-black/60 backdrop-blur-[2px]"
        className="max-h-[94vh] overflow-hidden rounded-t-[28px] border-0 bg-[var(--brand-background)] p-0 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.45)] sm:mx-auto sm:max-w-md"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[var(--brand-primary)]/16 to-transparent"
        />

        <div className="relative flex max-h-[94vh] flex-col">
          <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-3">
            <div className="mx-auto h-1 w-12 rounded-full bg-[var(--brand-card-border)]" />
            <button
              type="button"
              onClick={onClose}
              disabled={updating}
              aria-label="Close"
              className="absolute right-4 top-3 flex size-9 items-center justify-center rounded-full border border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text-muted)] transition-colors hover:border-[var(--brand-primary)]/40 hover:text-[var(--brand-text)]"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <SheetHeader className="space-y-0 p-0 text-left">
              <div className="overflow-hidden rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] shadow-[var(--brand-card-shadow)]">
                <div className="h-1 bg-gradient-to-r from-[#f5ad42] via-[#f0a132] to-[#e8941f]" />
                <div className="flex items-start gap-3 p-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-primary)]/8 text-[var(--brand-primary)]">
                    <PackageCheck className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-xl font-extrabold leading-tight text-[var(--brand-text)]">
                      {line.sphCylLabel}
                      {line.eye ? (
                        <span className="text-[var(--brand-primary)]">
                          {" "}
                          · {line.eye}
                        </span>
                      ) : null}
                    </SheetTitle>
                    <SheetDescription className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
                      Update picked quantity and fulfillment status
                    </SheetDescription>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-[var(--brand-card-border)] border-t border-[var(--brand-card-border)] bg-[var(--brand-background)]/60">
                  <StatCell label="Ordered" value={String(ordered)} />
                  <StatCell label="Picked" value={String(currentPicked)} highlight />
                  <StatCell label="Left" value={String(remaining)} />
                </div>
              </div>
            </SheetHeader>

            <section className="mt-4 overflow-hidden rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)]">
              <div className="flex items-center justify-between border-b border-[var(--brand-card-border)] px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand-text-muted)]">
                  Picked quantity
                </p>
                <span className="rounded-full bg-[var(--brand-primary)]/12 px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--brand-primary)]">
                  {pickProgress}% done
                </span>
              </div>

              <div className="px-4 py-5">
                <div className="flex items-center justify-center gap-5">
                  <StepperButton
                    label="Decrease"
                    disabled={updating || pickedQuantity <= 0}
                    onClick={() => setPickedQuantity((value) => clamp(value - 1))}
                  >
                    <Minus className="size-5" />
                  </StepperButton>

                  <div className="relative flex size-28 items-center justify-center">
                    <svg
                      className="absolute inset-0 -rotate-90"
                      viewBox="0 0 100 100"
                      aria-hidden
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="var(--brand-card-border)"
                        strokeWidth="6"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="var(--brand-primary)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${(pickProgress / 100) * 264} 264`}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="text-center">
                      <p className="text-4xl font-extrabold tabular-nums leading-none text-[var(--brand-text)]">
                        {pickedQuantity}
                      </p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
                        of {ordered}
                      </p>
                    </div>
                  </div>

                  <StepperButton
                    label="Increase"
                    disabled={updating || pickedQuantity >= ordered}
                    onClick={() => setPickedQuantity((value) => clamp(value + 1))}
                  >
                    <Plus className="size-5" />
                  </StepperButton>
                </div>

                {quickOptions.length > 1 ? (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {quickOptions.map((option) => {
                      const active = pickedQuantity === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={updating}
                          onClick={() => setPickedQuantity(clamp(option.value))}
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all",
                            active
                              ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-primary-text)] shadow-[0_4px_14px_-6px_rgba(240,161,50,0.65)]"
                              : "border-[var(--brand-card-border)] bg-[var(--brand-background)] text-[var(--brand-text-muted)] hover:border-[var(--brand-primary)]/45"
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="mt-4 overflow-hidden rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)]">
              <div className="flex items-center justify-between border-b border-[var(--brand-card-border)] px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand-text-muted)]">
                  Order status
                </p>
                <p className="text-[11px] font-semibold text-[var(--brand-text-muted)]">
                  Now{" "}
                  <span className="font-extrabold text-[var(--brand-text)]">
                    {formatOrderStatusLabel(normalizeOrderStatus(currentStatus))}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
                {PRIMARY_STATUSES.map((status) => (
                  <StatusOption
                    key={status}
                    status={status}
                    active={selectedStatus === status}
                    disabled={updating}
                    onSelect={() => setSelectedStatus(status)}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2 border-t border-[var(--brand-card-border)] p-3 sm:grid-cols-3">
                {specialStatuses.map((status) => (
                  <StatusOption
                    key={status}
                    status={status}
                    active={selectedStatus === status}
                    disabled={updating}
                    onSelect={() => setSelectedStatus(status)}
                    danger={status === "CANCELLED"}
                  />
                ))}
              </div>
            </section>
          </div>

          <div className="shrink-0 border-t border-[var(--brand-card-border)] bg-[var(--brand-card)]/95 px-5 py-4 backdrop-blur-sm">
            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                disabled={updating}
                onClick={onClose}
                className="h-12 flex-1 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-background)] font-bold text-[var(--brand-text)]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={updating}
                onClick={() =>
                  void onUpdate({
                    pickedQuantity: clamp(pickedQuantity),
                    status: selectedStatus,
                  })
                }
                className="h-12 flex-[1.35] rounded-xl bg-gradient-to-r from-[#f5ad42] to-[#e8941f] font-extrabold text-[var(--brand-primary-text)] shadow-[0_10px_28px_-10px_rgba(240,161,50,0.75)] hover:opacity-95"
              >
                {updating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Update status"
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatCell({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center px-2 py-3">
      <p
        className={cn(
          "text-lg font-extrabold tabular-nums",
          highlight
            ? "text-[var(--brand-primary)]"
            : "text-[var(--brand-text)]"
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
        {label}
      </p>
    </div>
  );
}

function StepperButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-12 items-center justify-center rounded-2xl border-2 transition-all",
        disabled
          ? "cursor-not-allowed border-[var(--brand-card-border)] text-[var(--brand-text-muted)] opacity-40"
          : "border-[var(--brand-primary)]/55 bg-[var(--brand-background)] text-[var(--brand-primary)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 active:scale-95"
      )}
    >
      {children}
    </button>
  );
}

function StatusOption({
  status,
  active,
  disabled,
  onSelect,
  danger = false,
}: {
  status: OrderTrackingStatus;
  active: boolean;
  disabled: boolean;
  onSelect: () => void;
  danger?: boolean;
}) {
  const label = formatOrderStatusLabel(status);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative flex min-h-[44px] items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition-all",
        active && !danger
          ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/12 text-[var(--brand-primary)] shadow-[0_4px_16px_-10px_rgba(240,161,50,0.8)]"
          : active && danger
            ? "border-[var(--brand-danger)] bg-[var(--brand-danger)]/12 text-[var(--brand-danger)]"
            : danger
              ? "border-[var(--brand-danger)]/30 bg-[var(--brand-danger)]/6 text-[var(--brand-danger)] hover:bg-[var(--brand-danger)]/10"
              : "border-[var(--brand-card-border)] bg-[var(--brand-background)] text-[var(--brand-text-muted)] hover:border-[var(--brand-primary)]/35 hover:text-[var(--brand-text)]"
      )}
    >
      <span className="leading-snug">{label}</span>
      {active ? (
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full",
            danger
              ? "bg-[var(--brand-danger)] text-white"
              : "bg-[var(--brand-primary)] text-[var(--brand-primary-text)]"
          )}
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}
