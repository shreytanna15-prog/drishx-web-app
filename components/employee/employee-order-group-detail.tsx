"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  ImageOff,
  Loader2,
  Minus,
} from "lucide-react";
import { OrderNotesDisplay } from "@/components/orders/order-notes-display";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import { OrderTrackingHorizontal } from "@/components/orders/order-tracking-horizontal";
import { EmployeeOrderRangeSheet } from "@/components/employee/employee-order-range-sheet";
import { BrandConfirmDialog } from "@/components/shared/brand-confirm-dialog";
import { Button } from "@/components/ui/button";
import { useBrandConfirm } from "@/hooks/use-brand-confirm";
import {
  buildOrderProductSections,
  getBatchTrackingStatus,
  type OrderProductSection,
  type PickState,
  type PowerLineRow,
} from "@/lib/order-detail-display";
import {
  formatOrderAmount,
  formatOrderDateTime,
  isColorLensOrder,
  isCrossOrder,
  isRxOrder,
  type OrderListGroup,
} from "@/lib/order-list-display";
import { distributePickedAcrossOrders } from "@/lib/order-line-update";
import { formatPairQuantity } from "@/lib/order-quantity";
import {
  formatOrderStatusLabel,
  getStaffStatusOptions,
  MAIN_TRACKING_STEPS,
  normalizeOrderStatus,
  type OrderTrackingStatus,
} from "@/lib/order-tracking";
import { resolveOrderImageUrl } from "@/lib/orders-api";
import type { OrderRecord } from "@/lib/types/orders";
import { cn } from "@/lib/utils";

type EmployeeOrderGroupDetailProps = {
  group: OrderListGroup;
  onUpdateLine: (
    orderId: string,
    payload: { status: OrderTrackingStatus; pickedQuantity: number }
  ) => Promise<void>;
  updatingOrderId: string | null;
};

function PackedStatusCell({
  state,
  picked,
  ordered,
  loading = false,
}: {
  state: PickState;
  picked: number;
  ordered: number;
  loading?: boolean;
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
          {loading ? (
            <Loader2 className="size-3.5 animate-spin text-white" />
          ) : (
            <Check className="size-3.5 text-white" />
          )}
        </div>
      </div>
    );
  }

  if (state === "partial") {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs font-bold text-orange-400">{fraction}</span>
        <div className="flex size-6 items-center justify-center rounded-full border-2 border-orange-500 bg-orange-500">
          {loading ? (
            <Loader2 className="size-3.5 animate-spin text-white" />
          ) : (
            <Check className="size-3.5 text-white" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-xs font-bold text-[var(--brand-danger)]">{fraction}</span>
      <div className="flex size-6 items-center justify-center rounded-full border-2 border-[var(--brand-danger)]">
        {loading ? (
          <Loader2 className="size-3.5 animate-spin text-[var(--brand-danger)]" />
        ) : null}
      </div>
    </div>
  );
}

function EmployeeProductSectionCard({
  section,
  onLinePress,
  updatingOrderId,
}: {
  section: OrderProductSection;
  onLinePress: (line: PowerLineRow) => void;
  updatingOrderId: string | null;
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
            {section.subtitle ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-[var(--brand-text-muted)]">
                {section.subtitle}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="text-xs font-bold text-[var(--brand-primary)]">
            {formatPairQuantity(section.totalPairs)} Pairs
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
            {formatPairQuantity(section.pickedPairs)} /{" "}
            {formatPairQuantity(section.totalPairs)} Picked
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
          {section.lines.map((line, index) => {
            const isUpdating =
              updatingOrderId != null &&
              (line.orderIds ?? [line.orderId]).includes(updatingOrderId);
            return (
              <button
                key={`${line.orderIds?.join(":") ?? line.orderId}:${line.sphCylLabel}:${line.addLabel}:${line.axisLabel}:${line.eye ?? ""}:${index}`}
                type="button"
                disabled={isUpdating}
                onClick={() => onLinePress(line)}
                className="grid w-full grid-cols-[1.5fr_0.7fr_0.75fr_0.75fr_1.1fr] items-center border-b border-[var(--brand-card-border)] py-2 text-left transition-colors last:border-b-0 hover:bg-[var(--brand-primary)]/6"
              >
                <p className="text-[11px] font-semibold text-[var(--brand-text)]">
                  {line.sphCylLabel}
                  {line.eye ? (
                    <span className="text-[var(--brand-primary)]"> · {line.eye}</span>
                  ) : null}
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
                  loading={isUpdating}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function EmployeePhotoOrderDetail({
  group,
  onUpdateStatus,
  updatingOrderId,
}: {
  group: OrderListGroup;
  onUpdateStatus: (orderId: string, status: OrderTrackingStatus) => Promise<void>;
  updatingOrderId: string | null;
}) {
  const order = group.orders[0];
  const rawImageUrl = group.photoUrl ?? order.orderImageUrl ?? null;
  const photoUri = rawImageUrl ? resolveOrderImageUrl(rawImageUrl) : null;
  const status = normalizeOrderStatus(order.status);
  const options = getStaffStatusOptions(status);
  const isUpdating = updatingOrderId === order.id;
  const [updatingTracking, setUpdatingTracking] = useState(false);
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const trackingStatus = getBatchTrackingStatus(group.orders);
  const customerEmail = order.user?.email;
  const {
    confirm,
    open: confirmOpen,
    options: confirmOptions,
    onConfirm: onConfirmDialog,
    onCancel: onCancelDialog,
  } = useBrandConfirm();

  const handleTrackingStepPress = useCallback(
    (step: OrderTrackingStatus) => {
      if (isUpdating || updatingTracking) return;
      const stepLabel =
        MAIN_TRACKING_STEPS.find((item) => item.key === step)?.label ?? step;

      void (async () => {
        const confirmed = await confirm({
          title: `Set status to ${stepLabel}?`,
          description:
            "This will update the tracking status for this photo order.",
          confirmLabel: "Update status",
        });
        if (!confirmed) return;

        setUpdatingTracking(true);
        try {
          await onUpdateStatus(order.id, step);
        } finally {
          setUpdatingTracking(false);
        }
      })();
    },
    [confirm, isUpdating, onUpdateStatus, order.id, updatingTracking]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 sm:p-5">
        <p className="text-2xl font-extrabold text-[var(--brand-text)]">
          {group.displayOrderId}
        </p>
        <div className="mt-2">
          <OrderStatusPill label={group.status.label} variant={group.status.variant} />
        </div>
        <p className="mt-3 text-lg font-extrabold text-[var(--brand-text)]">
          {group.companyName}
        </p>
        {customerEmail ? (
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">{customerEmail}</p>
        ) : null}
        <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
          {formatOrderDateTime(group.createdAt)}
        </p>
        <p className="mt-3 text-sm font-semibold text-[var(--brand-text-muted)]">
          Product details are in the prescription photo below.
        </p>
      </div>

      {photoUri && !photoLoadFailed ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUri}
            alt="Prescription photo"
            className="size-full object-contain"
            onError={() => setPhotoLoadFailed(true)}
          />
        </div>
      ) : (
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)]">
          <ImageOff className="size-10 text-[var(--brand-text-muted)]" />
          <p className="px-4 text-center text-sm text-[var(--brand-text-muted)]">
            {photoUri ? "Could not load prescription photo" : "Photo unavailable"}
          </p>
        </div>
      )}

      {options.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {options.map((nextStatus) => (
            <Button
              key={nextStatus}
              variant="outline"
              disabled={isUpdating}
              className={cn(
                "rounded-xl font-bold",
                nextStatus === "CANCELLED"
                  ? "border-red-400/40 text-red-400 hover:bg-red-950/20"
                  : "border-[var(--brand-primary)]/40 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10"
              )}
              onClick={() => void onUpdateStatus(order.id, nextStatus)}
            >
              {formatOrderStatusLabel(nextStatus)}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 sm:p-5">
        <OrderTrackingHorizontal
          status={trackingStatus}
          onStepPress={handleTrackingStepPress}
          disabled={isUpdating || updatingTracking}
        />
        <p className="mt-3 text-center text-xs text-[var(--brand-text-muted)]">
          Tap a step to update tracking for this order.
        </p>
      </div>

      <BrandConfirmDialog
        open={confirmOpen}
        options={confirmOptions}
        onConfirm={onConfirmDialog}
        onCancel={onCancelDialog}
      />
    </div>
  );
}

export function EmployeeOrderGroupDetail({
  group,
  onUpdateLine,
  updatingOrderId,
}: EmployeeOrderGroupDetailProps) {
  const productSections = useMemo(
    () => buildOrderProductSections(group.orders),
    [group.orders]
  );
  const trackingStatus = useMemo(
    () => getBatchTrackingStatus(group.orders),
    [group.orders]
  );
  const ordersById = useMemo(
    () => new Map(group.orders.map((order) => [order.id, order])),
    [group.orders]
  );
  const customerEmail = group.orders[0]?.user?.email;
  const hasColorOrder = group.orders.some(isColorLensOrder);
  const hasRxOrder = group.orders.some(isRxOrder);
  const hasCrossOrder = group.orders.some(isCrossOrder);

  const [selectedLine, setSelectedLine] = useState<PowerLineRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [updatingLine, setUpdatingLine] = useState(false);
  const [updatingTracking, setUpdatingTracking] = useState(false);
  const {
    confirm,
    open: confirmOpen,
    options: confirmOptions,
    onConfirm: onConfirmDialog,
    onCancel: onCancelDialog,
  } = useBrandConfirm();

  const selectedLineOrders = useMemo(() => {
    if (!selectedLine) return [];
    const ids = selectedLine.orderIds ?? [selectedLine.orderId];
    return ids
      .map((id) => ordersById.get(id))
      .filter((order): order is OrderRecord => Boolean(order));
  }, [ordersById, selectedLine]);

  const selectedLineStatus = useMemo(() => {
    if (selectedLineOrders.length === 0) return "PENDING" as OrderTrackingStatus;
    return normalizeOrderStatus(selectedLineOrders[0].status);
  }, [selectedLineOrders]);

  const activeOrders = useMemo(
    () =>
      group.orders.filter((order) => {
        const lineStatus = normalizeOrderStatus(order.status);
        return lineStatus !== "CANCELLED" && lineStatus !== "COMPLETED";
      }),
    [group.orders]
  );

  const canEditTracking = activeOrders.length > 0;

  const handleLinePress = useCallback((line: PowerLineRow) => {
    setSelectedLine(line);
    setSheetOpen(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    setSelectedLine(null);
  }, []);

  const handleUpdateLine = useCallback(
    async (payload: { pickedQuantity: number; status: OrderTrackingStatus }) => {
      if (!selectedLine || selectedLineOrders.length === 0) return;

      const statusLabel = formatOrderStatusLabel(payload.status);
      const isCancel = payload.status === "CANCELLED";
      const confirmed = await confirm(
        isCancel
          ? {
              title: "Cancel this product range?",
              description:
                "Stock for this prescription line will be restored to inventory.",
              confirmLabel: "Cancel range",
              destructive: true,
            }
          : {
              title: "Update picked quantity & status?",
              description: `Set ${payload.pickedQuantity} picked pair${payload.pickedQuantity === 1 ? "" : "s"} and mark this range as "${statusLabel}".`,
              confirmLabel: "Update",
            }
      );
      if (!confirmed) return;

      setUpdatingLine(true);
      try {
        const assignments = distributePickedAcrossOrders(
          selectedLineOrders,
          payload.pickedQuantity
        );
        for (const assignment of assignments) {
          await onUpdateLine(assignment.orderId, {
            status: payload.status,
            pickedQuantity: assignment.pickedQuantity,
          });
        }
        handleCloseSheet();
      } finally {
        setUpdatingLine(false);
      }
    },
    [confirm, handleCloseSheet, onUpdateLine, selectedLine, selectedLineOrders]
  );

  const handleTrackingStepPress = useCallback(
    (step: OrderTrackingStatus) => {
      if (!canEditTracking || updatingTracking || updatingOrderId) return;

      const stepLabel =
        MAIN_TRACKING_STEPS.find((item) => item.key === step)?.label ?? step;
      const allAlreadyAtStep = activeOrders.every(
        (order) => normalizeOrderStatus(order.status) === step
      );
      if (allAlreadyAtStep) return;

      const lineCount = activeOrders.length;

      void (async () => {
        const confirmed = await confirm({
          title:
            lineCount === 1
              ? `Set status to ${stepLabel}?`
              : `Update all ${lineCount} active lines?`,
          description:
            lineCount === 1
              ? `This order will be marked as "${stepLabel}".`
              : `All ${lineCount} active lines in this order will be marked as "${stepLabel}".`,
          confirmLabel: "Update status",
        });
        if (!confirmed) return;

        setUpdatingTracking(true);
        try {
          for (const order of activeOrders) {
            if (normalizeOrderStatus(order.status) !== step) {
              await onUpdateLine(order.id, {
                status: step,
                pickedQuantity:
                  typeof order.pickedQuantity === "number" &&
                  Number.isFinite(order.pickedQuantity)
                    ? Math.max(0, Math.floor(order.pickedQuantity))
                    : 0,
              });
            }
          }
        } finally {
          setUpdatingTracking(false);
        }
      })();
    },
    [
      activeOrders,
      canEditTracking,
      confirm,
      onUpdateLine,
      updatingOrderId,
      updatingTracking,
    ]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 sm:p-5">
        <p className="text-2xl font-extrabold text-[var(--brand-text)]">
          {group.displayOrderId}
        </p>
        <div className="mt-2">
          <OrderStatusPill label={group.status.label} variant={group.status.variant} />
        </div>
        <p className="mt-3 text-lg font-extrabold text-[var(--brand-text)]">
          {group.companyName}
        </p>
        {customerEmail ? (
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">{customerEmail}</p>
        ) : null}
        <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
          {formatOrderDateTime(group.createdAt)}
        </p>
        {hasColorOrder || hasRxOrder || hasCrossOrder || group.isPhotoOrder ? (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {group.isPhotoOrder ? (
              <span className="rounded-lg border border-[var(--brand-primary)]/35 bg-[var(--brand-primary)]/14 px-2.5 py-1 text-xs font-bold text-[var(--brand-primary)]">
                Photo order
              </span>
            ) : null}
            {hasCrossOrder ? (
              <span className="rounded-lg border border-amber-500/35 bg-amber-500/14 px-2.5 py-1 text-xs font-bold text-amber-600">
                Cross order
              </span>
            ) : null}
            {hasColorOrder ? (
              <span className="rounded-lg border border-violet-500/35 bg-violet-500/14 px-2.5 py-1 text-xs font-bold text-violet-500">
                Color order
              </span>
            ) : null}
            {hasRxOrder ? (
              <span className="rounded-lg border border-sky-500/35 bg-sky-500/14 px-2.5 py-1 text-xs font-bold text-sky-500">
                RX order
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-3 divide-x divide-[var(--brand-card-border)] rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] py-4">
        <div className="flex flex-col items-center px-2">
          <p className="text-base font-extrabold text-[var(--brand-text)]">
            {group.productCount}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[var(--brand-text-muted)]">
            Products
          </p>
        </div>
        <div className="flex flex-col items-center px-2">
          <p className="text-base font-extrabold text-[var(--brand-text)]">
            {group.pairCount}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[var(--brand-text-muted)]">
            Pairs
          </p>
        </div>
        <div className="flex flex-col items-center px-2">
          <p className="text-base font-extrabold text-[var(--brand-text)]">
            ₹{formatOrderAmount(group.totalAmount)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[var(--brand-text-muted)]">
            Amount
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-bold text-[var(--brand-text)]">
          Products & power combinations
        </h2>
        <div className="space-y-3">
          {productSections.map((section) => (
            <EmployeeProductSectionCard
              key={section.key}
              section={section}
              onLinePress={handleLinePress}
              updatingOrderId={updatingOrderId}
            />
          ))}
        </div>
      </div>

      {group.orders.some((order) => order.notes?.trim()) ? (
        <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--brand-primary)]">
            Order notes
          </p>
          <OrderNotesDisplay
            notes={
              group.orders.find((order) => order.notes?.trim())?.notes?.trim() ??
              ""
            }
          />
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 sm:p-5">
        <OrderTrackingHorizontal
          status={trackingStatus}
          onStepPress={canEditTracking ? handleTrackingStepPress : undefined}
          disabled={updatingTracking || updatingOrderId != null}
        />
        {canEditTracking ? (
          <p className="mt-3 text-center text-xs text-[var(--brand-text-muted)]">
            Tap a step to update tracking for this order.
          </p>
        ) : null}
      </div>

      <EmployeeOrderRangeSheet
        open={sheetOpen}
        modal={!confirmOpen}
        line={selectedLine}
        currentStatus={selectedLineStatus}
        onClose={handleCloseSheet}
        onUpdate={handleUpdateLine}
        updating={updatingLine || updatingOrderId != null}
      />

      <BrandConfirmDialog
        open={confirmOpen}
        options={confirmOptions}
        onConfirm={onConfirmDialog}
        onCancel={onCancelDialog}
      />
    </div>
  );
}
