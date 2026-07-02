"use client";

import { Loader2, Palette } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useColorLensOrder } from "@/components/color/use-color-lens-order";
import {
  ColorCard,
  ColorPageHeader,
  ColorPrimaryButton,
} from "@/components/color/color-page-header";
import { RxOrderPlacedModal } from "@/components/rx/rx-order-placed-modal";
import {
  COLOR_LENS_TYPE_OPTIONS,
  PREDEFINED_LENS_COLORS,
  type ColorLensTypeId,
} from "@/lib/color-lens";
import {
  COLOR_LENS_COLLECTION_LABEL,
  COLOR_LENS_DEFAULT_COATING,
  COLOR_LENS_DEFAULT_TINT_STRENGTH,
  COLOR_LENS_EST_DELIVERY,
} from "@/lib/color-lens-order";
import { placeColorLensOrder } from "@/lib/color-lens-orders-api";
import {
  createDefaultPrescription,
  formatOdOsAddSummary,
  formatOdOsAxisSummary,
  formatOdOsPowerSummary,
  lensTypeShowsAdd,
} from "@/lib/color-lens-prescription";
import {
  formatLensIndex,
  getLensIndexForMaterial,
  type ColorLensMaterialId,
} from "@/lib/color-lens-specifications";
import { hexToRgba } from "@/lib/color-utils";

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--brand-card-border)] py-3 last:border-b-0">
      <span className="text-sm font-semibold text-[var(--brand-text-muted)]">{label}</span>
      <span className="text-right text-sm font-extrabold text-[var(--brand-text)]">
        {value}
      </span>
    </div>
  );
}

export function ColorReviewConfirmScreen() {
  const order = useColorLensOrder();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderPlacedMessage, setOrderPlacedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const predefinedColor = useMemo(
    () => PREDEFINED_LENS_COLORS.find((entry) => entry.id === order.colorId) ?? null,
    [order.colorId]
  );

  const colorName = order.colorName?.trim() || predefinedColor?.name || "Tinted lens";
  const colorHex = order.colorHex?.trim() || predefinedColor?.hex || "#2563EB";

  const lensTypeLabel = useMemo(
    () =>
      COLOR_LENS_TYPE_OPTIONS.find((entry) => entry.id === order.lensType)?.title ??
      "Single Vision",
    [order.lensType]
  );

  const materialId = (order.materialId as ColorLensMaterialId | undefined) ?? "tintable-brc";
  const lensIndex = formatLensIndex(getLensIndexForMaterial(materialId));

  const prescription =
    order.prescription ??
    createDefaultPrescription(order.lensType as ColorLensTypeId | undefined);
  const showAdd = lensTypeShowsAdd(order.lensType);
  const tintStrength = order.tintStrength ?? COLOR_LENS_DEFAULT_TINT_STRENGTH;
  const tintedBackground = hexToRgba(colorHex, 0.08);

  const handlePlaceOrder = async () => {
    if (placingOrder) return;

    setPlacingOrder(true);
    setError(null);
    try {
      const result = await placeColorLensOrder({
        ...order,
        colorName,
        colorHex,
        prescription,
        materialId,
      });

      if (result.success) {
        setOrderPlacedMessage(result.message);
        return;
      }

      setError(result.error);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not place your order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div
      className="relative mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      style={{ backgroundColor: tintedBackground }}
    >
      <RxOrderPlacedModal
        open={orderPlacedMessage !== null}
        message={orderPlacedMessage ?? ""}
        onClose={() => setOrderPlacedMessage(null)}
      />

      <ColorPageHeader
        title="Review & Confirm"
        subtitle="Check your color lens order before placing"
        backHref="/color"
      />

      <ColorCard className="mb-4 overflow-hidden p-0">
        <div
          className="flex items-center gap-4 px-5 py-4"
          style={{ backgroundColor: hexToRgba(colorHex, 0.12) }}
        >
          <span
            className="size-12 shrink-0 rounded-full border-2 border-white/70 shadow-md"
            style={{ backgroundColor: colorHex }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[var(--brand-text-muted)]">
              {COLOR_LENS_COLLECTION_LABEL}
            </p>
            <p className="text-lg font-extrabold text-[var(--brand-text)]">{colorName}</p>
            {order.colorHex ? (
              <p className="text-xs font-bold tracking-wide text-[var(--brand-text-muted)]">
                {colorHex} · {tintStrength}% tint
              </p>
            ) : null}
          </div>
          <Link
            href="/color/predefined"
            className="text-xs font-bold text-[var(--brand-link)] hover:underline"
          >
            Change
          </Link>
        </div>

        <div className="px-5 py-2">
          <ReviewRow label="Lens type" value={lensTypeLabel} />
          <ReviewRow label="Power (OD / OS)" value={formatOdOsPowerSummary(prescription)} />
          <ReviewRow label="Axis (OD / OS)" value={formatOdOsAxisSummary(prescription)} />
          {showAdd ? (
            <ReviewRow label="ADD (OD / OS)" value={formatOdOsAddSummary(prescription)} />
          ) : null}
          <ReviewRow label="Lens index" value={lensIndex} />
          <ReviewRow label="Coating" value={COLOR_LENS_DEFAULT_COATING} />
          <ReviewRow label="Est. delivery" value={COLOR_LENS_EST_DELIVERY} />
        </div>
      </ColorCard>

      {order.referenceImageUrl ? (
        <ColorCard className="mb-4">
          <p className="mb-3 text-sm font-extrabold text-[var(--brand-text)]">
            Reference image
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.referenceImageUrl}
            alt="Color reference"
            className="max-h-48 w-full rounded-xl object-cover"
          />
        </ColorCard>
      ) : null}

      {error ? (
        <p className="mb-4 text-center text-sm font-semibold text-[var(--brand-danger,#dc2626)]">
          {error}
        </p>
      ) : null}

      <ColorPrimaryButton disabled={placingOrder} onClick={() => void handlePlaceOrder()}>
        {placingOrder ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Placing order…
          </>
        ) : (
          <>
            <Palette className="size-5" />
            Place order
          </>
        )}
      </ColorPrimaryButton>
    </div>
  );
}
