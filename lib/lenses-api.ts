import type { FilterOption, LensItem, LensType, SelectableRange } from "@/lib/types/lens";

export const PAGE_SIZE = 21;
export const LOAD_MORE_AT_INDEX = 14;

export type LensesPageResponse = {
  items: Array<{
    id: string;
    lensType: "KRYPTOK" | "PROGRESSIVE" | "SINGLE_VISION";
    costPrice: number | null;
    price: number;
    sph: number | null;
    cyl: number | null;
    crossPower?: number | null;
    axis: number | null;
    add: number | null;
    eye: string | null;
    quantity: number;
    createdAt: string;
    brand: string | null;
    item: string | null;
    coating: string | null;
    index?: number | null;
    selectableRange?: SelectableRange | null;
  }>;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

function toDisplayLensType(
  apiType: LensesPageResponse["items"][number]["lensType"]
): LensType {
  switch (apiType) {
    case "KRYPTOK":
      return "Kryptok";
    case "PROGRESSIVE":
      return "Progressive";
    case "SINGLE_VISION":
      return "Single Vision";
  }
}

export function filterToApiType(filter: FilterOption): string {
  switch (filter) {
    case "All":
      return "all";
    case "Kryptok":
      return "kryptok";
    case "Progressive":
      return "progressive";
    case "Single Vision":
      return "single-vision";
  }
}

export function mapApiLens(item: LensesPageResponse["items"][number]): LensItem {
  return {
    id: item.id,
    costPrice: item.costPrice !== null ? Number(item.costPrice) : null,
    price: Number(item.price),
    sph: item.sph !== null && item.sph !== undefined ? Number(item.sph) : null,
    cyl: item.cyl !== null ? Number(item.cyl) : null,
    crossPower:
      item.crossPower !== null && item.crossPower !== undefined
        ? Number(item.crossPower)
        : null,
    axis: item.axis,
    add: item.add !== null ? Number(item.add) : null,
    eye: item.eye ?? undefined,
    quantity: item.quantity,
    createdAt: item.createdAt,
    lensType: toDisplayLensType(item.lensType),
    brand: item.brand,
    item: item.item,
    coating: item.coating,
    index: item.index ?? null,
    selectableRange: item.selectableRange ?? null,
  };
}

export type LensCatalogItem = {
  name: string;
  productCount: number;
};

export async function fetchLensCatalogItems(
  type: string
): Promise<LensCatalogItem[]> {
  const params = new URLSearchParams({ type });
  const response = await fetch(`/api/lenses/items?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load lens items");
  }
  const data = (await response.json()) as { items?: LensCatalogItem[] };
  return data.items ?? [];
}

export async function fetchLensesPage({
  page,
  limit = PAGE_SIZE,
  type,
  search,
  item,
}: {
  page: number;
  limit?: number;
  type: FilterOption;
  search: string;
  item?: string;
}): Promise<LensesPageResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    type: filterToApiType(type),
  });

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    params.set("search", trimmedSearch);
  }

  const trimmedItem = item?.trim();
  if (trimmedItem) {
    params.set("item", trimmedItem);
  }

  const response = await fetch(`/api/lenses?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load lenses");
  }

  return response.json() as Promise<LensesPageResponse>;
}
