"use client";

import { QUERY_REGISTRY } from "@/lib/constants/api-registry";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import {
  fetchOrders,
  type ListOrdersParams,
  type PaginatedOrders,
} from "@/lib/orders-api";
import type { QueryOptions } from "@/lib/types/api-client";

/**
 * Paginated orders list (RW-11 Phase B).
 * Params first; deps include every request-changing field.
 */
export function useGetOrders(
  params?: ListOrdersParams,
  options?: QueryOptions<PaginatedOrders>
) {
  return useApiQuery(
    QUERY_REGISTRY.getOrders,
    () => fetchOrders(params),
    [
      params?.page,
      params?.limit,
      params?.status,
      params?.q,
      params?.userId,
      params?.batchId,
      params?.employeeId,
      params?.lineType,
      params?.orderKind,
      params?.scope,
      params?.assigneeId,
      params?.dateFrom,
      params?.dateTo,
    ],
    options
  );
}
