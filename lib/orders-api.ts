import type { OrderRecord } from "./types/orders";
import { getStoredToken } from "./auth-storage";

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
