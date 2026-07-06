import type { OrderRecord } from "@/lib/types/orders";

export function distributePickedAcrossOrders(
  orders: OrderRecord[],
  targetPicked: number
): { orderId: string; pickedQuantity: number }[] {
  const sorted = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  let remaining = Math.max(0, Math.floor(targetPicked));

  return sorted.map((order) => {
    const cap = Math.max(1, Number(order.quantity) || 1);
    const picked = Math.min(remaining, cap);
    remaining = Math.max(0, remaining - picked);
    return { orderId: order.id, pickedQuantity: picked };
  });
}

export function getHalfPairs(ordered: number): number {
  return Math.max(1, Math.floor(ordered / 2));
}
