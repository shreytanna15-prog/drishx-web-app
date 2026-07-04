import { parseNumericInput } from "@/lib/cart-utils";
import { isAllowedCrossCombo, resolveCrossPowerMeta } from "@/lib/cross-power";

export type WholesaleGridMode = "sph-only" | "cyl-only" | "compound";

export type PowerRangeInput = {
  from: string;
  to: string;
  step: string;
};

export type WholesalePowerProfile =
  | "sph-only"
  | "cyl-only"
  | "compound"
  | "cross";

function hasMeaningfulPower(value: number | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  return Math.abs(Number(value)) > 1e-9;
}

function roundPower(value: number): number {
  return Math.round(value * 100) / 100;
}

export function parseStep(raw: string): number | null {
  const parsed = parseNumericInput(raw);
  if (parsed === null) return null;
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}

/**
 * Build wholesale power steps between two bounds.
 * Negative ranges: 0 toward more negative (e.g. 0, -0.25, …, -6).
 * Positive ranges: low toward high (e.g. +1, +1.25, …, +3).
 */
export function buildPowerList(
  from: number,
  to: number,
  step: number
): number[] {
  const safeStep = Math.abs(step);
  const a = roundPower(from);
  const b = roundPower(to);
  const low = roundPower(Math.min(a, b));
  const high = roundPower(Math.max(a, b));

  const maxItems = 500;
  const out: number[] = [];
  const isNegativeRange = high <= 0 || (low < 0 && high > 0);

  if (isNegativeRange) {
    let current = high;
    for (let i = 0; i < maxItems && current >= low - 1e-9; i += 1) {
      out.push(roundPower(current));
      if (current <= low + 1e-9) {
        break;
      }
      current = roundPower(current - safeStep);
    }
    return out;
  }

  let current = low;
  for (let i = 0; i < maxItems && current <= high + 1e-9; i += 1) {
    out.push(roundPower(current));
    if (current >= high - 1e-9) {
      break;
    }
    current = roundPower(current + safeStep);
  }
  return out;
}

export function validateRangeInput(input: PowerRangeInput): string | null {
  const from = parseNumericInput(input.from);
  const to = parseNumericInput(input.to);
  const step = parseStep(input.step);

  if (from === null) return 'Enter a valid "From" power.';
  if (to === null) return 'Enter a valid "To" power.';
  if (step === null) return "Enter a valid step (e.g. 0.25).";
  if (Math.abs(to - from) < 1e-9) return null;
  return null;
}

export function powerKey(value: number): string {
  return roundPower(value).toFixed(2);
}

/**
 * Wholesale compound rules (Single Vision & Kryptok):
 * - both + allowed, both - allowed, SPH+ with CYL- allowed
 * - SPH- with CYL+ is NOT allowed
 */
export function isAllowedCompoundCombo(sph: number, cyl: number): boolean {
  return !(sph < 0 && cyl > 0);
}

export function isAllowedCrossComboForItem(
  sph: number,
  cyl: number,
  item: {
    crossPower?: number | null;
    sph?: number | null;
    selectableRange?: { crossPower?: { maxCyl: number } | null } | null;
  }
): boolean {
  const meta = resolveCrossPowerMeta(item);
  if (!meta) {
    return false;
  }
  return isAllowedCrossCombo(sph, cyl);
}

export function countCompoundCombos(
  sphList: number[],
  cylList: number[]
): number {
  let count = 0;
  for (const sph of sphList) {
    for (const cyl of cylList) {
      if (isAllowedCompoundCombo(sph, cyl)) {
        count += 1;
      }
    }
  }
  return count;
}

export function resolveWholesalePowerProfile(item: {
  sph?: number | null;
  cyl?: number | null;
  crossPower?: number | null;
}): WholesalePowerProfile {
  if (hasMeaningfulPower(item.crossPower)) {
    return "cross";
  }

  const hasSph = hasMeaningfulPower(item.sph);
  const hasCyl = hasMeaningfulPower(item.cyl);

  if (hasSph && !hasCyl) {
    return "sph-only";
  }
  if (hasCyl && !hasSph) {
    return "cyl-only";
  }
  return "compound";
}

export function getAvailableWholesaleGridModes(
  profile: WholesalePowerProfile
): WholesaleGridMode[] {
  switch (profile) {
    case "sph-only":
      return ["sph-only"];
    case "cyl-only":
      return ["cyl-only"];
    case "cross":
      return ["compound"];
    case "compound":
      return ["sph-only", "cyl-only", "compound"];
  }
}

export function defaultWholesaleGridMode(
  profile: WholesalePowerProfile
): WholesaleGridMode {
  if (profile === "compound") {
    return "compound";
  }
  if (profile === "cross") {
    return "compound";
  }
  return profile;
}
