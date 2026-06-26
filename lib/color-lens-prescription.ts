import { formatPowerLabel } from "@/lib/cart-utils";
import type { ColorLensTypeId } from "@/lib/color-lens";

export type EyePowerValues = {
  sph: number;
  cyl: number;
  axis: number;
  add: number;
};

export type ColorLensPrescription = {
  right: EyePowerValues;
  left: EyePowerValues;
};

const POWER_STEP = 0.25;

export const PRESCRIPTION_LIMITS = {
  sph: { min: -10, max: 6, step: POWER_STEP },
  cyl: { min: -6, max: 0, step: POWER_STEP },
  axis: { min: 1, max: 180, step: 1 },
  add: { min: 0.75, max: 3.5, step: POWER_STEP },
};

function roundStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function buildSteppedOptions(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  const safeStep = Math.abs(step);
  let current = min;

  while (current <= max + 1e-9) {
    out.push(roundStep(current, step));
    current = roundStep(current + safeStep, step);
  }

  return out;
}

export function buildSphOptions(): number[] {
  return buildSteppedOptions(
    PRESCRIPTION_LIMITS.sph.min,
    PRESCRIPTION_LIMITS.sph.max,
    PRESCRIPTION_LIMITS.sph.step
  );
}

export function buildCylOptions(): number[] {
  return buildSteppedOptions(
    PRESCRIPTION_LIMITS.cyl.min,
    PRESCRIPTION_LIMITS.cyl.max,
    PRESCRIPTION_LIMITS.cyl.step
  );
}

export function buildAddOptions(): number[] {
  return buildSteppedOptions(
    PRESCRIPTION_LIMITS.add.min,
    PRESCRIPTION_LIMITS.add.max,
    PRESCRIPTION_LIMITS.add.step
  );
}

export function getAxisOptionsForLensType(
  lensType: ColorLensTypeId | string | undefined
): number[] {
  switch (lensType) {
    case "kryptok":
      return [45, 90, 135, 180];
    case "progressive":
      return [-180, -90, 90, 180];
    case "single-vision":
    default:
      return Array.from({ length: 18 }, (_, index) => (index + 1) * 10);
  }
}

export function formatAxisPickerLabel(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
}

export function snapToOption(value: number, options: number[]): number {
  if (options.length === 0) {
    return value;
  }

  let best = options[0]!;
  let bestDistance = Math.abs(value - best);

  for (const option of options) {
    const distance = Math.abs(value - option);
    if (distance < bestDistance) {
      best = option;
      bestDistance = distance;
    }
  }

  return best;
}

export function createDefaultPrescription(
  lensType: ColorLensTypeId | string | undefined = "single-vision"
): ColorLensPrescription {
  const axisOptions = getAxisOptionsForLensType(lensType);
  const eye: EyePowerValues = {
    sph: -2,
    cyl: -0.75,
    axis: axisOptions[axisOptions.length - 1] ?? 180,
    add: 1,
  };

  return {
    right: { ...eye },
    left: { ...eye },
  };
}

export function lensTypeShowsAdd(
  lensType: ColorLensTypeId | string | undefined
): boolean {
  return lensType === "progressive" || lensType === "kryptok";
}

export function formatOdOsPowerSummary(
  prescription: ColorLensPrescription
): string {
  const od = `${formatPowerLabel(prescription.right.sph)} / ${formatPowerLabel(prescription.right.cyl)}`;
  const os = `${formatPowerLabel(prescription.left.sph)} / ${formatPowerLabel(prescription.left.cyl)}`;
  return `${od} · ${os}`;
}

function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function stepEyePower(
  field: keyof EyePowerValues,
  current: number,
  direction: 1 | -1
): number {
  const limits = PRESCRIPTION_LIMITS[field];
  const next = roundStep(current + direction * limits.step, limits.step);
  return clampValue(next, limits.min, limits.max);
}
