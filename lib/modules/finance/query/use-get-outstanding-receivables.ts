"use client";

import { QUERY_REGISTRY } from "@/lib/constants/api-registry";
import {
  fetchOutstandingReceivables,
  type OutstandingReceivables,
} from "@/lib/finance-api";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import type { QueryOptions } from "@/lib/types/api-client";

export function useGetOutstandingReceivables(
  options?: QueryOptions<OutstandingReceivables>
) {
  return useApiQuery(
    QUERY_REGISTRY.getOutstandingReceivables,
    () => fetchOutstandingReceivables(),
    [],
    options
  );
}
