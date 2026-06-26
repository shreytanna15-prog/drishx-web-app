import type { OrderRecord } from "./types/orders";
import type { ApiLensType, CartItem } from "./types/lens";
import { toApiLensType } from "./types/lens";
import { getStoredToken } from "./auth-storage";

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
  checkoutBatchId?: string
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
    };

    const response = await fetch("/api/orders", {
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

export async function fetchOrders(): Promise<OrderRecord[]> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch("/api/orders", {
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
