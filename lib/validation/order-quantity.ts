import { z } from "zod";

export const MIN_PAIR_QUANTITY = 0.5;
const PAIR_EPS = 1e-9;

export function isMultipleOfHalf(value: number): boolean {
  if (!Number.isFinite(value)) {
    return false;
  }
  const doubled = value * 2;
  return Math.abs(doubled - Math.round(doubled)) < PAIR_EPS;
}

export function isValidPairQuantity(pairs: number): boolean {
  return (
    Number.isFinite(pairs) &&
    pairs >= MIN_PAIR_QUANTITY - PAIR_EPS &&
    isMultipleOfHalf(pairs)
  );
}

export const pairQuantitySchema = z.number().refine(isValidPairQuantity, {
  message: "Enter quantity in 0.5 pair steps (0.5, 1, 1.5, …). Minimum is 0.5.",
});
