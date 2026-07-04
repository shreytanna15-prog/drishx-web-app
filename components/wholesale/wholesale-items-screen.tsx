"use client";

import {
  AlertCircle,
  ArrowLeft,
  Package,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchLensCatalogItems, type LensCatalogItem } from "@/lib/lenses-api";
import {
  catalogCategoryDisplayTitle,
  parseWholesaleCategory,
  wholesaleCategoryToApiType,
} from "@/lib/wholesale-navigation";
import { cn } from "@/lib/utils";

export function WholesaleItemsScreen() {
  const searchParams = useSearchParams();
  const category = useMemo(
    () => parseWholesaleCategory(searchParams.get("category")),
    [searchParams]
  );
  const categoryTitle = catalogCategoryDisplayTitle(category);
  const uppercase = category === "kt" || category === "v2" || category === "sv";

  const [items, setItems] = useState<LensCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLensCatalogItems(
        wholesaleCategoryToApiType(category)
      );
      setItems(data);
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

  return (
    <div className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="relative space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            asChild
            className="size-10 rounded-xl px-0 text-[var(--brand-link)] hover:bg-[var(--brand-primary)]/10"
          >
            <Link href="/wholesale" aria-label="Back to wholesale categories">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-3xl">
              {categoryTitle}
            </h1>
            <p className="text-sm text-[var(--brand-text-muted)]">
              Select an item
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-16 text-center">
            <AlertCircle className="size-10 text-[var(--brand-danger)]" />
            <p className="text-sm font-medium text-[var(--brand-text-muted)]">
              {error}
            </p>
            <Button
              onClick={() => void loadItems()}
              className="rounded-xl bg-[var(--brand-primary)] font-bold"
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-16 text-center">
            <Package className="size-10 text-[var(--brand-text-muted)]" />
            <p className="text-sm font-medium text-[var(--brand-text-muted)]">
              No items found for this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const disabled = item.productCount < 1;
              const href = `/wholesale/products?category=${category}&item=${encodeURIComponent(item.name)}`;

              return (
                <Link
                  key={item.name}
                  href={disabled ? "#" : href}
                  aria-disabled={disabled}
                  onClick={disabled ? (e) => e.preventDefault() : undefined}
                  className={cn(
                    disabled && "pointer-events-none opacity-50"
                  )}
                >
                  <Card className="h-full rounded-2xl border-[var(--brand-card-border)] bg-[var(--brand-card)] py-0 shadow-none transition-all hover:border-[var(--brand-primary)]/45 hover:shadow-[0_8px_24px_-10px_rgba(240,161,50,0.35)]">
                    <CardContent className="flex min-h-[7.5rem] flex-col items-center justify-center p-5 text-center">
                      <h3
                        className={cn(
                          "text-base font-extrabold text-[var(--brand-text)]",
                          uppercase && "uppercase tracking-wide"
                        )}
                      >
                        {item.name}
                      </h3>
                      <p className="mt-2 text-sm font-medium text-[var(--brand-text-muted)]">
                        {disabled
                          ? "No products yet"
                          : `${item.productCount} product${item.productCount === 1 ? "" : "s"}`}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
