"use client";

import { placeCatalogOrder, type CatalogOrderInput } from "@/lib/catalog-stock-api";
import { useApiMutation } from "@/lib/hooks/use-api-mutation";
import type { MutationOptions } from "@/lib/types/api-client";

type Result = Awaited<ReturnType<typeof placeCatalogOrder>>;

export function usePlaceCatalogOrder(options?: MutationOptions<Result, CatalogOrderInput>) {
  return useApiMutation(placeCatalogOrder, options);
}
