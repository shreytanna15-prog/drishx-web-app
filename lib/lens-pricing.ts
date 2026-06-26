import { PIECES_PER_PAIR } from "@/lib/order-quantity";

export const LENS_PRICE_PER_PAIR_LABEL = "/ pr";

export function lineTotalForPieceQuantity(
  pairPrice: number,
  pieces: number
): number {
  if (!Number.isFinite(pairPrice) || !Number.isFinite(pieces) || pieces < 1) {
    return 0;
  }
  return pairPrice * (pieces / PIECES_PER_PAIR);
}
