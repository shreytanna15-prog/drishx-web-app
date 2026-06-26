export type OrderQuantityMode = "retail" | "wholesale";
export type QuantityUnit = "piece" | "pair";

export const PIECES_PER_PAIR = 2;

export function getDefaultQuantityUnit(mode: OrderQuantityMode): QuantityUnit {
  return mode === "wholesale" ? "pair" : "piece";
}

export function piecesFromDisplayQuantity(
  displayQty: number,
  unit: QuantityUnit
): number {
  if (!Number.isInteger(displayQty) || displayQty < 1) {
    return 0;
  }
  return unit === "pair" ? displayQty * PIECES_PER_PAIR : displayQty;
}

export function getDefaultOrderQuantity(mode: OrderQuantityMode): number {
  return mode === "wholesale" ? 2 : 1;
}

export function getDefaultDisplayQuantity(
  mode: OrderQuantityMode,
  unit: QuantityUnit = getDefaultQuantityUnit(mode)
): number {
  if (unit === "pair") {
    return 1;
  }
  return getDefaultOrderQuantity(mode);
}

export function getMinimumOrderQuantity(mode: OrderQuantityMode): number {
  return mode === "wholesale" ? 2 : 1;
}

export function validateQuantityForMode(
  quantity: number,
  mode: OrderQuantityMode
): string | null {
  if (!Number.isInteger(quantity)) {
    return "Quantity must be a whole number.";
  }
  if (mode === "wholesale") {
    if (quantity < 2) {
      return "Minimum quantity is 2 for wholesale (pairs only).";
    }
    if (quantity % 2 !== 0) {
      return "Wholesale quantity must be even — orders are in pairs only.";
    }
    return null;
  }
  if (quantity < 1) {
    return "Quantity must be at least 1.";
  }
  return null;
}

export function validateDisplayQuantityForMode(
  displayQty: number,
  unit: QuantityUnit,
  mode: OrderQuantityMode
): string | null {
  if (!Number.isInteger(displayQty) || displayQty < 1) {
    return unit === "pair"
      ? "Enter at least 1 pair."
      : "Quantity must be at least 1.";
  }
  return validateQuantityForMode(
    piecesFromDisplayQuantity(displayQty, unit),
    mode
  );
}

export function normalizeQuantityForMode(
  quantity: number,
  mode: OrderQuantityMode
): number {
  const min = getMinimumOrderQuantity(mode);
  let qty = Math.max(min, Math.floor(quantity));
  if (mode === "wholesale" && qty % 2 !== 0) {
    qty += 1;
  }
  return qty;
}

export function coerceTypedQuantity(
  text: string,
  mode: OrderQuantityMode
): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return trimmed;
  }
  if (mode === "retail") {
    return String(parsed);
  }
  return String(normalizeQuantityForMode(parsed, "wholesale"));
}

export function coerceDisplayQuantity(
  text: string,
  unit: QuantityUnit,
  mode: OrderQuantityMode
): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  if (unit === "pair") {
    return trimmed;
  }
  return mode === "wholesale"
    ? coerceTypedQuantity(trimmed, "wholesale")
    : trimmed;
}
