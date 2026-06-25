import type { OrderRecord } from "./types/orders";

const IN_PROGRESS: OrderRecord["status"][] = [
  "PENDING",
  "PICKING",
  "PACKED",
  "PARTIALLY_FULFILLED",
  "AWAITING_PROCUREMENT",
];

export type OrderOverview = {
  total: number;
  inProgress: number;
  readyToShip: number;
  completed: number;
};

export function computeCustomerOrderOverview(
  orders: OrderRecord[]
): OrderOverview {
  const active = orders.filter((o) => o.status !== "CANCELLED");
  let inProgress = 0;
  let readyToShip = 0;
  let completed = 0;

  for (const order of active) {
    if (order.status === "COMPLETED") {
      completed += 1;
    } else if (order.status === "DISPATCHED") {
      readyToShip += 1;
    } else if (IN_PROGRESS.includes(order.status)) {
      inProgress += 1;
    }
  }

  return {
    total: active.length,
    inProgress,
    readyToShip,
    completed,
  };
}
