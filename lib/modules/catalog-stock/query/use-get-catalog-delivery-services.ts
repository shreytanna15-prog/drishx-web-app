"use client";

import { fetchDeliveryServices } from "@/lib/catalog-stock-api";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { QUERY_REGISTRY } from "@/lib/constants/api-registry";

export function useGetCatalogDeliveryServices() {
  return useApiQuery(
    QUERY_REGISTRY.getCatalogDeliveryServices,
    fetchDeliveryServices,
    []
  );
}
