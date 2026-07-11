import {
  formatOrderStatusLabel,
  normalizeOrderStatus,
  type OrderTrackingStatus,
} from "@/lib/order-tracking";
import { getOrderLensDetails } from "@/lib/orders-api";
import { pairsFromPieces } from "@/lib/order-quantity";
import type { OrderRecord } from "@/lib/types/orders";
import { formatLensType, type LensItem, type LensType } from "@/lib/types/lens";

export type OrderCardStatusVariant =
  | "ready"
  | "partial"
  | "procurement"
  | "progress"
  | "completed"
  | "cancelled";

export type OrderCardStatusDisplay = {
  label: string;
  variant: OrderCardStatusVariant;
};

export type OrderListGroup = {
  key: string;
  orders: OrderRecord[];
  displayOrderId: string;
  companyName: string;
  createdAt: string;
  productCount: number;
  pairCount: number;
  totalAmount: number;
  readyProductCount: number;
  procurementProductCount: number;
  status: OrderCardStatusDisplay;
  isPhotoOrder?: boolean;
  photoUrl?: string | null;
};

export function formatDisplayOrderId(order: OrderRecord): string {
  if (order.orderNumber != null && Number.isFinite(Number(order.orderNumber))) {
    return `ORD${order.orderNumber}`;
  }
  return `ORD${order.id.slice(-6).toUpperCase()}`;
}

export function formatOrderDateTime(value: string): string {
  const date = new Date(value);
  const datePart = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

export function orderToLensItem(order: OrderRecord): LensItem {
  const catalog =
    order.progressiveLens ?? order.kryptokLens ?? order.singleVisionLens;
  const details = getOrderLensDetails(order);
  const lensType = formatLensType(order.lensType) as LensType;

  return {
    id: order.id,
    costPrice: null,
    price: Number(order.unitPrice || order.totalAmount || 0),
    sph: Number(details?.sph ?? 0),
    cyl: details?.cyl != null ? Number(details.cyl) : null,
    axis: details?.axis ?? null,
    add: details?.add != null ? Number(details.add) : null,
    quantity: order.quantity,
    createdAt: order.createdAt,
    lensType,
    brand: catalog?.brand ?? null,
    coating: catalog?.coating ?? null,
    item: catalog && "item" in catalog ? (catalog.item ?? null) : null,
  };
}

function isProcurementLine(status: OrderTrackingStatus): boolean {
  return status === "AWAITING_PROCUREMENT" || status === "PARTIALLY_FULFILLED";
}

/** Order batch waiting for stock purchase (Procurement tab). */
export function hasAwaitingProcurementOrder(group: OrderListGroup): boolean {
  if (group.isPhotoOrder) {
    return false;
  }
  return group.orders.some(
    (order) => normalizeOrderStatus(order.status) === "AWAITING_PROCUREMENT"
  );
}

export function filterProcurementOrderGroups(
  groups: OrderListGroup[]
): OrderListGroup[] {
  return groups.filter(hasAwaitingProcurementOrder);
}

export function getOrderLensRef(
  order: OrderRecord
): { lensType: OrderRecord["lensType"]; lensId: string } | null {
  if (order.singleVisionLens?.id) {
    return { lensType: order.lensType, lensId: order.singleVisionLens.id };
  }
  if (order.kryptokLens?.id) {
    return { lensType: order.lensType, lensId: order.kryptokLens.id };
  }
  if (order.progressiveLens?.id) {
    return { lensType: order.lensType, lensId: order.progressiveLens.id };
  }
  return null;
}

export function isColorLensOrder(order: OrderRecord): boolean {
  return order.notes?.includes("[Color Lens]") ?? false;
}

export function isRxOrder(order: OrderRecord): boolean {
  return order.notes?.includes("[RX Order]") ?? false;
}

function isPhotoOrder(order: OrderRecord): boolean {
  return (
    Boolean(order.orderImageUrl?.trim()) &&
    !isColorLensOrder(order) &&
    !isRxOrder(order)
  );
}

export function getGroupStatusDisplay(
  orders: OrderRecord[]
): OrderCardStatusDisplay {
  const statuses = orders.map((order) => normalizeOrderStatus(order.status));
  const active = statuses.filter((status) => status !== "CANCELLED");

  if (active.length === 0) {
    return { label: "Cancelled", variant: "cancelled" };
  }

  const procurementLines = orders.filter((order) =>
    isProcurementLine(normalizeOrderStatus(order.status))
  ).length;
  const readyLines = orders.length - procurementLines;

  if (procurementLines > 0 && readyLines > 0) {
    return { label: "Partial", variant: "partial" };
  }

  if (procurementLines === orders.length) {
    return { label: "Procurement", variant: "procurement" };
  }

  if (active.every((status) => status === "COMPLETED")) {
    return { label: "Completed", variant: "completed" };
  }

  if (active.every((status) => status === "PICKING")) {
    return { label: "Picking", variant: "progress" };
  }

  if (active.every((status) => status === "PENDING")) {
    return { label: "Ready to Pick", variant: "ready" };
  }

  if (active.some((status) => status === "AWAITING_PROCUREMENT")) {
    return { label: "Procurement", variant: "procurement" };
  }

  if (active.some((status) => status === "PARTIALLY_FULFILLED")) {
    return { label: "Partial", variant: "partial" };
  }

  if (
    active.some((status) => status === "PACKED" || status === "DISPATCHED")
  ) {
    return { label: formatOrderStatusLabel(active[0]), variant: "progress" };
  }

  return { label: formatOrderStatusLabel(active[0]), variant: "progress" };
}

export function groupOrdersForList(
  orders: OrderRecord[],
  companyFallback?: string | null,
  defaultCompanyName = "Customer"
): OrderListGroup[] {
  const buckets = new Map<string, OrderRecord[]>();
  const groups: OrderListGroup[] = [];

  for (const order of orders) {
    if (isPhotoOrder(order)) {
      const companyName =
        order.user?.businessName?.trim() ||
        companyFallback?.trim() ||
        order.user?.name?.trim() ||
        defaultCompanyName;

      groups.push({
        key: order.id,
        orders: [order],
        displayOrderId: formatDisplayOrderId(order),
        companyName,
        createdAt: order.createdAt,
        productCount: 0,
        pairCount: 0,
        totalAmount: 0,
        readyProductCount: 0,
        procurementProductCount: 0,
        status: { label: "Photo order", variant: "progress" },
        isPhotoOrder: true,
        photoUrl: order.orderImageUrl?.trim() || null,
      });
      continue;
    }

    const key = order.checkoutBatchId?.trim() || order.id;
    const list = buckets.get(key) ?? [];
    list.push(order);
    buckets.set(key, list);
  }

  for (const [key, batchOrders] of buckets) {
    const sorted = [...batchOrders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const primary = sorted[0];
    const companyName =
      primary.user?.businessName?.trim() ||
      companyFallback?.trim() ||
      primary.user?.name?.trim() ||
      defaultCompanyName;

    const activeOrders = sorted.filter(
      (order) => normalizeOrderStatus(order.status) !== "CANCELLED"
    );
    const readyProductCount = activeOrders.filter(
      (order) => !isProcurementLine(normalizeOrderStatus(order.status))
    ).length;
    const procurementProductCount = activeOrders.length - readyProductCount;

    groups.push({
      key,
      orders: sorted,
      displayOrderId: formatDisplayOrderId(primary),
      companyName,
      createdAt: primary.createdAt,
      productCount: sorted.length,
      pairCount: sorted.reduce(
        (sum, order) =>
          sum + pairsFromPieces(Math.max(1, Number(order.quantity) || 1)),
        0
      ),
      totalAmount: sorted.reduce(
        (sum, order) => sum + Number(order.totalAmount || 0),
        0
      ),
      readyProductCount,
      procurementProductCount,
      status: getGroupStatusDisplay(sorted),
    });
  }

  return groups.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getStatusPillClassName(variant: OrderCardStatusVariant): string {
  switch (variant) {
    case "ready":
      return "border-green-500/35 bg-green-500/14 text-green-500";
    case "partial":
      return "border-orange-400/35 bg-orange-400/14 text-orange-400";
    case "procurement":
      return "border-red-400/35 bg-red-400/14 text-red-400";
    case "completed":
      return "border-emerald-500/35 bg-emerald-500/14 text-emerald-500";
    case "cancelled":
      return "border-slate-400/30 bg-slate-400/12 text-slate-400";
    default:
      return "border-[var(--brand-primary)]/35 bg-[var(--brand-primary)]/14 text-[var(--brand-primary)]";
  }
}

export function formatOrderAmount(amount: number): string {
  return amount.toLocaleString("en-IN");
}
