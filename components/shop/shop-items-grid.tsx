"use client";

import { AlertCircle, Package, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ShopItemCard } from "@/components/shop/shop-cards";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  catalogImageForShopCategory,
  fetchCatalogImages,
  type CatalogImagesResponse,
} from "@/lib/catalog-images-api";
import { fetchLensCatalogItems, type LensCatalogItem } from "@/lib/lenses-api";
import {
  shopCategoryDisplayTitle,
  shopCategoryToApiType,
  type ShopCategoryId,
} from "@/lib/shop-navigation";
import { cn } from "@/lib/utils";

type ShopItemsGridProps = {
  category: ShopCategoryId;
  uppercase?: boolean;
};

export function ShopItemsGrid({ category, uppercase }: ShopItemsGridProps) {
  const [items, setItems] = useState<LensCatalogItem[]>([]);
  const [catalogImages, setCatalogImages] =
    useState<CatalogImagesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, images] = await Promise.all([
        fetchLensCatalogItems(shopCategoryToApiType(category)),
        fetchCatalogImages().catch(() => null),
      ]);
      setItems(data);
      setCatalogImages(images);
    } catch {
      setItems([]);
      setError("Unable to load items from the backend.");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const categoryImage = catalogImageForShopCategory(catalogImages, category);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-16 text-center">
        <AlertCircle className="size-10 text-[var(--brand-danger)]" />
        <p className="text-sm font-medium text-[var(--brand-text-muted)]">
          {error}
        </p>
        <Button
          onClick={() => void loadItems()}
          className="rounded-xl bg-[var(--brand-primary)] font-bold text-[var(--brand-primary-text)] hover:bg-[var(--brand-primary-hover)]"
        >
          <RefreshCw className="size-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-16 text-center">
        <Package className="size-10 text-[var(--brand-text-muted)]" />
        <p className="text-sm font-medium text-[var(--brand-text-muted)]">
          No items found for {shopCategoryDisplayTitle(category)}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-[var(--brand-text-muted)]">
        Select an item
      </p>
      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        )}
      >
        {items.map((item) => (
          <ShopItemCard
            key={item.name}
            item={item}
            category={category}
            uppercase={uppercase}
            imageUrl={categoryImage}
          />
        ))}
      </div>
    </div>
  );
}
