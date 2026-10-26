import { getAuthHeaders } from "@/lib/auth-fetch";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import type { Paginated } from "@/lib/types/api-client";
import type { OrderRecord } from "@/lib/types/orders";

export type CustomerCompany = {
  id: string;
  name: string | null;
  email: string;
  businessName: string | null;
};

export type ListCustomersParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  activeOnly?: boolean;
};

export type PaginatedCustomers = Paginated<CustomerCompany>;

type CustomerResponse = {
  customers?: CustomerCompany[];
  items?: CustomerCompany[];
  page?: number;
  limit?: number;
  hasMore?: boolean;
  total?: number;
};

function buildCustomersQueryString(params?: ListCustomersParams): string {
  const qs = new URLSearchParams();
  qs.set("status", params?.status?.trim() || "orderable");
  if (params?.activeOnly !== false) qs.set("activeOnly", "1");
  qs.set("page", String(params?.page ?? 1));
  qs.set("limit", String(params?.limit ?? 30));
  if (params?.q?.trim()) qs.set("q", params.q.trim());
  return `?${qs.toString()}`;
}

function normalizeCustomersResponse(data: unknown): PaginatedCustomers {
  if (Array.isArray(data)) {
    return {
      items: data as CustomerCompany[],
      page: 1,
      limit: data.length,
      hasMore: false,
      total: data.length,
    };
  }
  const body = data as CustomerResponse | null;
  const items = Array.isArray(body?.items)
    ? body.items
    : Array.isArray(body?.customers)
      ? body.customers
      : [];
  return {
    items,
    page: typeof body?.page === "number" ? body.page : 1,
    limit: typeof body?.limit === "number" ? body.limit : items.length,
    hasMore: Boolean(body?.hasMore),
    total: typeof body?.total === "number" ? body.total : undefined,
  };
}

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

/**
 * Paginated approved customers for on-behalf / staff pickers (RW-11).
 * Prefer /api/users/customers; falls back to deduping a single orders page when unavailable.
 */
export async function fetchCustomerCompanies(
  params?: ListCustomersParams
): Promise<PaginatedCustomers> {
  const headers = getAuthHeaders();
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 30;

  const response = await fetchWithRetry(
    `/api/users/customers${buildCustomersQueryString({
      ...params,
      page,
      limit,
      status: params?.status ?? "orderable",
      activeOnly: params?.activeOnly !== false,
    })}`,
    {
      headers,
      cache: "no-store",
    }
  );
  const result = (await response.json().catch(() => ({}))) as CustomerResponse & {
    error?: string;
  };

  if (response.ok) {
    return normalizeCustomersResponse(result);
  }

  // Fallback only for page 1 when customers route is unavailable.
  if (page > 1) {
    throw new Error(result?.error || "Failed to load customers.");
  }

  const { normalizeOrdersListResponse, buildOrdersQueryString } = await import(
    "@/lib/orders-api"
  );
  const fallbackResponse = await fetchWithRetry(
    `/api/orders${buildOrdersQueryString({
      page: 1,
      limit,
      q: params?.q,
    })}`,
    {
      headers,
      cache: "no-store",
    }
  );
  if (!fallbackResponse.ok) {
    const fallbackResult = (await fallbackResponse.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      result?.error || fallbackResult?.error || "Failed to load customers."
    );
  }

  const ordersPage = normalizeOrdersListResponse(
    await fallbackResponse.json().catch(() => [])
  );
  const items = dedupeCustomersFromOrders(ordersPage.items);
  return {
    items,
    page: 1,
    limit,
    hasMore: ordersPage.hasMore,
    total: items.length,
  };
}
