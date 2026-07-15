import { formatPowerLabel } from "@/lib/cart-utils";
import {
  formatAddValue,
  formatAxisValue,
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
import {
  expandWholesaleSpec,
  isWholesaleCartItem,
  type WholesaleSpec,
} from "@/lib/wholesale-cart";
import type { LensType } from "@/lib/types/lens";

export type CartPowerLine = {
  cartLineId: string;
  sphCylLabel: string;
  eye?: string;
  quantity: number;
  lineTotal: number;
  isVirtual?: boolean;
  parentCartLineId?: string;
  wholesaleCellKey?: string;
};

export type CartProductSection = {
  key: string;
  title: string;
  subtitle: string;
  totalPairs: number;
  lines: CartPowerLine[];
  isWholesaleBatch?: boolean;
  parentCartLineId?: string;
  wholesaleSpec?: WholesaleSpec | null;
  unitPrice?: number;
  lensType?: LensType;
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
    key: isWholesaleCartItem(item)
      ? `wholesale-${item.cartLineKey}`
      : `${lensType}-${item.brand ?? ""}-${item.item ?? ""}-${item.coating ?? ""}`,
    title: item.brand?.trim() || lensType,
    subtitle: joinParts([lensType, formatLensItemLabel(item)]) || lensType,
  };
}

/** Matches card convention: sph/cyl x axis · ADD */
function formatPowerLineLabel(parts: {
  sphCyl: string;
  axis?: number | null;
  add?: number | null;
  includeAdd: boolean;
}): string {
  let label = parts.sphCyl;
  if (parts.axis != null) {
    label = `${label} x ${formatAxisValue(parts.axis)}`;
  }
  if (parts.includeAdd && parts.add != null) {
    label = `${label} ADD ${formatAddValue(parts.add)}`;
  }
  return label;
}

function formatSphCyl(item: CartItem): string {
  return formatPowerLineLabel({
    sphCyl: formatSphCylSlash(item),
    axis: item.axis,
    add: item.add,
    includeAdd: item.lensType !== "Single Vision",
  });
}

function formatExpandedWholesaleLabel(
  line: ReturnType<typeof expandWholesaleSpec>[number],
  lensType: CartItem["lensType"]
): string {
  const sphCyl = `${formatPowerLabel(line.sph)}/${
    line.cyl != null ? formatPowerLabel(line.cyl) : "—"
  }`;
  return formatPowerLineLabel({
    sphCyl,
    axis: line.axis,
    add: line.add,
    includeAdd: lensType !== "Single Vision",
  });
}

function buildWholesaleSection(item: CartItem, spec: WholesaleSpec): CartProductSection {
  const meta = getCartProductMeta(item);
  const totalPairs = pairsFromPieces(item.cartQuantity);

  return {
    key: meta.key,
    title: meta.title,
    subtitle: `${meta.subtitle} · Wholesale batch · ${totalPairs} pairs`,
    totalPairs,
    lines: [],
    isWholesaleBatch: true,
    parentCartLineId: item.cartLineId,
    wholesaleSpec: spec,
    unitPrice: item.price,
    lensType: item.lensType,
  };
}

export function buildWholesalePowerLines(section: CartProductSection): CartPowerLine[] {
  if (!section.isWholesaleBatch || !section.wholesaleSpec || !section.parentCartLineId) {
    return section.lines;
  }

  const unitPrice = section.unitPrice ?? 0;
  return expandWholesaleSpec(section.wholesaleSpec).map((line) => ({
    cartLineId: `${section.parentCartLineId}:${line.key}`,
    parentCartLineId: section.parentCartLineId,
    wholesaleCellKey: line.key,
    isVirtual: true,
    sphCylLabel: formatExpandedWholesaleLabel(line, section.lensType),
    quantity: line.pairs,
    lineTotal: lineTotalForPieceQuantity(unitPrice, line.pieces),
  }));
}

export function buildCartProductSections(
  items: CartItem[],
  mode: OrderQuantityMode = "wholesale"
): CartProductSection[] {
  const sections = new Map<string, CartProductSection>();

  for (const item of items) {
    if (isWholesaleCartItem(item) && item.wholesaleSpec) {
      sections.set(
        getCartProductMeta(item).key,
        buildWholesaleSection(item, item.wholesaleSpec)
      );
      continue;
    }

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
    items.reduce((sum, item) => sum + pairsFromPieces(item.cartQuantity), 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + lineTotalForPieceQuantity(item.price, item.cartQuantity),
    0
  );
  return { productCount, pairCount, pieceCount, totalAmount };
}

export function formatCartPowerLabel(item: CartItem): string {
  return formatSphCyl(item);
}

export function partitionCartItems(items: CartItem[]): {
  retailItems: CartItem[];
  wholesaleItems: CartItem[];
} {
  const retailItems: CartItem[] = [];
  const wholesaleItems: CartItem[] = [];

  for (const item of items) {
    if (isWholesaleCartItem(item)) {
      wholesaleItems.push(item);
    } else {
      retailItems.push(item);
    }
  }

  return { retailItems, wholesaleItems };
}
