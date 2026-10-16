/**
 * Stable query/mutation keys for client hooks (drishx-client-api skill).
 * Add entries when introducing feature hooks — keep aligned with real api modules.
 */

export const QUERY_REGISTRY = {
  getOrders: "getOrders",
  getCart: "getCart",
  getInvoices: "getInvoices",
  getInvoice: "getInvoice",
  getReturnRequests: "getReturnRequests",
  getReturnRequest: "getReturnRequest",
} as const;

export const MUTATION_REGISTRY = {
  updateCart: "updateCart",
  downloadInvoicePdf: "downloadInvoicePdf",
} as const;

export type QueryRegistryKey =
  (typeof QUERY_REGISTRY)[keyof typeof QUERY_REGISTRY];

export type MutationRegistryKey =
  (typeof MUTATION_REGISTRY)[keyof typeof MUTATION_REGISTRY];
