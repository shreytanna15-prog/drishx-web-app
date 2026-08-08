import { formatLensType } from "@/lib/types/lens";
import type { OrderRecord } from "@/lib/types/orders";

export type LastOrderSummary = {
  id: string;
  label: string;
};

/** Most recent order by createdAt, with a short display label for Continue last order. */
export function getLastOrderSummary(
  orders: OrderRecord[]
): LastOrderSummary | null {
  if (!orders.length) return null;

  const sorted = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const order = sorted[0];
  if (!order) return null;

  const catalog =
    order.progressiveLens ?? order.kryptokLens ?? order.singleVisionLens ?? null;
  const lensType = formatLensType(order.lensType);
  const item =
    catalog && "item" in catalog ? catalog.item?.trim() : null;
  const brand = catalog?.brand?.trim() || null;
  const coating =
    catalog && "coating" in catalog ? catalog.coating?.trim() : null;

  const detail = item || brand || coating;
  const label = detail ? `${lensType} - ${detail}` : String(lensType);

  return { id: order.id, label };
}
