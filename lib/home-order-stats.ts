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

export type OverviewTrend = {
  percent: number;
  direction: "up" | "down" | "flat";
};

export type OverviewTrends = {
  total: OverviewTrend;
  inProgress: OverviewTrend;
  readyToShip: OverviewTrend;
  completed: OverviewTrend;
};

export const EMPTY_OVERVIEW_TRENDS: OverviewTrends = {
  total: { percent: 0, direction: "flat" },
  inProgress: { percent: 0, direction: "flat" },
  readyToShip: { percent: 0, direction: "flat" },
  completed: { percent: 0, direction: "flat" },
};

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function trendFor(todayCount: number, yesterdayCount: number): OverviewTrend {
  if (yesterdayCount === 0) {
    return todayCount > 0
      ? { percent: 100, direction: "up" }
      : { percent: 0, direction: "flat" };
  }
  const diff = todayCount - yesterdayCount;
  const percent = Math.round((Math.abs(diff) / yesterdayCount) * 100);
  if (percent === 0) return { percent: 0, direction: "flat" };
  return { percent, direction: diff >= 0 ? "up" : "down" };
}

/** Day-over-day change ("vs yesterday") for each overview bucket. */
export function computeCustomerOverviewTrends(
  orders: OrderRecord[]
): OverviewTrends {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const today = { total: 0, inProgress: 0, readyToShip: 0, completed: 0 };
  const prior = { total: 0, inProgress: 0, readyToShip: 0, completed: 0 };

  for (const o of orders) {
    if (o.status === "CANCELLED") continue;
    const created = new Date(o.createdAt);
    const bucket: keyof typeof today | null =
      o.status === "COMPLETED"
        ? "completed"
        : o.status === "DISPATCHED"
          ? "readyToShip"
          : IN_PROGRESS.includes(o.status)
            ? "inProgress"
            : null;

    if (isSameCalendarDay(created, now)) {
      today.total += 1;
      if (bucket) today[bucket] += 1;
    } else if (isSameCalendarDay(created, yesterday)) {
      prior.total += 1;
      if (bucket) prior[bucket] += 1;
    }
  }

  return {
    total: trendFor(today.total, prior.total),
    inProgress: trendFor(today.inProgress, prior.inProgress),
    readyToShip: trendFor(today.readyToShip, prior.readyToShip),
    completed: trendFor(today.completed, prior.completed),
  };
}
