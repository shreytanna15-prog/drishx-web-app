import { normalizeOrderStatus } from "@/lib/order-tracking";
import type { OrderRecord } from "@/lib/types/orders";
import type { TaskRecord } from "@/lib/tasks-api";

export const STAFF_PENDING_STATUSES = [
  "PENDING",
  "PICKING",
  "PACKED",
  "DISPATCHED",
  "PARTIALLY_FULFILLED",
  "AWAITING_PROCUREMENT",
] as const;

export type EmployeeHomeOverview = {
  tasksAssigned: string;
  tasksCompleted: string;
  ordersReceived: number;
  ordersPending: number;
};

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isStaffPendingOrder(order: OrderRecord): boolean {
  const status = normalizeOrderStatus(order.status);
  return (
    STAFF_PENDING_STATUSES.includes(
      status as (typeof STAFF_PENDING_STATUSES)[number]
    ) && status !== "AWAITING_PROCUREMENT"
  );
}

export function computeEmployeeHomeOverview(
  orders: OrderRecord[],
  tasks: TaskRecord[],
  now = new Date()
): EmployeeHomeOverview {
  const todayOrders = orders.filter((order) =>
    isSameCalendarDay(new Date(order.createdAt), now)
  );

  const todayTasks = tasks.filter((task) =>
    isSameCalendarDay(new Date(task.dueDate), now)
  );

  const pendingToday = todayOrders.filter(isStaffPendingOrder).length;
  const completedTasksToday = todayTasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;

  return {
    tasksAssigned: String(todayTasks.length),
    tasksCompleted: String(completedTasksToday),
    ordersReceived: todayOrders.length,
    ordersPending: pendingToday,
  };
}

export function getPendingStaffOrders(orders: OrderRecord[]): OrderRecord[] {
  return orders.filter(isStaffPendingOrder);
}

export function getPendingStaffTasks(tasks: TaskRecord[]): TaskRecord[] {
  return tasks.filter((task) => task.status === "PENDING");
}

export function formatOrderStatusLabel(status: string): string {
  return normalizeOrderStatus(status).replaceAll("_", " ");
}

export function formatOrderShortId(orderId: string): string {
  return `#${orderId.slice(-8).toUpperCase()}`;
}

export function getOrderCustomerLabel(order: OrderRecord): string {
  return order.user?.name?.trim() || order.user?.email || "Customer";
}
