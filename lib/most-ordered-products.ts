import { formatLensType, type FilterOption } from "./lens";
import type { OrderRecord } from "./types/orders";

export type MostOrderedProduct = {
  lensId: string;
  title: string;
  subtitle: string;
  shopFilter: FilterOption;
  orderCount: number;
  totalQuantity: number;
};

function apiLensTypeToShopFilter(
  lensType: OrderRecord["lensType"]
): FilterOption {
  switch (lensType) {
    case "KRYPTOK":
      return "Kryptok";
    case "PROGRESSIVE":
      return "Progressive";
    case "SINGLE_VISION":
    default:
      return "Single Vision";
  }
}

function joinParts(parts: (string | null | undefined)[]): string {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");
}

function getProductFromOrder(
  order: OrderRecord
): { lensId: string; title: string; subtitle: string; shopFilter: FilterOption } | null {
  const lensLabel = formatLensType(order.lensType);

  if (order.singleVisionLens?.id) {
    const lens = order.singleVisionLens;
    const title = lens.brand?.trim() || lensLabel;
    const subtitle = joinParts([lensLabel, lens.item, lens.coating, lens.category]);
    return {
      lensId: lens.id,
      title,
      subtitle: subtitle || String(lensLabel),
      shopFilter: apiLensTypeToShopFilter(order.lensType),
    };
  }

  if (order.kryptokLens?.id) {
    const lens = order.kryptokLens;
    const title = lens.brand?.trim() || lensLabel;
    const subtitle = joinParts([lensLabel, lens.coating, lens.category]);
    return {
      lensId: lens.id,
      title,
      subtitle: subtitle || String(lensLabel),
      shopFilter: apiLensTypeToShopFilter(order.lensType),
    };
  }

  if (order.progressiveLens?.id) {
    const lens = order.progressiveLens;
    const title = lens.brand?.trim() || lens.item?.trim() || lensLabel;
    const subtitle = joinParts([lensLabel, lens.item, lens.coating, lens.category]);
    return {
      lensId: lens.id,
      title,
      subtitle: subtitle || String(lensLabel),
      shopFilter: apiLensTypeToShopFilter(order.lensType),
    };
  }

  return null;
}

export function computeMostOrderedProducts(
  orders: OrderRecord[],
  limit = 5
): MostOrderedProduct[] {
  const totals = new Map<string, MostOrderedProduct>();

  for (const order of orders) {
    if (order.status === "CANCELLED") continue;

    const product = getProductFromOrder(order);
    if (!product) continue;

    const quantity = Math.max(1, Number(order.quantity) || 1);
    const existing = totals.get(product.lensId);

    if (existing) {
      existing.orderCount += 1;
      existing.totalQuantity += quantity;
      continue;
    }

    totals.set(product.lensId, {
      lensId: product.lensId,
      title: product.title,
      subtitle: product.subtitle,
      shopFilter: product.shopFilter,
      orderCount: 1,
      totalQuantity: quantity,
    });
  }

  return [...totals.values()]
    .sort((a, b) => {
      if (b.totalQuantity !== a.totalQuantity) {
        return b.totalQuantity - a.totalQuantity;
      }
      return b.orderCount - a.orderCount;
    })
    .slice(0, limit);
}
