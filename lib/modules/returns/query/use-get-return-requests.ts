"use client";

import { QUERY_REGISTRY } from "@/lib/constants/api-registry";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import {
  fetchReturnRequests,
  type ReturnRequestRecord,
} from "@/lib/returns-api";
import type { QueryOptions } from "@/lib/types/api-client";

export function useGetReturnRequests(
  options?: QueryOptions<ReturnRequestRecord[]>
) {
  return useApiQuery(
    QUERY_REGISTRY.getReturnRequests,
    () => fetchReturnRequests(),
    [],
    options
  );
}
