"use client";

import { fetchCatalogPowers } from "@/lib/catalog-stock-api";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { QUERY_REGISTRY } from "@/lib/constants/api-registry";

export function useGetCatalogPowers(params: { q?: string; page?: number; limit?: number }) {
  return useApiQuery(
    QUERY_REGISTRY.getCatalogPowers,
    () => fetchCatalogPowers(params),
    [params.q, params.page, params.limit]
  );
}
