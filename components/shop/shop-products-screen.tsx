"use client";

import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Package,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LensProductCard } from "@/components/shop/lens-product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_LENS_SORT,
  fetchLensesPage,
  LENS_SORT_OPTIONS,
  LOAD_MORE_AT_INDEX,
  mapApiLens,
  type LensSortOption,
} from "@/lib/lenses-api";
import {
  parseShopCategory,
  shopCategoryDisplayTitle,
  shopCategoryToFilter,
} from "@/lib/shop-navigation";
import type { LensItem } from "@/lib/types/lens";

export function ShopProductsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = parseShopCategory(searchParams.get("category"));
  const selectedItem = searchParams.get("item")?.trim() ?? "";
  const filter = shopCategoryToFilter(category);
  const categoryTitle = shopCategoryDisplayTitle(category);

  const [lenses, setLenses] = useState<LensItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<LensSortOption>(DEFAULT_LENS_SORT);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const [hasMore, setHasMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);
  const debouncedSearchRef = useRef("");
  const sortRef = useRef(sort);
  debouncedSearchRef.current = debouncedSearch;
  sortRef.current = sort;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 450);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      if (!selectedItem) return;

      if (pageToLoad > 1) {
        if (loadingMoreRef.current || !hasMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }

      const currentRequestId = ++requestIdRef.current;
      setError(null);

      try {
        const data = await fetchLensesPage({
          page: pageToLoad,
          type: filter,
          search: debouncedSearchRef.current,
          item: selectedItem,
          sort: sortRef.current,
        });

        if (currentRequestId !== requestIdRef.current) return;

        const mapped = data.items.map(mapApiLens);
        setLenses((current) => (replace ? mapped : [...current, ...mapped]));
        setTotalCount(data.total);
        pageRef.current = data.page;
        hasMoreRef.current = data.hasMore;
        setHasMore(data.hasMore);
      } catch {
        if (currentRequestId !== requestIdRef.current) return;
        if (pageToLoad === 1) {
          setLenses([]);
          setTotalCount(0);
        }
        setError("Unable to load products from the backend.");
      } finally {
        if (currentRequestId === requestIdRef.current) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
          setInitialLoading(false);
        }
      }
    },
    [filter, selectedItem]
  );

  useEffect(() => {
    if (!selectedItem) {
      setInitialLoading(false);
      return;
    }
    pageRef.current = 1;
    hasMoreRef.current = true;
    setHasMore(false);
    setInitialLoading(true);
    void loadPage(1, true);
  }, [loadPage, selectedItem, debouncedSearch, sort]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMoreRef.current &&
          !loadingMoreRef.current &&
          !initialLoading
        ) {
          void loadPage(pageRef.current + 1, false);
        }
      },
      { rootMargin: "200px" }
    );

    const sentinel = document.getElementById("shop-products-sentinel");
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadPage, initialLoading, lenses.length, hasMore]);

  if (!selectedItem) {
    router.replace(`/shop?category=${category}`);
    return null;
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="relative space-y-6">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            asChild
            className="w-fit rounded-xl px-0 font-semibold text-[var(--brand-link)] hover:bg-[var(--brand-primary)]/10"
          >
            <Link href={`/shop?category=${category}`}>
              <ArrowLeft className="size-4" />
              Back to {categoryTitle}
            </Link>
          </Button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-link)]">
                {categoryTitle}
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-3xl">
                {selectedItem}
              </h1>
              <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
                {initialLoading
                  ? "Loading products…"
                  : `${totalCount} product${totalCount === 1 ? "" : "s"}`}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:max-w-sm">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--brand-text-muted)]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search power, coating, plano…"
                  className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] pl-10"
                />
              </div>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as LensSortOption)}
                  aria-label="Sort products"
                  className="h-11 w-full appearance-none rounded-xl border border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] px-3 pr-10 text-sm font-semibold text-[var(--brand-text)] outline-none"
                >
                  {LENS_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[var(--brand-text-muted)]" />
              </div>
            </div>
          </div>
        </div>

        {initialLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-16 text-center">
            <AlertCircle className="size-10 text-[var(--brand-danger)]" />
            <p className="text-sm font-medium text-[var(--brand-text-muted)]">
              {error}
            </p>
            <Button
              onClick={() => {
                setInitialLoading(true);
                void loadPage(1, true);
              }}
              className="rounded-xl bg-[var(--brand-primary)] font-bold text-[var(--brand-primary-text)]"
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </div>
        ) : lenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-16 text-center">
            <Package className="size-10 text-[var(--brand-text-muted)]" />
            <p className="text-sm font-medium text-[var(--brand-text-muted)]">
              No products found for this item.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lenses.map((item, index) => (
              <LensProductCard
                key={`${item.id}-${index}`}
                item={item}
                href={`/shop/products/${item.id}?category=${category}&item=${encodeURIComponent(selectedItem)}`}
              />
            ))}
            {loadingMore && (
              <div className="space-y-3 pt-2">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>
            )}
            {hasMore && lenses.length >= LOAD_MORE_AT_INDEX && (
              <div id="shop-products-sentinel" className="h-4" />
            )}
            {hasMore && !loadingMore && lenses.length > 0 && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => void loadPage(pageRef.current + 1, false)}
                  className="rounded-xl border-[var(--brand-input-border)] font-semibold"
                >
                  Load more products
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
