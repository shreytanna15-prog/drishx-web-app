import { getBackendUrl } from "./backend-url";
import { fetchWithRetry } from "./fetch-with-retry";
import type { OrderRecord } from "./types/orders";
import type { OrderTrackingStatus } from "./order-tracking";
import type { ApiLensType, CartItem, LensItem } from "./types/lens";
import { toApiLensType } from "./types/lens";
import { getStoredToken } from "./auth-storage";

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
  userId?: string
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
    };

    const response = await fetchWithRetry("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
    options?.userId
  );
}

export async function wholesaleCheckout(
  cartLineKeys: string[],
  token: string,
  notes?: string,
  checkoutBatchId?: string
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cartLineKeys,
        ...(notes?.trim() ? { notes: notes.trim() } : {}),
        ...(checkoutBatchId?.trim()
          ? { checkoutBatchId: checkoutBatchId.trim() }
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

export async function fetchOrders(): Promise<OrderRecord[]> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetchWithRetry("/api/orders", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to load orders.");
  }

  return res.json() as Promise<OrderRecord[]>;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderTrackingStatus,
  pickedQuantity?: number
): Promise<OrderRecord> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const body: { status: OrderTrackingStatus; pickedQuantity?: number } = {
    status,
  };
  if (pickedQuantity !== undefined) {
    body.pickedQuantity = pickedQuantity;
  }

  const res = await fetchWithRetry(`/api/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to update order status.");
  }

  return res.json() as Promise<OrderRecord>;
}

export async function cancelOrder(orderId: string): Promise<void> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetchWithRetry(`/api/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
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
