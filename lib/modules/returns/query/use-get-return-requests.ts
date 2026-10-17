"use client";

import { QUERY_REGISTRY } from "@/lib/constants/api-registry";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import {
  fetchReturnRequests,
  type ListReturnsParams,
  type PaginatedReturns,
} from "@/lib/returns-api";
import type { QueryOptions } from "@/lib/types/api-client";

export function useGetReturnRequests(
  params?: ListReturnsParams,
  options?: QueryOptions<PaginatedReturns>
) {
  return useApiQuery(
    QUERY_REGISTRY.getReturnRequests,
    () => fetchReturnRequests(params),
    [
      params?.page,
      params?.limit,
      params?.status,
      params?.orderId,
      params?.q,
      params?.requestType,
    ],
    options
  );
}
