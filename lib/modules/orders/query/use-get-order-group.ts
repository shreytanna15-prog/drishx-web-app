"use client";

import { QUERY_REGISTRY } from "@/lib/constants/api-registry";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { fetchOrdersForGroup } from "@/lib/orders-api";
import type { QueryOptions } from "@/lib/types/api-client";
import type { OrderRecord } from "@/lib/types/orders";

/** Resolve checkout-batch siblings for order detail screens. */
export function useGetOrderGroup(
  groupKey: string | undefined,
  options?: QueryOptions<OrderRecord[]>
) {
  const key = groupKey?.trim() ?? "";
  return useApiQuery(
    QUERY_REGISTRY.getOrderGroup,
    () => fetchOrdersForGroup(key),
    [key],
    {
      ...options,
      enabled: Boolean(key) && (options?.enabled ?? true),
    }
  );
}
