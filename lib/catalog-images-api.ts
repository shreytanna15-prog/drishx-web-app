export type CatalogImageKey =
  | "singlevision"
  | "progressive"
  | "kryptok"
  | "rx"
  | "color"
  | "white";

export type ShopLensImageKey = "singlevision" | "progressive" | "kryptok";

export type CatalogImagesResponse = {
  images: Record<CatalogImageKey, string>;
  homeCategories: Record<string, CatalogImageKey>;
  shopCategories: Record<string, CatalogImageKey>;
};

const SHOP_CATEGORY_KEYS: Record<string, CatalogImageKey> = {
  sv: "singlevision",
  kt: "kryptok",
  v2: "progressive",
};

const SHOP_LENS_KEYS = new Set<ShopLensImageKey>([
  "singlevision",
  "progressive",
  "kryptok",
]);

function isShopLensImageKey(key: CatalogImageKey): key is ShopLensImageKey {
  return SHOP_LENS_KEYS.has(key as ShopLensImageKey);
}

/** Local transparent lens art under /public/images/catalog/ */
export function localShopLensImageUrl(key: ShopLensImageKey): string {
  return `/images/catalog/${key}.png`;
}

let cached: CatalogImagesResponse | null = null;
let inflight: Promise<CatalogImagesResponse> | null = null;

export async function fetchCatalogImages(): Promise<CatalogImagesResponse> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    const response = await fetch("/api/catalog-images", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load catalog images");
    }
    const data = (await response.json()) as CatalogImagesResponse;
    cached = data;
    return data;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function catalogImageForHomeCategory(
  data: CatalogImagesResponse | null,
  categoryId: string
): string | null {
  if (!data) return null;
  const key = data.homeCategories[categoryId];
  return key ? data.images[key] ?? null : null;
}

export function catalogImageForShopCategory(
  data: CatalogImagesResponse | null,
  categoryId: string
): string | null {
  if (!data) return null;
  const key = data.shopCategories[categoryId];
  return key ? data.images[key] ?? null : null;
}

/**
 * Source for shop/wholesale category cards.
 * Prefers local transparent PNGs over API remotes (dark-baked vignette).
 */
export function catalogImageUrlForShopCategory(
  data: CatalogImagesResponse | null,
  categoryId: string
): string | null {
  const key = data?.shopCategories[categoryId] ?? SHOP_CATEGORY_KEYS[categoryId];
  if (!key) return null;
  if (isShopLensImageKey(key)) {
    return localShopLensImageUrl(key);
  }
  return catalogImageForShopCategory(data, categoryId);
}
