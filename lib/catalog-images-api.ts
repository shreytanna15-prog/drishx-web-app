export type CatalogImageKey =
  | "singlevision"
  | "progressive"
  | "kryptok"
  | "rx"
  | "color"
  | "white";

export type CatalogImagesResponse = {
  images: Record<CatalogImageKey, string>;
  homeCategories: Record<string, CatalogImageKey>;
  shopCategories: Record<string, CatalogImageKey>;
};

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
