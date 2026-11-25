"use client";

import { requestOrderChange } from '@/lib/order-modifications-api';
import { useApiMutation } from '@/lib/hooks/use-api-mutation';
import type { MutationOptions } from '@/lib/types/api-client';

type Input = Parameters<typeof requestOrderChange>[0];
type Result = Awaited<ReturnType<typeof requestOrderChange>>;

export function useRequestOrderModification(options?: MutationOptions<Result, Input>) {
  return useApiMutation(requestOrderChange, options);
}
