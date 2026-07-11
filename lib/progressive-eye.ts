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

export function progressiveCartEyes(
  selected: ProgressiveEyeOption
): Array<"LEFT" | "RIGHT"> {
  if (selected === "BOTH") {
    return ["LEFT", "RIGHT"];
  }
  return [selected];
}

export function progressivePairQuantityRequired(
  selected: ProgressiveEyeOption
): boolean {
  return selected === "BOTH";
}

/**
 * Pieces to store on each eye cart line.
 * Both eyes + 1 pair → 1 pc LEFT + 1 pc RIGHT (not 2 pcs on each eye).
 */
export function piecesPerEyeFromDisplayQuantity(
  displayQty: number,
  unit: QuantityUnit,
  selected: ProgressiveEyeOption
): number {
  const totalPieces = piecesFromDisplayQuantity(displayQty, unit);
  if (totalPieces < 1) {
    return 0;
  }
  if (progressivePairQuantityRequired(selected)) {
    return Math.max(
      1,
      Math.floor(totalPieces / progressiveCartEyes(selected).length)
    );
  }
  return totalPieces;
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
