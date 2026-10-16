"use client";

import { QUERY_REGISTRY } from "@/lib/constants/api-registry";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { fetchOrders } from "@/lib/orders-api";
import type { QueryOptions } from "@/lib/types/api-client";
import type { OrderRecord } from "@/lib/types/orders";

/**
 * Gold-standard orders query (drishx-client-api).
 * Wraps existing fetchOrders — no transport calls in screens.
 */
export function useGetOrders(options?: QueryOptions<OrderRecord[]>) {
  return useApiQuery(
    QUERY_REGISTRY.getOrders,
    () => fetchOrders(),
    [],
    options
  );
}
