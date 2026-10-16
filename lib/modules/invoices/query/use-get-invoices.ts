"use client";

import { QUERY_REGISTRY } from "@/lib/constants/api-registry";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { fetchInvoices, type InvoiceRecord } from "@/lib/invoices-api";
import type { QueryOptions } from "@/lib/types/api-client";

export function useGetInvoices(options?: QueryOptions<InvoiceRecord[]>) {
  return useApiQuery(
    QUERY_REGISTRY.getInvoices,
    () => fetchInvoices(),
    [],
    options
  );
}
