import { buildCartLineId } from "@/lib/cart-utils";
import type { CartItem, LensItem } from "@/lib/types/lens";
import { toApiLensType } from "@/lib/types/lens";

export type ServerCartItem = {
  id: string;
  cartLineId: string;
  cartLineKey: string;
  cartQuantity: number;
  reservedQuantity: number;
  isBackorder: boolean;
  price: number;
  sph: number;
  cyl: number | null;
  add: number | null;
  axis: number | null;
  eye: string | null;
  brand: string | null;
  item: string | null;
  coating: string | null;
  lensType: string | null;
  quantity: number;
  expiresAt: string;
  createdAt: string;
};

function mapServerItem(row: ServerCartItem): CartItem {
  const cartLineKey = row.cartLineKey ?? row.cartLineId;
  return {
    id: row.id,
    cartLineId: cartLineKey,
    cartLineKey,
    cartQuantity: row.cartQuantity,
    reservedQuantity: row.reservedQuantity,
    isBackorder: row.isBackorder,
    expiresAt: row.expiresAt,
    price: row.price,
    costPrice: null,
    sph: row.sph,
    cyl: row.cyl,
    add: row.add,
    axis: row.axis,
    eye: row.eye ?? undefined,
    quantity: row.quantity,
    createdAt: row.createdAt,
    lensType: (row.lensType as CartItem["lensType"]) ?? undefined,
    brand: row.brand,
    item: row.item,
    coating: row.coating,
  };
}

export async function fetchCart(
  headers: Record<string, string>
): Promise<CartItem[]> {
  const response = await fetch("/api/cart", { headers, cache: "no-store" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error || "Failed to load cart.");
  }
  const items = (result.items ?? []) as ServerCartItem[];
  return items.map(mapServerItem);
}

export async function upsertCartLine(
  item: LensItem,
  quantity: number,
  headers: Record<string, string>
): Promise<{ item: CartItem; message?: string }> {
  const cartLineKey = buildCartLineId(item);
  const lensType = item.lensType ?? "Progressive";

  const response = await fetch("/api/cart", {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lensType: toApiLensType(lensType),
      lensId: item.id,
      cartLineKey,
      quantity,
      unitPrice: item.price,
      sph: item.sph,
      cyl: item.cyl,
      add: item.add,
      axis: item.axis,
      eye: item.eye,
      brand: item.brand,
      coating: item.coating,
      item: item.item,
      lensTypeLabel: lensType,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error || "Failed to add to cart.");
  }

  return {
    item: mapServerItem(result.item as ServerCartItem),
    message: typeof result.message === "string" ? result.message : undefined,
  };
}

export const BULK_CART_CHUNK_SIZE = 200;

function toBulkLineBody(item: LensItem, quantity: number) {
  const cartLineKey = buildCartLineId(item);
  const lensType = item.lensType ?? "Progressive";

  return {
    lensType: toApiLensType(lensType),
    lensId: item.id,
    cartLineKey,
    quantity: Math.max(1, Math.floor(quantity)),
    unitPrice: item.price,
    sph: item.sph,
    cyl: item.cyl,
    add: item.add,
    axis: item.axis,
    eye: item.eye,
    brand: item.brand,
    coating: item.coating,
    item: item.item,
    lensTypeLabel: lensType,
  };
}

export async function bulkUpsertCartLines(
  lines: Array<{ item: LensItem; quantity: number }>,
  headers: Record<string, string>
): Promise<{ count: number; message?: string }> {
  if (lines.length === 0) {
    return { count: 0 };
  }

  let totalCount = 0;
  let message: string | undefined;

  for (let offset = 0; offset < lines.length; offset += BULK_CART_CHUNK_SIZE) {
    const chunk = lines.slice(offset, offset + BULK_CART_CHUNK_SIZE);
    const response = await fetch("/api/cart/bulk", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lines: chunk.map((line) => toBulkLineBody(line.item, line.quantity)),
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error || "Failed to add to cart.");
    }

    const chunkCount =
      typeof result.count === "number"
        ? result.count
        : Array.isArray(result.items)
          ? result.items.length
          : chunk.length;
    totalCount += chunkCount;

    if (typeof result.message === "string") {
      message = result.message;
    }
  }

  return { count: totalCount, message };
}

export async function removeCartLine(
  cartLineKey: string,
  headers: Record<string, string>
): Promise<void> {
  const response = await fetch(
    `/api/cart?cartLineKey=${encodeURIComponent(cartLineKey)}`,
    { method: "DELETE", headers }
  );
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result?.error || "Failed to remove from cart.");
  }
}

export async function clearServerCart(
  headers: Record<string, string>
): Promise<void> {
  const response = await fetch("/api/cart", { method: "DELETE", headers });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result?.error || "Failed to clear cart.");
  }
}
