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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CoatingDot } from "@/components/shop/coating-dot";
import { LensProductCard } from "@/components/shop/lens-product-card";
import { StorefrontProductCard } from "@/components/shop/storefront-product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_LENS_SORT,
  fetchLensFacets,
  fetchLensesPage,
  fetchStorefrontFacets,
  fetchStorefrontProducts,
  LENS_SORT_OPTIONS,
  LOAD_MORE_AT_INDEX,
  mapApiLens,
  POWER_SHAPE_OPTIONS,
  type LensSortOption,
  type PowerShapeFilter,
  type StorefrontShopProduct,
} from "@/lib/lenses-api";
import {
  parseShopCategory,
  shopCategoryDisplayTitle,
  shopCategoryToFilter,
} from "@/lib/shop-navigation";
import type { LensItem } from "@/lib/types/lens";
import { cn } from "@/lib/utils";

function filterStorefrontProducts(
  items: StorefrontShopProduct[],
  search: string,
  coating: string
): StorefrontShopProduct[] {
  const q = search.trim().toLowerCase();
  const coatingFilter = coating.trim().toLowerCase();
  return items.filter((row) => {
    if (coatingFilter) {
      const rowCoating = (row.coatingName || row.coating || "").toLowerCase();
      if (rowCoating !== coatingFilter) return false;
    }
    if (!q) return true;
    const haystack = [
      row.name,
      row.summary,
      row.baseCode,
      row.coatingName,
      row.coating,
      row.familyName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function ShopProductsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = parseShopCategory(searchParams.get("category"));
  const selectedItem = searchParams.get("item")?.trim() ?? "";
  const cardId = searchParams.get("cardId")?.trim() ?? "";
  const useStorefront = Boolean(cardId);
  const filter = shopCategoryToFilter(category);
  const categoryTitle = shopCategoryDisplayTitle(category);

  const [lenses, setLenses] = useState<LensItem[]>([]);
  const [storefrontProducts, setStorefrontProducts] = useState<
    StorefrontShopProduct[]
  >([]);
  const [totalCount, setTotalCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<LensSortOption>(DEFAULT_LENS_SORT);
  const [coatings, setCoatings] = useState<string[]>([]);
  const [powerShapes, setPowerShapes] = useState<PowerShapeFilter[]>([]);
  const [selectedCoating, setSelectedCoating] = useState("");
  const [selectedPowerShape, setSelectedPowerShape] =
    useState<PowerShapeFilter | "">("");

  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const [hasMore, setHasMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);
  const debouncedSearchRef = useRef("");
  const sortRef = useRef(sort);
  const coatingRef = useRef(selectedCoating);
  const powerShapeRef = useRef(selectedPowerShape);
  debouncedSearchRef.current = debouncedSearch;
  sortRef.current = sort;
  coatingRef.current = selectedCoating;
  powerShapeRef.current = selectedPowerShape;

  const usePowerFilters =
    !useStorefront && coatings.length === 0 && powerShapes.length > 0;

  const visibleStorefrontProducts = useMemo(
    () =>
      useStorefront
        ? filterStorefrontProducts(
            storefrontProducts,
            debouncedSearch,
            selectedCoating
          )
        : [],
    [useStorefront, storefrontProducts, debouncedSearch, selectedCoating]
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 450);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedCoating("");
    coatingRef.current = "";
    setSelectedPowerShape("");
    powerShapeRef.current = "";
    setCoatings([]);
    setPowerShapes([]);
    if (!selectedItem && !cardId) return;

    let cancelled = false;
    void (async () => {
      try {
        if (cardId) {
          const facets = await fetchStorefrontFacets(cardId);
          if (!cancelled) {
            setCoatings(facets.map((facet) => facet.name));
            setPowerShapes([]);
          }
          return;
        }

        const facets = await fetchLensFacets({
          type: filter,
          item: selectedItem,
        });
        if (!cancelled) {
          setCoatings(facets.coatings);
          setPowerShapes(facets.powerShapes);
        }
      } catch {
        if (!cancelled) {
          setCoatings([]);
          setPowerShapes([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filter, selectedItem, cardId]);

  const loadStorefront = useCallback(async () => {
    if (!cardId) return;
    const currentRequestId = ++requestIdRef.current;
    setError(null);
    setLoadingMore(false);
    hasMoreRef.current = false;
    setHasMore(false);

    try {
      const items = await fetchStorefrontProducts(cardId);
      if (currentRequestId !== requestIdRef.current) return;
      setStorefrontProducts(items);
      setLenses([]);
      setTotalCount(items.length);
    } catch {
      if (currentRequestId !== requestIdRef.current) return;
      setStorefrontProducts([]);
      setLenses([]);
      setTotalCount(0);
      setError("Unable to load products from the backend.");
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setInitialLoading(false);
      }
    }
  }, [cardId]);

  const loadPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      if (!selectedItem || cardId) return;

      if (pageToLoad > 1) {
        if (loadingMoreRef.current || !hasMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }

      const currentRequestId = ++requestIdRef.current;
      setError(null);

      try {
        const powerShape = powerShapeRef.current || undefined;
        const coating = powerShape ? undefined : coatingRef.current || undefined;

        const data = await fetchLensesPage({
          page: pageToLoad,
          type: filter,
          search: debouncedSearchRef.current,
          item: selectedItem,
          coating,
          powerShape,
          sort: sortRef.current,
        });

        if (currentRequestId !== requestIdRef.current) return;

        const mapped = data.items.map(mapApiLens);
        setStorefrontProducts([]);
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
    [filter, selectedItem, cardId]
  );

  useEffect(() => {
    if (!cardId) return;
    setInitialLoading(true);
    void loadStorefront();
  }, [cardId, loadStorefront]);

  useEffect(() => {
    if (cardId) return;
    if (!selectedItem) {
      setInitialLoading(false);
      return;
    }
    pageRef.current = 1;
    hasMoreRef.current = true;
    setHasMore(false);
    setInitialLoading(true);
    void loadPage(1, true);
  }, [
    loadPage,
    selectedItem,
    cardId,
    debouncedSearch,
    sort,
    selectedCoating,
    selectedPowerShape,
  ]);

  useEffect(() => {
    if (useStorefront) return;
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
  }, [loadPage, initialLoading, lenses.length, hasMore, useStorefront]);

  if (!selectedItem && !cardId) {
    router.replace(`/shop?category=${category}`);
    return null;
  }

  const listCount = useStorefront
    ? visibleStorefrontProducts.length
    : totalCount;
  const emptyMessage = selectedPowerShape
    ? "No products found for this power filter."
    : selectedCoating
      ? "No products found for this coating."
      : debouncedSearch
        ? "No products found for this search."
        : useStorefront
          ? "No products match this card yet."
          : "No products found for this item.";

  const chipClass = (active: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors sm:text-sm",
      active
        ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]"
        : "border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
    );

  const isEmpty = useStorefront
    ? visibleStorefrontProducts.length === 0
    : lenses.length === 0;

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
                {selectedItem || "Products"}
              </h1>
              <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
                {initialLoading
                  ? "Loading products…"
                  : `${listCount} product${listCount === 1 ? "" : "s"}`}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:max-w-sm">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--brand-text-muted)]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    useStorefront
                      ? "Search product, coating…"
                      : "Search power, coating, plano…"
                  }
                  className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] pl-10"
                />
              </div>
              {!useStorefront ? (
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
              ) : null}
            </div>
          </div>

          {usePowerFilters ? (
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter by power type"
            >
              <button
                type="button"
                onClick={() => setSelectedPowerShape("")}
                className={chipClass(!selectedPowerShape)}
              >
                All
              </button>
              {POWER_SHAPE_OPTIONS.filter((option) =>
                powerShapes.includes(option.value)
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedPowerShape(option.value)}
                  className={chipClass(selectedPowerShape === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : coatings.length > 0 ? (
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter by coating"
            >
              <button
                type="button"
                onClick={() => setSelectedCoating("")}
                className={chipClass(!selectedCoating)}
              >
                All
              </button>
              {coatings.map((coating) => {
                const active =
                  selectedCoating.toLowerCase() === coating.toLowerCase();
                return (
                  <button
                    key={coating}
                    type="button"
                    onClick={() => setSelectedCoating(coating)}
                    className={chipClass(active)}
                  >
                    <CoatingDot coating={coating} />
                    {coating}
                  </button>
                );
              })}
            </div>
          ) : null}
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
                if (cardId) {
                  void loadStorefront();
                } else {
                  void loadPage(1, true);
                }
              }}
              className="rounded-xl bg-[var(--brand-primary)] font-bold text-[var(--brand-primary-text)]"
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-16 text-center">
            <Package className="size-10 text-[var(--brand-text-muted)]" />
            <p className="text-sm font-medium text-[var(--brand-text-muted)]">
              {emptyMessage}
            </p>
          </div>
        ) : useStorefront ? (
          <div className="space-y-3">
            {visibleStorefrontProducts.map((item) => (
              <StorefrontProductCard key={item.productId} item={item} />
            ))}
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
