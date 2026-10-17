import { getBackendUrl } from "./backend-url";
import { fetchWithRetry } from "./fetch-with-retry";
import { getAuthHeaders } from "./auth-fetch";
import type { Paginated } from "@/lib/types/api-client";
import type { OrderRecord } from "./types/orders";
import type { OrderTrackingStatus } from "./order-tracking";
import type { ApiLensType, CartItem, LensItem } from "./types/lens";
import { toApiLensType } from "./types/lens";

export type { OrderRecord } from "./types/orders";

export const ORDER_NOTES_MAX_LENGTH = 2000;

type CreateOrderPayload = {
  lensType: ApiLensType;
  lensId: string;
  quantity: number;
  cartLineKey?: string;
  checkoutBatchId?: string;
  sph: number;
  cyl?: number | null;
  axis?: number | null;
  add?: number | null;
  eye?: string;
  notes?: string;
  userId?: string;
  deliveryServiceId?: string;
};

function buildOrderPayload(item: CartItem): CreateOrderPayload {
  const lensType = toApiLensType(item.lensType ?? "Progressive");
  const payload: CreateOrderPayload = {
    lensType,
    lensId: item.id,
    quantity: item.cartQuantity,
    cartLineKey: item.cartLineKey ?? item.cartLineId,
    sph: item.sph ?? 0,
    cyl: item.cyl,
  };

  if (lensType === "KRYPTOK" || lensType === "PROGRESSIVE") {
    payload.axis = item.axis;
    payload.add = item.add;
  }

  if (lensType === "PROGRESSIVE" && item.eye) {
    payload.eye = item.eye.toUpperCase();
  }

  return payload;
}

export async function createOrder(
  item: CartItem,
  token: string,
  notes?: string,
  checkoutBatchId?: string,
  userId?: string,
  deliveryServiceId?: string
): Promise<
  | { success: true; orderId: string; status?: string }
  | { success: false; error: string }
> {
  try {
    const body = buildOrderPayload(item);
    const payload = {
      ...body,
      ...(notes?.trim() ? { notes: notes.trim() } : {}),
      ...(checkoutBatchId?.trim()
        ? { checkoutBatchId: checkoutBatchId.trim() }
        : {}),
      ...(userId?.trim() ? { userId: userId.trim() } : {}),
      ...(deliveryServiceId?.trim() ? { deliveryServiceId: deliveryServiceId.trim() } : {}),
    };

    const response = await fetchWithRetry("/api/orders", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        error: result?.error || "Failed to place order.",
      };
    }

    const order = result.order ?? result;
    const status = typeof order?.status === "string" ? order.status : "PENDING";
    return { success: true, orderId: order?.id ?? result.id, status };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to place order.",
    };
  }
}

export async function createOrderFromLens(
  lens: LensItem,
  quantity: number,
  token: string,
  options?: {
    notes?: string;
    checkoutBatchId?: string;
    userId?: string;
    deliveryServiceId?: string;
  }
): Promise<
  | { success: true; orderId: string; status?: string }
  | { success: false; error: string }
> {
  const safeQuantity = Number.isFinite(quantity)
    ? Math.max(1, Math.floor(quantity))
    : 1;
  const cartLikeItem: CartItem = {
    ...lens,
    cartLineId: lens.id,
    cartLineKey: lens.id,
    cartQuantity: safeQuantity,
    isBackorder: false,
  };

  return createOrder(
    cartLikeItem,
    token,
    options?.notes,
    options?.checkoutBatchId,
    options?.userId,
    options?.deliveryServiceId
  );
}

export async function wholesaleCheckout(
  cartLineKeys: string[],
  token: string,
  notes?: string,
  checkoutBatchId?: string,
  deliveryServiceId?: string
): Promise<
  | {
      success: true;
      successCount: number;
      procurementCount: number;
    }
  | {
      success: false;
      error: string;
      partialFailures?: string[];
      successCount?: number;
      procurementCount?: number;
    }
> {
  try {
    const response = await fetchWithRetry("/api/orders/wholesale-checkout", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        cartLineKeys,
        ...(notes?.trim() ? { notes: notes.trim() } : {}),
        ...(checkoutBatchId?.trim()
          ? { checkoutBatchId: checkoutBatchId.trim() }
          : {}),
        ...(deliveryServiceId?.trim()
          ? { deliveryServiceId: deliveryServiceId.trim() }
          : {}),
      }),
    });

    const result = await response.json().catch(() => ({}));
    const successCount =
      typeof result.successCount === "number" ? result.successCount : 0;
    const procurementCount =
      typeof result.procurementCount === "number" ? result.procurementCount : 0;

    if (!response.ok) {
      return {
        success: false,
        error: result?.error || "Failed to place wholesale orders.",
        partialFailures: Array.isArray(result.failures) ? result.failures : undefined,
        successCount,
        procurementCount,
      };
    }

    return { success: true, successCount, procurementCount };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to place wholesale orders.",
    };
  }
}

export type ListOrdersParams = {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
  userId?: string;
  batchId?: string;
  employeeId?: string;
  lineType?: string;
  orderKind?: string;
  scope?: "all" | "catalog" | "rx_lab";
  assigneeId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type PaginatedOrders = Paginated<OrderRecord>;

export function buildOrdersQueryString(params?: ListOrdersParams): string {
  const qs = new URLSearchParams();
  if (!params) return "";
  if (params.page != null) qs.set("page", String(params.page));
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.status?.trim()) qs.set("status", params.status.trim());
  if (params.q?.trim()) qs.set("q", params.q.trim());
  if (params.userId?.trim()) qs.set("userId", params.userId.trim());
  if (params.batchId?.trim()) qs.set("batchId", params.batchId.trim());
  if (params.employeeId?.trim()) qs.set("employeeId", params.employeeId.trim());
  if (params.lineType?.trim()) qs.set("lineType", params.lineType.trim());
  if (params.orderKind?.trim()) qs.set("orderKind", params.orderKind.trim());
  if (params.scope && params.scope !== "all") qs.set("scope", params.scope);
  if (params.assigneeId?.trim()) qs.set("assigneeId", params.assigneeId.trim());
  if (params.dateFrom?.trim()) qs.set("dateFrom", params.dateFrom.trim());
  if (params.dateTo?.trim()) qs.set("dateTo", params.dateTo.trim());
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function normalizeOrdersListResponse(data: unknown): PaginatedOrders {
  if (Array.isArray(data)) {
    return {
      items: data as OrderRecord[],
      page: 1,
      limit: data.length,
      hasMore: false,
      total: data.length,
    };
  }
  const body = data as Partial<PaginatedOrders> | null;
  const items = Array.isArray(body?.items) ? body.items : [];
  return {
    items,
    page: typeof body?.page === "number" ? body.page : 1,
    limit: typeof body?.limit === "number" ? body.limit : items.length,
    hasMore: Boolean(body?.hasMore),
    total: typeof body?.total === "number" ? body.total : undefined,
  };
}

/** Paginated summary list — BFF forwards query string unchanged. */
export async function fetchOrders(
  params?: ListOrdersParams
): Promise<PaginatedOrders> {
  const res = await fetchWithRetry(`/api/orders${buildOrdersQueryString(params)}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to load orders.");
  }

  return normalizeOrdersListResponse(await res.json());
}

/** Role-scoped dashboard aggregates (RW-11 Phase D). */
export type CustomerOrdersOverview = {
  role: "CUSTOMER";
  overview: {
    total: number;
    inProgress: number;
    readyToShip: number;
    completed: number;
  };
  trends: {
    total: { percent: number; direction: "up" | "down" | "flat" };
    inProgress: { percent: number; direction: "up" | "down" | "flat" };
    readyToShip: { percent: number; direction: "up" | "down" | "flat" };
    completed: { percent: number; direction: "up" | "down" | "flat" };
  };
  lastOrder: { id: string; label: string } | null;
  topProducts: Array<{
    lensId: string;
    title: string;
    subtitle: string;
    shopFilter: "Single Vision" | "Kryptok" | "Progressive";
    orderCount: number;
    totalQuantity: number;
  }>;
};

export type StaffOrdersOverview = {
  role: "EMPLOYEE" | "ADMIN";
  tasksAssigned: number;
  tasksCompleted: number;
  ordersReceived: number;
  ordersPending: number;
  pendingOrders: Array<{
    id: string;
    status: string;
    createdAt: string;
    orderNumber: number | null;
    lensType: string;
    checkoutBatchId?: string | null;
    user: {
      id: string;
      name: string | null;
      email: string;
      businessName: string | null;
    } | null;
  }>;
  pendingTasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: string;
  }>;
};

export type OrdersOverview = CustomerOrdersOverview | StaffOrdersOverview;

export async function fetchOrdersOverview(): Promise<OrdersOverview> {
  const res = await fetchWithRetry(`/api/orders/overview`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as OrdersOverview & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load orders overview.");
  }
  return data;
}

/** Fat detail — signed images, wholesale lines, power versions, etc. */
export async function fetchOrderById(orderId: string): Promise<OrderRecord> {
  const res = await fetchWithRetry(`/api/orders/${encodeURIComponent(orderId)}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Failed to load order."
    );
  }
  return data as OrderRecord;
}

/**
 * List rows omit signed image URLs. Hydrate lines that need a prescription
 * image from detail GET so group detail screens keep photo display.
 */
async function hydrateOrderImages(items: OrderRecord[]): Promise<OrderRecord[]> {
  const needImage = items.filter(
    (o) => o.hasOrderImage && !o.orderImageUrl?.trim()
  );
  if (needImage.length === 0) return items;

  const details = await Promise.all(
    needImage.map(async (o) => {
      try {
        return await fetchOrderById(o.id);
      } catch {
        return o;
      }
    })
  );
  const byId = new Map(details.map((d) => [d.id, d]));
  return items.map((o) => byId.get(o.id) ?? o);
}

/** Cap pages when expanding a checkout batch (100 × 50 = 5000 lines). */
export const ORDER_GROUP_MAX_PAGES = 50;

export type BatchOrdersPage<T extends { id: string } = OrderRecord> = {
  items: T[];
  hasMore: boolean;
};

/**
 * Walk paginated batch results until exhausted (no silent truncation).
 * Inject `fetchPage` for unit tests (groups > 100 lines).
 */
export async function collectAllBatchOrderPages<T extends { id: string }>(
  fetchPage: (page: number) => Promise<BatchOrdersPage<T>>,
  maxPages: number = ORDER_GROUP_MAX_PAGES
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore && page <= maxPages) {
    const result = await fetchPage(page);
    all.push(...result.items);
    hasMore = result.hasMore;
    page += 1;
  }
  return all;
}

async function listAllOrdersForBatch(batchId: string): Promise<OrderRecord[]> {
  return collectAllBatchOrderPages(async (page) => {
    const result = await fetchOrders({ batchId, page, limit: 100 });
    return { items: result.items, hasMore: result.hasMore };
  });
}

/**
 * Resolve a list/detail group key (batch id or order id) to sibling lines.
 * Prefer batchId filter; fall back to detail GET. Loads every page for the batch.
 */
export async function fetchOrdersForGroup(
  groupKey: string
): Promise<OrderRecord[]> {
  const key = groupKey.trim();
  if (!key) return [];

  const byBatch = await listAllOrdersForBatch(key);
  if (byBatch.length > 0) {
    return hydrateOrderImages(byBatch);
  }

  try {
    const order = await fetchOrderById(key);
    const batchId = order.checkoutBatchId?.trim();
    if (batchId && batchId !== key) {
      const batch = await listAllOrdersForBatch(batchId);
      if (batch.length > 0) {
        return hydrateOrderImages(batch);
      }
    }
    return [order];
  } catch {
    return [];
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderTrackingStatus,
  pickedQuantity?: number,
  extras?: {
    courierName?: string | null;
    trackingNumber?: string | null;
    deliveryServiceId?: string | null;
    actualWeight?: number | null;
    weightReason?: string | null;
  }
): Promise<OrderRecord> {
  const body: {
    status: OrderTrackingStatus;
    pickedQuantity?: number;
    courierName?: string | null;
    trackingNumber?: string | null;
    deliveryServiceId?: string | null;
    actualWeight?: number | null;
    weightReason?: string | null;
  } = {
    status,
  };
  if (pickedQuantity !== undefined) {
    body.pickedQuantity = pickedQuantity;
  }
  if (extras?.courierName !== undefined) body.courierName = extras.courierName;
  if (extras?.trackingNumber !== undefined) body.trackingNumber = extras.trackingNumber;
  if (extras?.deliveryServiceId !== undefined) body.deliveryServiceId = extras.deliveryServiceId;
  if (extras?.actualWeight !== undefined) body.actualWeight = extras.actualWeight;
  if (extras?.weightReason !== undefined) body.weightReason = extras.weightReason;

  const res = await fetchWithRetry(`/api/orders/${orderId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to update order status.");
  }

  return res.json() as Promise<OrderRecord>;
}

export async function dispatchOrder(
  orderId: string,
  courierName: string,
  trackingNumber: string
): Promise<{ order: OrderRecord; duplicateWarning?: string | null }> {
  const res = await fetchWithRetry(`/api/orders/${orderId}/dispatch`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ courierName, trackingNumber }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to dispatch order.");
  }

  return res.json() as Promise<{ order: OrderRecord; duplicateWarning?: string | null }>;
}

export async function cancelOrder(orderId: string): Promise<void> {
  const res = await fetchWithRetry(`/api/orders/${orderId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status: "CANCELLED" satisfies OrderTrackingStatus }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to cancel order.");
  }
}

export function resolveOrderImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  const backend = getBackendUrl();
  return `${backend}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

function hasOrderPrescription(order: OrderRecord): boolean {
  const hasSph =
    order.sph !== undefined && order.sph !== null && order.sph !== "";
  const hasCyl =
    order.cyl !== undefined && order.cyl !== null && order.cyl !== "";
  return hasSph || hasCyl;
}

function isWholesaleOrder(order: OrderRecord): boolean {
  return (
    order.lineType === "WHOLESALE" ||
    (Array.isArray(order.wholesaleLineItems) &&
      order.wholesaleLineItems.length > 0)
  );
}

export function getOrderLensDetails(order: OrderRecord) {
  if (hasOrderPrescription(order)) {
    const catalog =
      order.progressiveLens ?? order.kryptokLens ?? order.singleVisionLens ?? null;
    return {
      sph: order.sph ?? catalog?.sph ?? 0,
      cyl: order.cyl ?? catalog?.cyl ?? null,
      axis:
        order.axis ??
        (order.kryptokLens?.axis ?? order.progressiveLens?.axis ?? null),
      add:
        order.add ??
        (order.kryptokLens?.add ?? order.progressiveLens?.add ?? null),
      eye: order.eye ?? order.progressiveLens?.eye ?? undefined,
    };
  }

  // Wholesale parent rows keep sph/cyl null; powers live on wholesaleLineItems.
  // Do not fall back to catalog defaults (e.g. cross max CYL) — that hides real
  // ordered combinations like +0.50/-1.25 behind "--/-2".
  if (isWholesaleOrder(order)) {
    return null;
  }

  if (order.progressiveLens) {
    return {
      sph: order.progressiveLens.sph,
      cyl: order.progressiveLens.cyl,
      axis: order.progressiveLens.axis,
      add: order.progressiveLens.add,
      eye: order.progressiveLens.eye,
    };
  }
  if (order.kryptokLens) {
    return {
      sph: order.kryptokLens.sph,
      cyl: order.kryptokLens.cyl,
      axis: order.kryptokLens.axis,
      add: order.kryptokLens.add,
    };
  }
  if (order.singleVisionLens) {
    return {
      sph: order.singleVisionLens.sph,
      cyl: order.singleVisionLens.cyl,
    };
  }
  return null;
}
