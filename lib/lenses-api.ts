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
    sphStartRange?: number | null;
    cyl: number | null;
    cylStartRange?: number | null;
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
    sphStartRange:
      item.sphStartRange !== null && item.sphStartRange !== undefined
        ? Number(item.sphStartRange)
        : null,
    cyl: item.cyl !== null ? Number(item.cyl) : null,
    cylStartRange:
      item.cylStartRange !== null && item.cylStartRange !== undefined
        ? Number(item.cylStartRange)
        : null,
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

type LensDetailResponse = {
  id: string;
  costPrice?: number | string | null;
  price: number | string;
  sph?: number | string | null;
  sphStartRange?: number | string | null;
  cyl?: number | string | null;
  cylStartRange?: number | string | null;
  crossPower?: number | string | null;
  axis?: number | string | null;
  add?: number | string | null;
  eye?: string | null;
  quantity: number;
  createdAt: string;
  brand?: string | null;
  item?: string | null;
  coating?: string | null;
  index?: number | string | null;
  selectableRange?: SelectableRange | null;
};

function apiTypeFromFilter(type: FilterOption): LensesPageResponse["items"][number]["lensType"] {
  switch (type) {
    case "Kryptok":
      return "KRYPTOK";
    case "Progressive":
      return "PROGRESSIVE";
  }
  return "SINGLE_VISION";
}

function mapDetailLens(
  data: LensDetailResponse,
  type: FilterOption
): LensItem {
  return mapApiLens({
    id: data.id,
    lensType: apiTypeFromFilter(type),
    costPrice:
      data.costPrice !== null && data.costPrice !== undefined
        ? Number(data.costPrice)
        : null,
    price: Number(data.price),
    sph:
      data.sph !== null && data.sph !== undefined ? Number(data.sph) : null,
    sphStartRange:
      data.sphStartRange !== null && data.sphStartRange !== undefined
        ? Number(data.sphStartRange)
        : null,
    cyl: data.cyl !== null && data.cyl !== undefined ? Number(data.cyl) : null,
    cylStartRange:
      data.cylStartRange !== null && data.cylStartRange !== undefined
        ? Number(data.cylStartRange)
        : null,
    crossPower:
      data.crossPower !== null && data.crossPower !== undefined
        ? Number(data.crossPower)
        : null,
    axis:
      data.axis !== null && data.axis !== undefined ? Number(data.axis) : null,
    add: data.add !== null && data.add !== undefined ? Number(data.add) : null,
    eye: data.eye ?? null,
    quantity: data.quantity,
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : new Date(data.createdAt).toISOString(),
    brand: data.brand ?? null,
    item: data.item ?? null,
    coating: data.coating ?? null,
    index:
      data.index !== null && data.index !== undefined
        ? Number(data.index)
        : null,
    selectableRange: data.selectableRange ?? null,
  });
}

export async function fetchLensById(
  id: string,
  type: FilterOption
): Promise<LensItem> {
  const apiType = filterToApiType(type);
  const response = await fetch(`/api/lenses/${apiType}/${id}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load lens details");
  }
  const data = (await response.json()) as LensDetailResponse;
  return mapDetailLens(data, type);
}

export async function fetchRelatedLenses(
  lensId: string,
  lensType: FilterOption
): Promise<LensItem[]> {
  const params = new URLSearchParams({
    id: lensId,
    lensType: filterToApiType(lensType),
  });

  const response = await fetch(`/api/lenses/related?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load related lenses");
  }

  const data = (await response.json()) as { items: LensesPageResponse["items"] };
  return (data.items ?? []).map(mapApiLens);
}

export async function fetchProductSiblings(
  lensId: string,
  lensType: FilterOption
): Promise<LensItem[]> {
  const params = new URLSearchParams({
    id: lensId,
    lensType: filterToApiType(lensType),
  });

  const response = await fetch(`/api/lenses/siblings?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load product siblings");
  }

  const data = (await response.json()) as { items: LensesPageResponse["items"] };
  return (data.items ?? []).map(mapApiLens);
}
