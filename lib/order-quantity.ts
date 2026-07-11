export type OrderQuantityMode = "retail" | "wholesale";
/** @deprecated Always pairs — kept for call-site compatibility. */
export type QuantityUnit = "piece" | "pair";

export const PIECES_PER_PAIR = 2;
export const MIN_PAIR_QUANTITY = 0.5;
export const PAIR_QUANTITY_STEP = 0.5;

const PAIR_EPS = 1e-9;

export function isMultipleOfHalf(value: number): boolean {
  if (!Number.isFinite(value)) {
    return false;
  }
  const doubled = value * 2;
  return Math.abs(doubled - Math.round(doubled)) < PAIR_EPS;
}

/** Valid customer pair qty: 0.5, 1, 1.5, 2, … */
export function isValidPairQuantity(pairs: number): boolean {
  return (
    Number.isFinite(pairs) &&
    pairs >= MIN_PAIR_QUANTITY - PAIR_EPS &&
    isMultipleOfHalf(pairs)
  );
}

export function formatPairQuantity(pairs: number): string {
  if (!Number.isFinite(pairs)) {
    return "0";
  }
  const rounded = Math.round(pairs * 100) / 100;
  if (Math.abs(rounded - Math.round(rounded)) < PAIR_EPS) {
    return String(Math.round(rounded));
  }
  return rounded.toFixed(1);
}

export function pairsFromPieces(pieces: number): number {
  if (!Number.isFinite(pieces) || pieces < 1 - PAIR_EPS) {
    return 0;
  }
  return Math.round((pieces / PIECES_PER_PAIR) * 100) / 100;
}

export function piecesFromPairs(pairs: number): number {
  if (!isValidPairQuantity(pairs)) {
    return 0;
  }
  return Math.round(pairs * PIECES_PER_PAIR);
}

export function getDefaultQuantityUnit(
  _mode?: OrderQuantityMode
): QuantityUnit {
  return "pair";
}

export function piecesFromDisplayQuantity(
  displayQty: number,
  unit: QuantityUnit = "pair"
): number {
  if (unit === "piece") {
    if (!Number.isFinite(displayQty) || displayQty < 1) {
      return 0;
    }
    return Math.round(displayQty);
  }
  return piecesFromPairs(displayQty);
}

export function getDefaultOrderQuantity(_mode?: OrderQuantityMode): number {
  return PIECES_PER_PAIR;
}

export function getDefaultDisplayQuantity(
  _mode?: OrderQuantityMode,
  _unit: QuantityUnit = "pair"
): number {
  return 1;
}

export function getMinimumOrderQuantity(_mode?: OrderQuantityMode): number {
  return 1;
}

export function getMinimumPairQuantity(): number {
  return MIN_PAIR_QUANTITY;
}

export function validateQuantityForMode(
  quantity: number,
  _mode?: OrderQuantityMode
): string | null {
  if (!Number.isFinite(quantity) || quantity < 1) {
    return "Quantity must be at least 0.5 pairs.";
  }
  if (Math.abs(quantity - Math.round(quantity)) > PAIR_EPS) {
    return "Invalid quantity.";
  }
  return null;
}

export function validatePairQuantity(
  pairs: number,
  options?: { wholePairsOnly?: boolean }
): string | null {
  if (!isValidPairQuantity(pairs)) {
    return "Enter quantity in 0.5 pair steps (0.5, 1, 1.5, …). Minimum is 0.5.";
  }
  if (
    options?.wholePairsOnly &&
    Math.abs(pairs - Math.round(pairs)) > PAIR_EPS
  ) {
    return "Both eyes require whole pairs (1, 2, 3, …).";
  }
  return null;
}

export function validateDisplayQuantityForMode(
  displayQty: number,
  unit: QuantityUnit = "pair",
  mode?: OrderQuantityMode,
  options?: { wholePairsOnly?: boolean }
): string | null {
  if (unit === "piece") {
    return validateQuantityForMode(displayQty, mode);
  }
  const pairError = validatePairQuantity(displayQty, options);
  if (pairError) {
    return pairError;
  }
  return validateQuantityForMode(piecesFromPairs(displayQty), mode);
}

export function normalizeQuantityForMode(
  quantity: number,
  _mode?: OrderQuantityMode
): number {
  const min = getMinimumOrderQuantity();
  return Math.max(min, Math.round(quantity));
}

export function coerceTypedQuantity(text: string): string {
  return coercePairQuantityInput(text);
}

export function coerceDisplayQuantity(
  text: string,
  _unit?: QuantityUnit,
  _mode?: OrderQuantityMode
): string {
  return coercePairQuantityInput(text);
}

/** Allow typing 0.5-step pair quantities (e.g. 0.5, 1, 1.5). */
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

export function coercePairQuantityInput(text: string): string {
  const trimmed = text.trim();
  if (!trimmed || trimmed === ".") {
    return trimmed;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return trimmed;
  }
  if (parsed <= 0) {
    return formatPairQuantity(MIN_PAIR_QUANTITY);
  }
  const snapped = Math.round(parsed * 2) / 2;
  if (snapped < MIN_PAIR_QUANTITY) {
    return formatPairQuantity(MIN_PAIR_QUANTITY);
  }
  return formatPairQuantity(snapped);
}

export function displayQuantityFromPieces(
  pieces: number,
  _mode?: OrderQuantityMode
): number {
  return pairsFromPieces(pieces);
}

/** Cart +/- step in pieces (1 piece = 0.5 pair). */
export function getQuantityStep(_mode?: OrderQuantityMode): number {
  return 1;
}

export function nextQuantityAfterDelta(
  current: number,
  delta: number,
  _mode?: OrderQuantityMode
): number {
  const step = getQuantityStep();
  const signedStep = delta > 0 ? step : -step;
  const next = current + signedStep;
  const min = getMinimumOrderQuantity();
  if (next < min) {
    return 0;
  }
  return next;
}
