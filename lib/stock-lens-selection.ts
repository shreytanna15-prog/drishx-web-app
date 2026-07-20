import type { LensItem } from "@/lib/types/lens";

export type StockLensSelection = {
  lens: LensItem;
  quantity: number;
};

let pendingSelection: StockLensSelection | null = null;

export function setPendingStockLensSelection(selection: StockLensSelection) {
  pendingSelection = selection;
}

export function consumePendingStockLensSelection(): StockLensSelection | null {
  const current = pendingSelection;
  pendingSelection = null;
  return current;
}
