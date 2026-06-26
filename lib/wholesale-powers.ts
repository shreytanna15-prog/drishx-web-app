import { parseNumericInput } from "@/lib/cart-utils";

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

export function parseStep(raw: string): number | null {
  const parsed = parseNumericInput(raw);
  if (parsed === null) return null;
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}
