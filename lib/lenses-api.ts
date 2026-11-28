import { resolveCrossPowerMeta } from "@/lib/cross-power";
import {
  DEFAULT_LENS_SORT,
  isCustomLensSort,
  paginateItems,
  sortApiLenses,
  type LensSortOption,
} from "@/lib/lens-sort";
import type { FilterOption, LensItem, LensType, SelectableRange } from "@/lib/types/lens";

export const PAGE_SIZE = 21;
export const LOAD_MORE_AT_INDEX = 14;

export {
  DEFAULT_LENS_SORT,
  isCustomLensSort,
  LENS_SORT_OPTIONS,
  type LensSortOption,
} from "@/lib/lens-sort";

export type PowerMatchMode = "exact" | "nearest" | "range";

export type PowerMatchMeta = {
  mode: PowerMatchMode;
  querySph: number;
  queryCyl: number | null;
};

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
    imageUrl?: string | null;
  }>;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  powerMatch?: PowerMatchMeta | null;
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
  const lensType = toDisplayLensType(item.lensType);
  const sph =
    item.sph !== null && item.sph !== undefined ? Number(item.sph) : null;
  const cyl = item.cyl !== null ? Number(item.cyl) : null;
  const explicitCrossPower =
    item.crossPower !== null && item.crossPower !== undefined
      ? Number(item.crossPower)
      : null;
  const selectableRange = item.selectableRange ?? null;
  const normalizedCrossPower =
    resolveCrossPowerMeta({
      crossPower: explicitCrossPower,
      sph,
      cyl,
      cylStartRange:
        item.cylStartRange !== null && item.cylStartRange !== undefined
          ? Number(item.cylStartRange)
          : null,
      selectableRange,
    })?.maxCyl ?? null;

  return {
    id: item.id,
    costPrice: item.costPrice !== null ? Number(item.costPrice) : null,
    price: Number(item.price),
    sph,
    sphStartRange:
      item.sphStartRange !== null && item.sphStartRange !== undefined
        ? Number(item.sphStartRange)
        : null,
    cyl,
    cylStartRange:
      item.cylStartRange !== null && item.cylStartRange !== undefined
        ? Number(item.cylStartRange)
        : null,
    crossPower: normalizedCrossPower,
    axis: item.axis,
    add: item.add !== null ? Number(item.add) : null,
    eye: item.eye ?? undefined,
    quantity: item.quantity,
    createdAt: item.createdAt,
    lensType,
    brand: item.brand,
    item: item.item,
    coating: item.coating,
    index: item.index ?? null,
    selectableRange,
    imageUrl: item.imageUrl ?? null,
  };
}

export type LensCatalogItem = {
  name: string;
  productCount: number;
  /** Storefront card id when loaded from /api/storefront/cards */
  id?: string;
};

export type StorefrontShopProduct = {
  id: string;
  productId: string;
  name: string;
  summary: string;
  baseCode: string;
  coating: string | null;
  coatingName: string | null;
  variantCount: number;
  familyCode: string;
  familyName: string;
  source: "matched" | "pinned" | "excluded";
};

export type StorefrontCoatingFacet = {
  coatingId: string;
  coatingCode: string;
  name: string;
  productCount: number;
};

function mapStorefrontCardItems(
  items: Array<{
    id?: string;
    name?: string;
    productCount?: number;
  }>
): LensCatalogItem[] {
  return items.flatMap((row) => {
    const name = row.name?.trim();
    if (!name) return [];
    return [
      {
        id: row.id,
        name,
        productCount: Number(row.productCount) || 0,
      },
    ];
  });
}

/**
 * Prefer Storefront Catalog cards.
 * If storefront responds OK, trust it even when empty (inactive cards must stay hidden).
 * Fall back to legacy only when storefront is unreachable / non-OK.
 */
export async function fetchLensCatalogItems(
  type: string
): Promise<LensCatalogItem[]> {
  const storefrontParams = new URLSearchParams({ family: type });
  try {
    const storefrontRes = await fetch(
      `/api/storefront/cards?${storefrontParams.toString()}`,
      { cache: "no-store" }
    );
    if (storefrontRes.ok) {
      const data = (await storefrontRes.json()) as {
        items?: Array<{ id?: string; name?: string; productCount?: number }>;
      };
      return mapStorefrontCardItems(data.items ?? []);
    }
  } catch {
    // fall through to legacy
  }

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

/** Visible parents under a storefront card (same membership resolver as admin). */
export async function fetchStorefrontProducts(
  cardId: string
): Promise<StorefrontShopProduct[]> {
  const trimmed = cardId.trim();
  if (!trimmed) return [];
  const response = await fetch(
    `/api/storefront/products?${new URLSearchParams({ cardId: trimmed }).toString()}`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (response.status === 404) {
      throw new Error(body.error || "This card is unavailable or inactive.");
    }
    throw new Error(body.error || "Failed to load storefront products");
  }
  const data = (await response.json()) as { items?: StorefrontShopProduct[] };
  return data.items ?? [];
}

/** Derived coating facets for products visible on a storefront card. */
export async function fetchStorefrontFacets(
  cardId: string
): Promise<StorefrontCoatingFacet[]> {
  const trimmed = cardId.trim();
  if (!trimmed) return [];
  const response = await fetch(
    `/api/storefront/facets?${new URLSearchParams({ cardId: trimmed }).toString()}`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error("Failed to load storefront facets");
  }
  const data = (await response.json()) as { facets?: StorefrontCoatingFacet[] };
  return data.facets ?? [];
}

/** Distinct coating labels for a catalog subcategory (type + item). */
export type PowerShapeFilter = "sph" | "cyl" | "compound";

export const POWER_SHAPE_OPTIONS: {
  value: PowerShapeFilter;
  label: string;
}[] = [
  { value: "sph", label: "SPH" },
  { value: "cyl", label: "CYL" },
  { value: "compound", label: "Compound" },
];

export type LensFacetsResponse = {
  coatings: string[];
  powerShapes: PowerShapeFilter[];
};

/** Coatings (color) and power-shape facets for a catalog subcategory. */
export async function fetchLensFacets({
  type,
  item,
}: {
  type: FilterOption;
  item?: string;
}): Promise<LensFacetsResponse> {
  const params = new URLSearchParams({
    type: filterToApiType(type),
  });
  const trimmedItem = item?.trim();
  if (trimmedItem) {
    params.set("item", trimmedItem);
  }

  const response = await fetch(`/api/lenses/coatings?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load lens coatings");
  }
  const data = (await response.json()) as {
    coatings?: string[];
    powerShapes?: PowerShapeFilter[];
  };
  return {
    coatings: data.coatings ?? [],
    powerShapes: data.powerShapes ?? [],
  };
}

/** @deprecated Prefer fetchLensFacets */
export async function fetchLensCoatings({
  type,
  item,
}: {
  type: FilterOption;
  item?: string;
}): Promise<string[]> {
  const facets = await fetchLensFacets({ type, item });
  return facets.coatings;
}

async function fetchAllLensesPages({
  type,
  search,
  item,
  coating,
  powerShape,
}: {
  type: FilterOption;
  search?: string;
  item?: string;
  coating?: string;
  powerShape?: PowerShapeFilter;
}): Promise<{
  items: LensesPageResponse["items"];
  powerMatch?: PowerMatchMeta | null;
}> {
  const collected: LensesPageResponse["items"] = [];
  let page = 1;
  let hasMore = true;
  let powerMatch: PowerMatchMeta | null | undefined;

  while (hasMore) {
    const data = await fetchLensesPageRaw({
      page,
      limit: 50,
      type,
      search,
      item,
      coating,
      powerShape,
    });
    if (page === 1) {
      powerMatch = data.powerMatch;
    }
    collected.push(...data.items);
    hasMore = data.hasMore;
    if (!hasMore) break;
    page += 1;
  }

  return { items: collected, powerMatch };
}

export async function fetchLensesPage({
  page,
  limit = PAGE_SIZE,
  type,
  search,
  item,
  coating,
  powerShape,
  sort = DEFAULT_LENS_SORT,
}: {
  page: number;
  limit?: number;
  type: FilterOption;
  search: string;
  item?: string;
  coating?: string;
  powerShape?: PowerShapeFilter;
  sort?: LensSortOption;
}): Promise<LensesPageResponse> {
  const trimmedSearch = search.trim();
  const planoSearch = isPlanoSearchQuery(trimmedSearch);

  if (planoSearch) {
    return fetchPlanoLensesPage({
      page,
      limit,
      type,
      item,
      coating,
      powerShape,
      sort,
    });
  }

  if (isCustomLensSort(sort)) {
    const allItems = await fetchAllLensesPages({
      type,
      search: trimmedSearch,
      item,
      coating,
      powerShape,
    });
    const sorted = sortApiLenses(allItems.items, sort);
    return {
      ...paginateItems(sorted, page, limit),
      powerMatch: allItems.powerMatch,
    };
  }

  return fetchLensesPageRaw({
    page,
    limit,
    type,
    search: trimmedSearch,
    item,
    coating,
    powerShape,
  });
}

/** True when the user is searching for plano (no SPH/CYL) products. */
export function isPlanoSearchQuery(search: string): boolean {
  return search.trim().toLowerCase() === "plano";
}

function hasMeaningfulPowerValue(value: number | null | undefined): boolean {
  return value !== null && value !== undefined && Math.abs(Number(value)) > 1e-9;
}

function isPlanoApiLens(
  item: LensesPageResponse["items"][number]
): boolean {
  return (
    !hasMeaningfulPowerValue(item.sph) &&
    !hasMeaningfulPowerValue(item.cyl) &&
    !hasMeaningfulPowerValue(item.crossPower)
  );
}

async function fetchLensesPageRaw({
  page,
  limit,
  type,
  search,
  item,
  coating,
  powerShape,
}: {
  page: number;
  limit: number;
  type: FilterOption;
  search?: string;
  item?: string;
  coating?: string;
  powerShape?: PowerShapeFilter;
}): Promise<LensesPageResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    type: filterToApiType(type),
  });

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    params.set("search", trimmedSearch);
  }

  const trimmedItem = item?.trim();
  if (trimmedItem) {
    params.set("item", trimmedItem);
  }

  const trimmedCoating = coating?.trim();
  if (trimmedCoating) {
    params.set("coating", trimmedCoating);
  }

  if (powerShape) {
    params.set("powerShape", powerShape);
  }

  const response = await fetch(`/api/lenses?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load lenses");
  }

  return response.json() as Promise<LensesPageResponse>;
}

/** Frontend-only: load pages until enough plano products are collected. */
async function fetchPlanoLensesPage({
  page,
  limit,
  type,
  item,
  coating,
  powerShape,
  sort = DEFAULT_LENS_SORT,
}: {
  page: number;
  limit: number;
  type: FilterOption;
  item?: string;
  coating?: string;
  powerShape?: PowerShapeFilter;
  sort?: LensSortOption;
}): Promise<LensesPageResponse> {
  if (isCustomLensSort(sort)) {
    const allItems = await fetchAllLensesPages({
      type,
      item,
      coating,
      powerShape,
    });
    const planoItems = sortApiLenses(allItems.items.filter(isPlanoApiLens), sort);
    return paginateItems(planoItems, page, limit);
  }

  const collected: LensesPageResponse["items"] = [];
  let apiPage = page;
  let hasMore = true;
  let total = 0;
  let lastLimit = limit;

  while (collected.length < limit && hasMore) {
    const data = await fetchLensesPageRaw({
      page: apiPage,
      limit,
      type,
      item,
      coating,
      powerShape,
    });
    total = data.total;
    lastLimit = data.limit;
    hasMore = data.hasMore;
    collected.push(...data.items.filter(isPlanoApiLens));
    if (!data.hasMore) {
      break;
    }
    if (collected.length < limit) {
      apiPage += 1;
    } else {
      break;
    }
  }

  return {
    items: collected.slice(0, limit),
    total,
    page: apiPage,
    limit: lastLimit,
    hasMore: hasMore || collected.length > limit,
  };
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
  imageUrl?: string | null;
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
    imageUrl: data.imageUrl ?? null,
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
