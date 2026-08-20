import { getAuthHeaders } from "@/lib/auth-fetch";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import type { OrderRecord } from "@/lib/types/orders";

export type CustomerCompany = {
  id: string;
  name: string | null;
  email: string;
  businessName: string | null;
};

type CustomerResponse = {
  customers?: CustomerCompany[];
};

function dedupeCustomersFromOrders(orders: OrderRecord[]): CustomerCompany[] {
  const map = new Map<string, CustomerCompany>();
  for (const order of orders) {
    const user = order.user;
    if (!user?.id || !user?.email) {
      continue;
    }
    if (!map.has(user.id)) {
      map.set(user.id, {
        id: user.id,
        name: user.name ?? null,
        email: user.email,
        businessName: user.businessName ?? null,
      });
    }
  }

  return [...map.values()].sort((a, b) => {
    const aLabel = (a.businessName || a.name || a.email).toLowerCase();
    const bLabel = (b.businessName || b.name || b.email).toLowerCase();
    return aLabel.localeCompare(bLabel);
  });
}

export async function fetchCustomerCompanies(): Promise<CustomerCompany[]> {
  const headers = getAuthHeaders();

  const response = await fetchWithRetry("/api/users/customers", {
    headers,
    cache: "no-store",
  });
  const result = (await response.json().catch(() => ({}))) as CustomerResponse & {
    error?: string;
  };

  if (response.ok) {
    return Array.isArray(result.customers) ? result.customers : [];
  }

  const fallbackResponse = await fetchWithRetry("/api/orders", {
    headers,
    cache: "no-store",
  });
  if (!fallbackResponse.ok) {
    const fallbackResult = (await fallbackResponse.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(result?.error || fallbackResult?.error || "Failed to load customers.");
  }

  const orders = (await fallbackResponse.json().catch(() => [])) as OrderRecord[];
  return dedupeCustomersFromOrders(Array.isArray(orders) ? orders : []);
}
