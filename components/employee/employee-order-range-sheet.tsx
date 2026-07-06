"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
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

function formatPairCountLabel(count: number): string {
  return `${count} Pair${count === 1 ? "" : "s"}`;
}

type EmployeeOrderRangeSheetProps = {
  open: boolean;
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
    return [
      { label: formatPairCountLabel(twoPairs), value: twoPairs },
      { label: formatPairCountLabel(halfPairs), value: halfPairs },
      { label: formatPairCountLabel(ordered), value: ordered },
    ];
  }, [ordered]);

  function clamp(value: number): number {
    return Math.max(0, Math.min(ordered, Math.floor(value)));
  }

  if (!line) return null;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[88vh] overflow-y-auto rounded-t-3xl border-[var(--brand-card-border)] bg-[var(--brand-card)]"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl font-extrabold text-[var(--brand-text)]">
            {line.sphCylLabel}
          </SheetTitle>
          <SheetDescription className="text-sm font-semibold text-[var(--brand-text-muted)]">
            Ordered: {ordered} Pair{ordered === 1 ? "" : "s"} · Picked: {currentPicked}{" "}
            Pair{currentPicked === 1 ? "" : "s"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-2">
          <div className="flex items-center justify-center gap-5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-12 rounded-xl border-[var(--brand-primary)] text-[var(--brand-primary)]"
              onClick={() => setPickedQuantity((value) => clamp(value - 1))}
              disabled={updating || pickedQuantity <= 0}
            >
              <Minus className="size-5" />
            </Button>
            <p className="min-w-16 text-center text-3xl font-extrabold text-[var(--brand-text)]">
              {pickedQuantity}
            </p>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-12 rounded-xl border-[var(--brand-primary)] text-[var(--brand-primary)]"
              onClick={() => setPickedQuantity((value) => clamp(value + 1))}
              disabled={updating || pickedQuantity >= ordered}
            >
              <Plus className="size-5" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {quickOptions.map((option) => {
              const active = pickedQuantity === option.value;
              return (
                <button
                  key={option.label}
                  type="button"
                  disabled={updating}
                  onClick={() => setPickedQuantity(clamp(option.value))}
                  className={cn(
                    "rounded-xl border px-2 py-3 text-xs font-bold transition-colors",
                    active
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]"
                      : "border-[var(--brand-card-border)] bg-[var(--brand-background)] text-[var(--brand-text-muted)]"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
              Status
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_ORDER_STATUSES.map((status) => {
                const active = selectedStatus === status;
                const isDanger = status === "CANCELLED";
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={updating}
                    onClick={() => setSelectedStatus(status)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs font-bold transition-colors",
                      active && !isDanger
                        ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]"
                        : active && isDanger
                          ? "border-red-400 bg-red-900/30 text-red-300"
                          : isDanger
                            ? "border-red-400/40 bg-red-950/20 text-red-300"
                            : "border-[var(--brand-card-border)] bg-[var(--brand-background)] text-[var(--brand-text-muted)]"
                    )}
                  >
                    {formatOrderStatusLabel(status)}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-[var(--brand-text-muted)]">
              Current: {formatOrderStatusLabel(normalizeOrderStatus(currentStatus))}
            </p>
          </div>
        </div>

        <SheetFooter className="px-4 pb-4">
          <Button
            className="h-12 w-full rounded-xl font-extrabold"
            disabled={updating}
            onClick={() =>
              void onUpdate({
                pickedQuantity: clamp(pickedQuantity),
                status: selectedStatus,
              })
            }
          >
            {updating ? <Loader2 className="size-4 animate-spin" /> : "Update"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
