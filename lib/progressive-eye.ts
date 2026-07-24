import {
  piecesFromDisplayQuantity,
  validatePairQuantity,
  type QuantityUnit,
} from "@/lib/order-quantity";

export type ProgressiveEyeOption = "LEFT" | "RIGHT" | "BOTH";

export const PROGRESSIVE_EYE_OPTIONS: {
  id: ProgressiveEyeOption;
  label: string;
}[] = [
  { id: "LEFT", label: "Left eye" },
  { id: "RIGHT", label: "Right eye" },
  { id: "BOTH", label: "Both eyes" },
];

/** One cart/order line per selection — BOTH stays a single line. */
export function progressiveCartEyes(
  selected: ProgressiveEyeOption
): ProgressiveEyeOption[] {
  return [selected];
}

export function progressivePairQuantityRequired(
  selected: ProgressiveEyeOption
): boolean {
  return selected === "BOTH";
}

/**
 * Pieces to store on the cart line for this eye selection.
 * Both eyes + 1 pair → one BOTH line with 2 pieces (full pair on a single line).
 */
export function piecesPerEyeFromDisplayQuantity(
  displayQty: number,
  unit: QuantityUnit,
  _selected: ProgressiveEyeOption
): number {
  return piecesFromDisplayQuantity(displayQty, unit);
}

export function validateProgressiveQuantityUnit(
  selected: ProgressiveEyeOption,
  _unit?: QuantityUnit
): string | null {
  return null;
}

export function validateProgressivePairQuantity(
  selected: ProgressiveEyeOption,
  pairs: number
): string | null {
  return validatePairQuantity(pairs, {
    wholePairsOnly: progressivePairQuantityRequired(selected),
  });
}

/** Cart / order eye label (e.g. BOTH → "BOTH EYES"). */
export function formatProgressiveEyeLabel(
  eye: string | null | undefined
): string | undefined {
  const normalized = eye?.trim().toUpperCase();
  if (!normalized) {
    return undefined;
  }
  switch (normalized) {
    case "LEFT":
      return "LEFT";
    case "RIGHT":
      return "RIGHT";
    case "BOTH":
    case "BOTH EYES":
    case "BOTH_EYES":
      return "BOTH EYES";
    default:
      return normalized;
  }
}
