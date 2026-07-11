import type { LensItem } from "@/lib/types/lens";

export function buildCartLineId(
  item: Pick<LensItem, "id" | "sph" | "cyl" | "add"> &
    Partial<Pick<LensItem, "axis" | "cylAdd" | "eye" | "crossPower">>
): string {
  return `${item.id}:${item.crossPower ?? ""}:${item.sph ?? ""}:${item.cyl ?? ""}:${item.add ?? ""}:${item.axis ?? ""}:${item.cylAdd ?? ""}:${item.eye ?? ""}`;
}

export function parseNumericInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-" || trimmed === "+" || trimmed === ".") {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function sanitizePositiveIntegerInput(text: string): string {
  return text.replace(/\D/g, "");
}

/** Allow 0.5-step pair quantities while typing (0.5, 1, 1.5, …). */
export function sanitizePairQuantityInput(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, "");
  if (!cleaned) {
    return "";
  }
  const parts = cleaned.split(".");
  const whole = parts[0] ?? "";
  if (parts.length === 1) {
    return whole;
  }
  const fraction = (parts[1] ?? "").replace(/\D/g, "").slice(0, 1);
  if (fraction === "") {
    return `${whole}.`;
  }
  if (fraction === "0" || fraction === "5") {
    return `${whole}.${fraction}`;
  }
  return whole;
}

const POWER_EPSILON = 0.001;

export function powersEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < POWER_EPSILON;
}

export function isPrescriptionInOptions(
  value: number,
  options: number[]
): boolean {
  return options.some((option) => powersEqual(option, value));
}

export function powerRangeFromOptions(options: number[]): {
  low: number;
  high: number;
} {
  if (options.length === 0) {
    return { low: 0, high: 0 };
  }
  return {
    low: Math.min(...options),
    high: Math.max(...options),
  };
}

/** Supports both scroll-ordered bounds (0 → -6) and numeric bounds (2 → 2.75). */
export function isPrescriptionWithinRange(
  value: number,
  boundA: number,
  boundB: number
): boolean {
  const low = Math.min(boundA, boundB);
  const high = Math.max(boundA, boundB);
  return value >= low - POWER_EPSILON && value <= high + POWER_EPSILON;
}

export function validatePrescriptionInOptions(
  label: string,
  raw: string,
  options: number[]
): string | null {
  if (!raw.trim()) {
    return `Please select ${label}.`;
  }
  const parsed = parseNumericInput(raw);
  if (parsed === null) {
    return `Please enter a valid ${label} number.`;
  }
  if (!isPrescriptionInOptions(parsed, options)) {
    const { low, high } = powerRangeFromOptions(options);
    return `${label} must be between ${formatPowerLabel(low)} and ${formatPowerLabel(high)}.`;
  }
  return null;
}

export function validatePrescriptionInRange(
  label: string,
  raw: string,
  minValue: number,
  maxValue: number
): string | null {
  if (!raw.trim()) {
    return `Please select ${label}.`;
  }
  const parsed = parseNumericInput(raw);
  if (parsed === null) {
    return `Please enter a valid ${label} number.`;
  }
  if (!isPrescriptionWithinRange(parsed, minValue, maxValue)) {
    const low = Math.min(minValue, maxValue);
    const high = Math.max(minValue, maxValue);
    return `${label} must be between ${formatPowerLabel(low)} and ${formatPowerLabel(high)}.`;
  }
  return null;
}

export function formatPowerLabel(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 0) return "0.00";
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(2)}`;
}

/** Compact bound for range hints (e.g. -8, 0, +1.25). */
export function formatPowerRangeBound(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 0) {
    return "0";
  }
  const abs = Math.abs(rounded)
    .toFixed(2)
    .replace(/\.?0+$/, "");
  if (rounded < 0) {
    return `-${abs}`;
  }
  return `+${abs}`;
}

/** Always low → high for prescription range copy (e.g. "-8 to 0"). */
export function formatPowerRangeLabel(a: number, b: number): string {
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  return `${formatPowerRangeBound(low)} to ${formatPowerRangeBound(high)}`;
}
