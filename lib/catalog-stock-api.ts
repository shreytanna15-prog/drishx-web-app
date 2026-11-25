import { authFetch } from "@/lib/auth-fetch";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { fetchDeliveryServices } from "@/lib/delivery-api";
import type { Paginated } from "@/lib/types/api-client";

export type CatalogPower = {
  id: string; variantId: string; skuCode: string; name: string;
  family: string; base: string; sph: number; cyl: number;
  axis: number | null; addition: number | null; eye: string | null;
  price: number; available: number;
};

export async function fetchCatalogPowers(params: { q?: string; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 24));
  const res = await fetchWithRetry(`/api/catalog/powers?${query}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load catalog stock.");
  return res.json() as Promise<Paginated<CatalogPower>>;
}

export { fetchDeliveryServices };

export type CatalogOrderInput = {
  lensProductPowerId: string; quantity: number;
  stockMode: "LIVE" | "NON_LIVE";
  deliveryServiceId: string;
  userId?: string;
  notes?: string;
};

export async function placeCatalogOrder(input: CatalogOrderInput): Promise<{ order: { id: string }; needsProcurement: boolean }> {
  const res = await authFetch("/api/orders/catalog", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error || "Could not place catalog order.");
  }
  return res.json();
}
