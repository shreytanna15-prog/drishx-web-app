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
    axis: snapToRxAxis(eye.axis || 180),
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

export const RX_AXIS_LIMITS = { min: 0, max: 180, step: 1 } as const;

const RX_POWER_STEP = 0.25;

function roundRxPowerStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function clampRxValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** RX SPH/CYL stepper: + moves further positive or further negative; − moves toward zero. */
export function stepRxSphCyl(
  field: "sph" | "cyl",
  current: number,
  direction: 1 | -1
): number {
  const limits =
    field === "sph" ? { min: -10, max: 6 } : { min: -6, max: 0 };
  const step = RX_POWER_STEP;
  const value = roundRxPowerStep(current, step);
  let next: number;

  if (direction === 1) {
    next = value < 0 ? value - step : value + step;
  } else if (value > 0) {
    next = value - step;
  } else if (value < 0) {
    next = value + step;
  } else {
    next = value - step;
  }

  return clampRxValue(roundRxPowerStep(next, step), limits.min, limits.max);
}

export function buildRxAxisOptions(): number[] {
  return Array.from(
    { length: RX_AXIS_LIMITS.max - RX_AXIS_LIMITS.min + 1 },
    (_, index) => RX_AXIS_LIMITS.min + index
  );
}

export function snapToRxAxis(value: number): number {
  return clampRxValue(Math.round(value), RX_AXIS_LIMITS.min, RX_AXIS_LIMITS.max);
}

export function stepRxAxis(current: number, direction: 1 | -1): number {
  return snapToRxAxis(current + direction * RX_AXIS_LIMITS.step);
}

export function parseRxCustomAxisInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const rounded = Math.round(parsed);
  if (rounded < RX_AXIS_LIMITS.min || rounded > RX_AXIS_LIMITS.max) {
    return null;
  }
  return rounded;
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
