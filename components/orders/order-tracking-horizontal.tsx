"use client";

import {
  Ban,
  Check,
  CheckCircle2,
  Clock,
  Package,
} from "lucide-react";
import {
  getMainStepIndex,
  isSpecialStatus,
  MAIN_TRACKING_STEPS,
  normalizeOrderStatus,
  SPECIAL_STATUS_CONFIG,
  TERMINAL_STATUS_CONFIG,
} from "@/lib/order-tracking";
import { cn } from "@/lib/utils";

type OrderTrackingHorizontalProps = {
  status: string;
};

export function OrderTrackingHorizontal({ status: rawStatus }: OrderTrackingHorizontalProps) {
  const status = normalizeOrderStatus(rawStatus);
  const activeMainIndex = getMainStepIndex(status);

  if (status === "CANCELLED") {
    const config = TERMINAL_STATUS_CONFIG.CANCELLED;
    return (
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
          Order tracking
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-background)] px-3 py-3">
          <Ban className="size-5 shrink-0" style={{ color: config.color }} />
          <p className="text-sm font-bold" style={{ color: config.color }}>
            {config.label}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
        Order tracking
      </p>

      <div className="flex items-start justify-between gap-1">
        {MAIN_TRACKING_STEPS.map((step, index) => {
          const isDone = status === "COMPLETED" || index < activeMainIndex;
          const isCurrent =
            status === step.key ||
            (isSpecialStatus(status) && step.key === "PENDING");
          const isLast = index === MAIN_TRACKING_STEPS.length - 1;

          return (
            <div key={step.key} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="relative flex w-full items-center justify-center">
                <div
                  className={cn(
                    "relative z-10 flex size-[22px] items-center justify-center rounded-full border-2 bg-[var(--brand-card)]",
                    isDone
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]"
                      : isCurrent
                        ? "border-[var(--brand-primary)] border-[3px]"
                        : "border-[var(--brand-text-muted)]"
                  )}
                >
                  {isDone ? (
                    <Check className="size-3 text-[var(--brand-primary-text)]" />
                  ) : null}
                </div>
                {!isLast ? (
                  <div
                    className={cn(
                      "absolute left-[55%] right-[-45%] top-[10px] h-0.5",
                      isDone
                        ? "bg-[var(--brand-primary)]"
                        : "bg-[var(--brand-card-border)]"
                    )}
                  />
                ) : null}
              </div>
              <p
                className={cn(
                  "mt-2 text-center text-[10px] font-semibold",
                  isCurrent
                    ? "font-bold text-[var(--brand-primary)]"
                    : isDone
                      ? "text-[var(--brand-text)]"
                      : "text-[var(--brand-text-muted)]"
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {status === "COMPLETED" ? (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-background)] px-3 py-3">
          <CheckCircle2
            className="size-5 shrink-0"
            style={{ color: TERMINAL_STATUS_CONFIG.COMPLETED.color }}
          />
          <p
            className="text-sm font-bold"
            style={{ color: TERMINAL_STATUS_CONFIG.COMPLETED.color }}
          >
            {TERMINAL_STATUS_CONFIG.COMPLETED.label}
          </p>
        </div>
      ) : null}

      {isSpecialStatus(status) ? (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-background)] px-3 py-3">
          {status === "PARTIALLY_FULFILLED" ? (
            <Package
              className="size-5 shrink-0"
              style={{ color: SPECIAL_STATUS_CONFIG[status].color }}
            />
          ) : (
            <Clock
              className="size-5 shrink-0"
              style={{ color: SPECIAL_STATUS_CONFIG[status].color }}
            />
          )}
          <p
            className="text-sm font-bold"
            style={{ color: SPECIAL_STATUS_CONFIG[status].color }}
          >
            {SPECIAL_STATUS_CONFIG[status].label}
          </p>
        </div>
      ) : null}
    </div>
  );
}
