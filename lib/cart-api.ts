import { authFetch } from "@/lib/auth-fetch";
import { buildCartLineId } from "@/lib/cart-utils";
import { resolveCrossPowerMeta } from "@/lib/cross-power";
import type { CartItem, LensItem, WholesaleSpec } from "@/lib/types/lens";
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
  crossPower?: number | null;
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
  lineType?: "RETAIL" | "WHOLESALE";
  wholesaleSpec?: WholesaleSpec | null;
  lensProductPowerId?: string | null;
};

function mapServerItem(row: ServerCartItem): CartItem {
  const cartLineKey = row.cartLineKey ?? row.cartLineId;
  const crossPower =
    resolveCrossPowerMeta({
      crossPower:
        row.crossPower !== null && row.crossPower !== undefined
          ? Number(row.crossPower)
          : null,
      sph: row.sph,
      cyl: row.cyl,
    })?.maxCyl ?? null;
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
    crossPower,
    add: row.add,
    axis: row.axis,
    eye: row.eye ?? undefined,
    quantity: row.quantity,
    createdAt: row.createdAt,
    lensType: (row.lensType as CartItem["lensType"]) ?? undefined,
    brand: row.brand,
    item: row.item,
    coating: row.coating,
    lineType: row.lineType ?? "RETAIL",
    wholesaleSpec: row.wholesaleSpec ?? null,
    lensProductPowerId: row.lensProductPowerId ?? null,
  };
}

/** @deprecated Headers are ignored; authFetch attaches a live Bearer token. */
export async function fetchCart(
  _headers?: Record<string, string>
): Promise<CartItem[]> {
  const response = await authFetch("/api/cart", { cache: "no-store" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error || "Failed to load cart.");
  }
  const items = (result.items ?? []) as ServerCartItem[];
  return items.map(mapServerItem);
}

/** @deprecated Headers are ignored; authFetch attaches a live Bearer token. */
export async function upsertCartLine(
  item: LensItem,
  quantity: number,
  _headers?: Record<string, string>
): Promise<{ item: CartItem; message?: string }> {
  const cartLineKey = buildCartLineId(item);
  const lensType = item.lensType ?? "Progressive";

  const response = await authFetch("/api/cart", {
    method: "POST",
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
      ...(item.lensProductPowerId ? { lensProductPowerId: item.lensProductPowerId } : {}),
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
    quantity: Math.max(1, Math.round(quantity)),
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
    ...(item.lensProductPowerId ? { lensProductPowerId: item.lensProductPowerId } : {}),
  };
}

/** @deprecated Headers are ignored; authFetch attaches a live Bearer token. */
export async function bulkUpsertCartLines(
  lines: Array<{ item: LensItem; quantity: number }>,
  _headers?: Record<string, string>
): Promise<{ count: number; message?: string }> {
  if (lines.length === 0) {
    return { count: 0 };
  }

  let totalCount = 0;
  let message: string | undefined;

  for (let offset = 0; offset < lines.length; offset += BULK_CART_CHUNK_SIZE) {
    const chunk = lines.slice(offset, offset + BULK_CART_CHUNK_SIZE);
    const response = await authFetch("/api/cart/bulk", {
      method: "POST",
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

export type UpsertWholesaleCartInput = {
  lensId: string;
  lensType: string;
  unitPrice: number;
  brand?: string | null;
  coating?: string | null;
  item?: string | null;
  lensTypeLabel?: string | null;
  ranges: WholesaleSpec["ranges"];
  gridMode: WholesaleSpec["gridMode"];
  defaultPairsPerCell: number;
  qtyOverrides?: Record<string, number>;
  productAxis?: number | null;
  isBifocalLens: boolean;
  isSingleVision: boolean;
  crossPower?: number | null;
};

/** @deprecated Headers are ignored; authFetch attaches a live Bearer token. */
export async function upsertWholesaleCartBatch(
  input: UpsertWholesaleCartInput,
  _headers?: Record<string, string>
): Promise<{ item: CartItem; expandedLineCount: number; message?: string }> {
  const response = await authFetch("/api/cart/wholesale", {
    method: "POST",
    body: JSON.stringify(input),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error || "Failed to add wholesale batch to cart.");
  }

  return {
    item: mapServerItem(result.item as ServerCartItem),
    expandedLineCount:
      typeof result.expandedLineCount === "number" ? result.expandedLineCount : 0,
    message: typeof result.message === "string" ? result.message : undefined,
  };
}

/** @deprecated Headers are ignored; authFetch attaches a live Bearer token. */
export async function removeCartLine(
  cartLineKey: string,
  _headers?: Record<string, string>
): Promise<void> {
  const response = await authFetch(
    `/api/cart?cartLineKey=${encodeURIComponent(cartLineKey)}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result?.error || "Failed to remove from cart.");
  }
}

/** @deprecated Headers are ignored; authFetch attaches a live Bearer token. */
export async function clearServerCart(
  _headers?: Record<string, string>
): Promise<void> {
  const response = await authFetch("/api/cart", { method: "DELETE" });
  if (response.ok) {
    return;
  }

  const result = await response.json().catch(() => ({}));
  const items = await fetchCart().catch(() => [] as CartItem[]);

  if (items.length === 0) {
    return;
  }

  const results = await Promise.allSettled(
    items.map((item) =>
      removeCartLine(item.cartLineKey ?? item.cartLineId)
    )
  );

  const failed = results.filter((entry) => entry.status === "rejected");
  if (failed.length > 0) {
    throw new Error(result?.error || "Failed to clear cart.");
  }
}
