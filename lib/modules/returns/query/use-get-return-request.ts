"use client";

import { QUERY_REGISTRY } from "@/lib/constants/api-registry";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import {
  fetchReturnRequest,
  type ReturnRequestRecord,
} from "@/lib/returns-api";
import type { QueryOptions } from "@/lib/types/api-client";

/**
 * Return-request-by-id query (drishx-client-api).
 * Wraps existing fetchReturnRequest — screens never call authFetch directly.
 */
export function useGetReturnRequest(
  returnId: string | undefined,
  options?: QueryOptions<ReturnRequestRecord>
) {
  const enabled = Boolean(returnId) && (options?.enabled ?? true);

  return useApiQuery(
    QUERY_REGISTRY.getReturnRequest,
    () => fetchReturnRequest(returnId!),
    [returnId],
    {
      ...options,
      enabled,
    }
  );
}
