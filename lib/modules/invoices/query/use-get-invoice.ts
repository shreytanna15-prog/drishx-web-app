"use client";

import { QUERY_REGISTRY } from "@/lib/constants/api-registry";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { fetchInvoiceById, type InvoiceRecord } from "@/lib/invoices-api";
import type { QueryOptions } from "@/lib/types/api-client";

/**
 * Invoice-by-id query (drishx-client-api).
 * Wraps existing fetchInvoiceById — screens never call authFetch directly.
 */
export function useGetInvoice(
  invoiceId: string | undefined,
  options?: QueryOptions<InvoiceRecord>
) {
  const enabled = Boolean(invoiceId) && (options?.enabled ?? true);

  return useApiQuery(
    QUERY_REGISTRY.getInvoice,
    () => fetchInvoiceById(invoiceId!),
    [invoiceId],
    {
      ...options,
      enabled,
    }
  );
}
