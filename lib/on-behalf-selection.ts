import type { LensItem } from "@/lib/types/lens";

export type OnBehalfSelection = {
  lens: LensItem;
  quantity: number;
};

let pendingSelection: OnBehalfSelection | null = null;

export function setPendingOnBehalfSelection(selection: OnBehalfSelection) {
  pendingSelection = selection;
}

export function consumePendingOnBehalfSelection(): OnBehalfSelection | null {
  const current = pendingSelection;
  pendingSelection = null;
  return current;
}
