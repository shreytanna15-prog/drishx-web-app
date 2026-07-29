export type OrderTrackingStatus =
  | "PENDING"
  | "PICKING"
  | "PACKED"
  | "DISPATCHED"
  | "PARTIALLY_FULFILLED"
  | "AWAITING_PROCUREMENT"
  | "COMPLETED"
  | "CANCELLED";

export const MAIN_TRACKING_STEPS: {
  key: OrderTrackingStatus;
  label: string;
  description: string;
}[] = [
  { key: "PENDING", label: "Pending", description: "Your order has been received." },
  { key: "PICKING", label: "Picking", description: "Items are being picked from inventory." },
  { key: "PACKED", label: "Packed", description: "Your order has been packed and is ready." },
  { key: "DISPATCHED", label: "Dispatched", description: "Your order is on the way." },
];

export const SPECIAL_STATUS_CONFIG: Record<
  "PARTIALLY_FULFILLED" | "AWAITING_PROCUREMENT",
  { label: string; description: string; color: string; bg: string }
> = {
  PARTIALLY_FULFILLED: {
    label: "Partially Fulfilled",
    description:
      "Some items from your order are ready. The remaining items will be fulfilled when stock is available.",
    color: "#d97706",
    bg: "#fef3c7",
  },
  AWAITING_PROCUREMENT: {
    label: "In procurement",
    description:
      "Your order is in procurement. We are sourcing the items and will update you when stock is available.",
    color: "#2563eb",
    bg: "#dbeafe",
  },
};

export const TERMINAL_STATUS_CONFIG: Record<
  "COMPLETED" | "CANCELLED",
  { label: string; description: string; color: string; bg: string }
> = {
  COMPLETED: {
    label: "Completed",
    description: "Your order has been delivered successfully.",
    color: "#059669",
    bg: "#d1fae5",
  },
  CANCELLED: {
    label: "Cancelled",
    description: "This order was cancelled.",
    color: "#dc2626",
    bg: "#fee2e2",
  },
};

export function normalizeOrderStatus(status: string): OrderTrackingStatus {
  if (status === "COMPLETED") {
    return "COMPLETED";
  }
  const known: OrderTrackingStatus[] = [
    "PENDING",
    "PICKING",
    "PACKED",
    "DISPATCHED",
    "PARTIALLY_FULFILLED",
    "AWAITING_PROCUREMENT",
    "COMPLETED",
    "CANCELLED",
  ];
  return known.includes(status as OrderTrackingStatus)
    ? (status as OrderTrackingStatus)
    : "PENDING";
}

export function getMainStepIndex(status: OrderTrackingStatus): number {
  if (status === "COMPLETED") {
    return MAIN_TRACKING_STEPS.length;
  }
  const index = MAIN_TRACKING_STEPS.findIndex((step) => step.key === status);
  return index >= 0 ? index : 0;
}

export function isSpecialStatus(
  status: OrderTrackingStatus
): status is "PARTIALLY_FULFILLED" | "AWAITING_PROCUREMENT" {
  return status === "PARTIALLY_FULFILLED" || status === "AWAITING_PROCUREMENT";
}

const STATUS_LABELS: Record<OrderTrackingStatus, string> = {
  PENDING: "Pending",
  PICKING: "Picking",
  PACKED: "Packed",
  DISPATCHED: "Dispatched",
  PARTIALLY_FULFILLED: "Partially Fulfilled",
  AWAITING_PROCUREMENT: "In procurement",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function formatOrderStatusLabel(status: OrderTrackingStatus): string {
  return STATUS_LABELS[status];
}

export function getStaffStatusOptions(
  current: OrderTrackingStatus
): OrderTrackingStatus[] {
  switch (current) {
    case "PENDING":
      return ["PICKING", "CANCELLED"];
    case "PICKING":
      return ["PACKED", "CANCELLED"];
    case "PACKED":
      return ["DISPATCHED", "CANCELLED"];
    case "DISPATCHED":
      return [
        "PARTIALLY_FULFILLED",
        "AWAITING_PROCUREMENT",
        "COMPLETED",
        "CANCELLED",
      ];
    case "PARTIALLY_FULFILLED":
      return ["AWAITING_PROCUREMENT", "COMPLETED", "CANCELLED"];
    case "AWAITING_PROCUREMENT":
      return ["PARTIALLY_FULFILLED", "PICKING", "PENDING", "COMPLETED", "CANCELLED"];
    case "COMPLETED":
    case "CANCELLED":
      return [];
    default:
      return [];
  }
}
