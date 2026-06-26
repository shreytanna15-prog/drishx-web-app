import {
  formatAddValue,
  formatLensItemLabel,
  formatSphCylSlash,
} from "@/lib/lens-display";
import { lineTotalForPieceQuantity } from "@/lib/lens-pricing";
import {
  displayQuantityFromPieces,
  pairsFromPieces,
  type OrderQuantityMode,
} from "@/lib/order-quantity";
import type { CartItem } from "@/lib/types/lens";

export type CartPowerLine = {
  cartLineId: string;
  sphCylLabel: string;
  eye?: string;
  quantity: number;
  lineTotal: number;
};

export type CartProductSection = {
  key: string;
  title: string;
  subtitle: string;
  totalPairs: number;
  lines: CartPowerLine[];
};

function joinParts(parts: (string | null | undefined)[]): string {
  return parts.map((part) => part?.trim()).filter(Boolean).join(" · ");
}

function getCartProductMeta(item: CartItem): {
  key: string;
  title: string;
  subtitle: string;
} {
  const lensType = item.lensType ?? "Progressive";

  return {
    key: `${lensType}-${item.brand ?? ""}-${item.item ?? ""}-${item.coating ?? ""}`,
    title: item.brand?.trim() || lensType,
    subtitle: joinParts([lensType, formatLensItemLabel(item)]) || lensType,
  };
}

function formatSphCyl(item: CartItem): string {
  const sphCyl = formatSphCylSlash(item);
  if (item.lensType === "Single Vision") {
    return sphCyl;
  }
  return item.add != null
    ? `${sphCyl} · ADD ${formatAddValue(item.add)}`
    : sphCyl;
}

export function buildCartProductSections(
  items: CartItem[],
  mode: OrderQuantityMode = "wholesale"
): CartProductSection[] {
  const sections = new Map<string, CartProductSection>();

  for (const item of items) {
    const meta = getCartProductMeta(item);
    const displayQty = displayQuantityFromPieces(item.cartQuantity, mode);
    const line: CartPowerLine = {
      cartLineId: item.cartLineId,
      sphCylLabel: formatSphCyl(item),
      eye: item.eye,
      quantity: displayQty,
      lineTotal: lineTotalForPieceQuantity(item.price, item.cartQuantity),
    };

    const existing = sections.get(meta.key);
    if (existing) {
      existing.lines.push(line);
      existing.totalPairs += displayQty;
      continue;
    }

    sections.set(meta.key, {
      key: meta.key,
      title: meta.title,
      subtitle: meta.subtitle,
      totalPairs: displayQty,
      lines: [line],
    });
  }

  return [...sections.values()].map((section) => ({
    ...section,
    lines: section.lines.sort((a, b) =>
      a.sphCylLabel.localeCompare(b.sphCylLabel)
    ),
  }));
}

export function getCartSummary(
  items: CartItem[],
  mode: OrderQuantityMode = "wholesale"
) {
  const productCount = buildCartProductSections(items, mode).length;
  const pieceCount = items.reduce((sum, item) => sum + item.cartQuantity, 0);
  const pairCount =
    mode === "wholesale"
      ? items.reduce((sum, item) => sum + pairsFromPieces(item.cartQuantity), 0)
      : pieceCount;
  const totalAmount = items.reduce(
    (sum, item) => sum + lineTotalForPieceQuantity(item.price, item.cartQuantity),
    0
  );
  return { productCount, pairCount, pieceCount, totalAmount };
}

export function formatCartPowerLabel(item: CartItem): string {
  return formatSphCyl(item);
}
