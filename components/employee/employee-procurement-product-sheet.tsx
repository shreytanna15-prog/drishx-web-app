"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  formatMoneyInput,
  formatPowerLabel,
  parseNumericInput,
  roundMoney,
  sanitizePositiveDecimalInput,
  sanitizePositiveIntegerInput,
} from "@/lib/cart-utils";
import {
  formatAddValue,
  formatAxisValue,
  formatSphCylSlash,
} from "@/lib/lens-display";
import {
  getOrderLensRef,
  getOrderPowerDisplayLines,
  orderToLensItem,
} from "@/lib/order-list-display";
import { formatPairQuantity, pairsFromPieces } from "@/lib/order-quantity";
import { recordStockIntake } from "@/lib/procurement-api";
import { formatProgressiveEyeLabel } from "@/lib/progressive-eye";
import type { OrderRecord } from "@/lib/types/orders";
import { formatLensType } from "@/lib/types/lens";

function formatPowerCell(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return formatPowerLabel(Number(value));
}
type EmployeeProcurementProductSheetProps = {
  open: boolean;
  order: OrderRecord | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function EmployeeProcurementProductSheet({
  open,
  order,
  onClose,
  onSuccess,
}: EmployeeProcurementProductSheetProps) {
  const [quantity, setQuantity] = useState("1");
  const [costPrice, setCostPrice] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lensRef = useMemo(
    () => (order ? getOrderLensRef(order) : null),
    [order]
  );
  const lensItem = useMemo(
    () => (order ? orderToLensItem(order) : null),
    [order]
  );
  const powerLines = useMemo(
    () => (order ? getOrderPowerDisplayLines(order) : []),
    [order]
  );
  const productLabel = lensItem
    ? [lensItem.brand, lensItem.coating, lensItem.item]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(" · ")
    : "";
  const eyeLabel = formatProgressiveEyeLabel(lensItem?.eye);

  useEffect(() => {
    if (!open || !order) return;
    setQuantity(String(Math.max(1, Number(order.quantity) || 1)));
    setCostPrice("");
    setTotalPrice("");
    setError(null);
  }, [open, order]);

  function syncTotalFromPerUnit(qty: number, perUnit: string) {
    const per = parseNumericInput(perUnit);
    if (per !== null && per >= 0 && qty > 0) {
      setTotalPrice(formatMoneyInput(per * qty));
    }
  }

  function syncPerUnitFromTotal(qty: number, total: string) {
    const lineTotal = parseNumericInput(total);
    if (lineTotal !== null && lineTotal >= 0 && qty > 0) {
      setCostPrice(formatMoneyInput(lineTotal / qty));
    }
  }

  function handleQuantityChange(text: string) {
    const sanitized = sanitizePositiveIntegerInput(text) || "";
    setQuantity(sanitized);
    const qty = Number(sanitized);
    if (!Number.isInteger(qty) || qty <= 0) return;
    const perUnit = parseNumericInput(costPrice);
    const total = parseNumericInput(totalPrice);
    if (perUnit !== null && perUnit >= 0) {
      setTotalPrice(formatMoneyInput(perUnit * qty));
    } else if (total !== null && total >= 0) {
      setCostPrice(formatMoneyInput(total / qty));
    }
  }

  async function handleSubmit() {
    if (!order || !lensRef) {
      setError("This order line has no linked lens product.");
      return;
    }

    const qty = Number(quantity);
    const perUnit = parseNumericInput(costPrice);
    const purchaseTotal = parseNumericInput(totalPrice);
    const sellPrice = Number(order.unitPrice || 0);

    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Enter a whole number greater than 0.");
      return;
    }
    if (perUnit === null || perUnit <= 0) {
      setError("Enter the purchase price per unit.");
      return;
    }
    if (purchaseTotal === null || purchaseTotal <= 0) {
      setError("Enter the total purchase amount.");
      return;
    }
    if (!Number.isFinite(sellPrice) || sellPrice <= 0) {
      setError("This order line has no customer selling price on file.");
      return;
    }

    const expectedTotal = roundMoney(perUnit * qty);
    if (Math.abs(expectedTotal - roundMoney(purchaseTotal)) > 0.05) {
      setError("Total cost should match cost per unit × quantity.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await recordStockIntake({
        lensType: lensRef.lensType,
        lensId: lensRef.lensId,
        quantityAdded: qty,
        amount: roundMoney(purchaseTotal),
        costPrice: roundMoney(perUnit),
        sellingPrice: roundMoney(sellPrice),
        orderId: order.id,
        description: `Procurement for order line ${order.id.slice(-6).toUpperCase()}`,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not record purchase."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full border-[var(--brand-card-border)] bg-[var(--brand-card)] sm:max-w-md"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-[var(--brand-text)]">
            Add purchase
          </SheetTitle>
          <SheetDescription className="text-[var(--brand-text-muted)]">
            {productLabel || "Record stock intake for this order line."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-2">
          {lensItem ? (
            <div className="rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-background)] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                Product details
              </p>
              <p className="mt-2 text-base font-extrabold text-[var(--brand-text)]">
                {productLabel || "Lens product"}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--brand-text-muted)]">
                {formatLensType(order?.lensType ?? "")}
                {lensItem.index != null ? ` · Index ${lensItem.index}` : ""}
              </p>
              {eyeLabel ? (
                <p className="mt-2 inline-flex rounded-md border border-[var(--brand-primary)]/35 bg-[var(--brand-primary)]/14 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-[var(--brand-primary)]">
                  {eyeLabel}
                </p>
              ) : null}
              <p className="mt-2 text-sm font-bold text-[var(--brand-primary)]">
                ₹{lensItem.price}
                <span className="ml-1 text-xs font-semibold text-[var(--brand-text-muted)]">
                  / pr
                </span>
              </p>
            </div>
          ) : null}

          {powerLines.length > 0 ? (
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                Ordered powers
              </p>
              {powerLines.map((line) => (
                <div
                  key={line.key}
                  className="rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-background)] p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-extrabold text-[var(--brand-text)]">
                      {formatSphCylSlash({
                        sph: line.sph,
                        cyl: line.cyl,
                        crossPower: line.crossPower,
                      })}
                    </p>
                    <p className="shrink-0 text-xs font-bold text-[var(--brand-text-muted)]">
                      {formatPairQuantity(pairsFromPieces(line.quantity))} pr
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      [
                        ["SPH", formatPowerCell(line.sph)],
                        ["CYL", formatPowerCell(line.cyl)],
                        ["ADD", formatAddValue(line.add)],
                        ["AXIS", formatAxisValue(line.axis)],
                      ] as const
                    ).map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-2 py-2 text-center"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                          {label}
                        </p>
                        <p className="mt-1 text-sm font-extrabold tabular-nums text-[var(--brand-text)]">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                  {eyeLabel ? (
                    <p className="mt-2 text-xs font-bold text-[var(--brand-primary)]">
                      Ordered for: {eyeLabel}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
              Quantity to add
            </span>
            <Input
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 10"
              className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-input-bg)]"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                Cost / unit (₹)
              </span>
              <Input
                value={costPrice}
                onChange={(e) => {
                  const sanitized = sanitizePositiveDecimalInput(
                    e.target.value
                  );
                  setCostPrice(sanitized);
                  const qty = Number(quantity);
                  if (Number.isInteger(qty) && qty > 0) {
                    syncTotalFromPerUnit(qty, sanitized);
                  }
                }}
                inputMode="decimal"
                placeholder="Per unit"
                className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-input-bg)]"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                Total cost (₹)
              </span>
              <Input
                value={totalPrice}
                onChange={(e) => {
                  const sanitized = sanitizePositiveDecimalInput(
                    e.target.value
                  );
                  setTotalPrice(sanitized);
                  const qty = Number(quantity);
                  if (Number.isInteger(qty) && qty > 0) {
                    syncPerUnitFromTotal(qty, sanitized);
                  }
                }}
                inputMode="decimal"
                placeholder="Line total"
                className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-input-bg)]"
              />
            </label>
          </div>

          {error ? (
            <p className="text-sm font-medium text-[var(--brand-danger)]">
              {error}
            </p>
          ) : null}
        </div>

        <SheetFooter className="px-4 pb-4">
          <Button
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-base font-extrabold text-[var(--brand-primary-text)] hover:opacity-95"
          >
            {submitting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              "Record purchase"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
