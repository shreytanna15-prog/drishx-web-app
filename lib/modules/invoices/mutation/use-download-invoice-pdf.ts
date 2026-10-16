"use client";

import { useApiMutation } from "@/lib/hooks/use-api-mutation";
import {
  downloadInvoicePdf,
  type InvoiceTaxDocument,
} from "@/lib/invoices-api";
import type { MutationOptions } from "@/lib/types/api-client";

export type DownloadInvoicePdfVariables = {
  id: string;
  invoiceNumber?: string;
};

/**
 * Authenticated tax-invoice document fetch (drishx-client-api).
 * Registry key: MUTATION_REGISTRY.downloadInvoicePdf.
 * Wraps downloadInvoicePdf — screens never call authFetch directly.
 */
export function useDownloadInvoicePdf(
  options?: MutationOptions<InvoiceTaxDocument, DownloadInvoicePdfVariables>
) {
  return useApiMutation(
    (variables: DownloadInvoicePdfVariables) =>
      downloadInvoicePdf(variables.id, variables.invoiceNumber),
    options
  );
}
