"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ShopCategoryCard } from "@/components/shop/shop-cards";
import { Button } from "@/components/ui/button";
import { useOrderMode } from "@/contexts/order-mode-context";
import {
  catalogImageUrlForShopCategory,
  fetchCatalogImages,
  type CatalogImagesResponse,
} from "@/lib/catalog-images-api";
import { fetchLensCatalogItems } from "@/lib/lenses-api";
import {
  LENS_CATALOG_CATEGORIES,
  wholesaleCategoryToApiType,
  type WholesaleCategoryId,
} from "@/lib/wholesale-navigation";

export function WholesaleCategoryScreen() {
  const { setMode } = useOrderMode();
  const [catalogImages, setCatalogImages] =
    useState<CatalogImagesResponse | null>(null);
  const [productCounts, setProductCounts] = useState<
    Partial<Record<WholesaleCategoryId, number>>
  >({});

  useEffect(() => {
    setMode("wholesale");
  }, [setMode]);

  useEffect(() => {
    let cancelled = false;
    void fetchCatalogImages()
      .then((data) => {
        if (!cancelled) setCatalogImages(data);
      })
      .catch(() => {
        if (!cancelled) setCatalogImages(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      LENS_CATALOG_CATEGORIES.map(async (cat) => {
        try {
          const items = await fetchLensCatalogItems(
            wholesaleCategoryToApiType(cat.id)
          );
          const total = items.reduce(
            (sum, item) => sum + (item.productCount ?? 0),
            0
          );
          return [cat.id, total] as const;
        } catch {
          return [cat.id, null] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      const next: Partial<Record<WholesaleCategoryId, number>> = {};
      for (const [id, total] of entries) {
        if (typeof total === "number") next[id] = total;
      }
      setProductCounts(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(100%,36rem)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            asChild
            className="size-10 rounded-xl px-0 text-[var(--brand-link)] hover:bg-[var(--brand-primary)]/10"
          >
            <Link href="/home" aria-label="Back to home">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-3xl">
              Wholesale Order
            </h1>
            <p className="text-sm text-[var(--brand-text-muted)]">
              Select a category to begin bulk ordering
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--brand-text)]">
              Categories
            </h2>
            <div className="mt-1 h-0.5 w-9 rounded-full bg-[var(--brand-primary)]" />
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-0.5 text-sm font-bold text-[var(--brand-primary)]"
          >
            View all
            <span aria-hidden>›</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LENS_CATALOG_CATEGORIES.map((cat) => {
            const imageUrl = catalogImageUrlForShopCategory(
              catalogImages,
              cat.id
            );
            return (
              <Link key={cat.id} href={`/wholesale/items?category=${cat.id}`}>
                <ShopCategoryCard
                  id={cat.id}
                  title={cat.title}
                  subtitle={cat.subtitle}
                  imageUrl={imageUrl}
                  productCount={productCounts[cat.id] ?? null}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
