"use client";

import { QUERY_REGISTRY } from "@/lib/constants/api-registry";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import {
  fetchOrdersOverview,
  type OrdersOverview,
} from "@/lib/orders-api";
import type { QueryOptions } from "@/lib/types/api-client";

export function useGetOrdersOverview(
  options?: QueryOptions<OrdersOverview>
) {
  return useApiQuery(
    QUERY_REGISTRY.getOrdersOverview,
    () => fetchOrdersOverview(),
    [],
    options
  );
}
