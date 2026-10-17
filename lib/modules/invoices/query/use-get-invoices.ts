"use client";

import { QUERY_REGISTRY } from "@/lib/constants/api-registry";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import {
  fetchInvoices,
  type ListInvoicesParams,
  type PaginatedInvoices,
} from "@/lib/invoices-api";
import type { QueryOptions } from "@/lib/types/api-client";

export function useGetInvoices(
  params?: ListInvoicesParams,
  options?: QueryOptions<PaginatedInvoices>
) {
  return useApiQuery(
    QUERY_REGISTRY.getInvoices,
    () => fetchInvoices(params),
    [
      params?.page,
      params?.limit,
      params?.status,
      params?.q,
      params?.dateFrom,
      params?.dateTo,
    ],
    options
  );
}
