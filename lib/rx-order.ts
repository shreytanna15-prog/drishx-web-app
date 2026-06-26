import type { ColorLensTypeId } from "@/lib/color-lens";
import {
  buildAddOptions,
  buildCylOptions,
  buildSphOptions,
  createDefaultPrescription,
  lensTypeShowsAdd,
  stepEyePower,
  type ColorLensPrescription,
  type EyePowerValues,
} from "@/lib/color-lens-prescription";

export type RxLensTypeId = ColorLensTypeId;

export type RxOrderFor = "both" | "right" | "left";

export type RxEyePower = EyePowerValues & {
  diameter: string;
};

export type RxPrescription = {
  right: RxEyePower;
  left: RxEyePower;
};

export const RX_LENS_TYPE_OPTIONS: {
  id: RxLensTypeId;
  title: string;
  shortLabel: string;
}[] = [
  { id: "single-vision", title: "Single Vision", shortLabel: "SV" },
  { id: "progressive", title: "Progressive", shortLabel: "V2" },
  { id: "kryptok", title: "Kryptok", shortLabel: "KT" },
];

export const RX_ORDER_FOR_OPTIONS: {
  id: RxOrderFor;
  title: string;
  subtitle: string;
  badge: string;
}[] = [
  { id: "both", title: "Pair (R + L)", subtitle: "Both Eyes", badge: "R+L" },
  { id: "right", title: "Right Only (R)", subtitle: "Right Eye", badge: "R" },
  { id: "left", title: "Left Only (L)", subtitle: "Left Eye", badge: "L" },
];

export const RX_DIAMETER_PRESETS = ["55", "60", "65", "70", "72"] as const;

export const RX_LENS_FEATURE_PRESETS = [
  "Clear",
  "Blue Cut",
  "Photochromic",
  "Polarized",
  "Sunglass",
] as const;

export const RX_LENS_INDEX_PRESETS = [
  "1.50",
  "1.56",
  "1.60",
  "1.67",
  "1.74",
] as const;

export const RX_LENS_COATING_PRESETS = [
  "HMC",
  "SHMC",
  "Green",
  "Gold",
  "Magenta",
  "Other",
  "Custom",
] as const;

export const RX_REMARK_TAGS = [
  "Urgent",
  "Thin Lens Required",
  "Match Previous Lens",
] as const;

export const PRODUCT_NAME_MAX = 100;
export const REMARKS_MAX = 200;

export function createDefaultRxPrescription(
  lensType: RxLensTypeId = "single-vision"
): RxPrescription {
  const base = createDefaultPrescription(lensType);
  const withDiameter = (eye: EyePowerValues): RxEyePower => ({
    ...eye,
    axis: snapToRxAxis(Math.abs(eye.axis) >= 10 ? eye.axis : 180),
    diameter: "",
  });

  return {
    right: withDiameter(base.right),
    left: withDiameter(base.left),
  };
}

export function rxShowsAdd(lensType: RxLensTypeId): boolean {
  return lensTypeShowsAdd(lensType);
}

export function buildRxAxisOptions(): number[] {
  return Array.from({ length: 18 }, (_, index) => (index + 1) * 10);
}

export function snapToRxAxis(value: number): number {
  const options = buildRxAxisOptions();
  if (options.length === 0) {
    return value;
  }
  return options.reduce((best, option) =>
    Math.abs(option - value) < Math.abs(best - value) ? option : best
  );
}

export function stepRxAxis(current: number, direction: 1 | -1): number {
  const options = buildRxAxisOptions();
  const snapped = snapToRxAxis(current);
  const index = options.indexOf(snapped);
  const safeIndex = index >= 0 ? index : 0;
  const nextIndex = Math.min(
    options.length - 1,
    Math.max(0, safeIndex + direction)
  );
  return options[nextIndex] ?? snapped;
}

export function getRxOrderSummaryLabel(
  orderFor: RxOrderFor,
  pairQuantity: number
): string {
  if (orderFor === "both") {
    const lensCount = pairQuantity * 2;
    const pairLabel = pairQuantity === 1 ? "Pair" : "Pairs";
    const lensLabel = lensCount === 1 ? "Lens" : "Lenses";
    return `${pairQuantity} ${pairLabel} (${lensCount} ${lensLabel})`;
  }

  const eyeLabel = orderFor === "right" ? "Right Eye" : "Left Eye";
  const lensLabel = pairQuantity === 1 ? "Lens" : "Lenses";
  return `${pairQuantity} ${lensLabel} (${eyeLabel})`;
}

export function getRxLensCount(
  orderFor: RxOrderFor,
  pairQuantity: number
): number {
  return orderFor === "both" ? pairQuantity * 2 : pairQuantity;
}

export function lensTypeTitle(id: RxLensTypeId): string {
  return RX_LENS_TYPE_OPTIONS.find((entry) => entry.id === id)?.title ?? "Lens";
}

export { buildAddOptions, buildCylOptions, buildSphOptions, stepEyePower };
export type { ColorLensPrescription };
