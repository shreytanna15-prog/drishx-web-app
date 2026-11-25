"use client";

import { fetchOrderById } from '@/lib/orders-api';
import { QUERY_REGISTRY } from '@/lib/constants/api-registry';
import { useApiQuery } from '@/lib/hooks/use-api-query';

export function useGetCatalogOrder(id: string) {
  return useApiQuery(QUERY_REGISTRY.getCatalogOrder,
    () => fetchOrderById(id), [id], { enabled: Boolean(id) });
}
