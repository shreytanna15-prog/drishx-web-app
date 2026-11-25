"use client";

import { fetchOrderChanges } from '@/lib/order-modifications-api';
import { QUERY_REGISTRY } from '@/lib/constants/api-registry';
import { useApiQuery } from '@/lib/hooks/use-api-query';

export function useGetOrderModifications(id: string) {
  return useApiQuery(QUERY_REGISTRY.getOrderModifications,
    () => fetchOrderChanges(id), [id], { enabled: Boolean(id) });
}
