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
import { useSearchParams } from "next/navigation";
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
  type PowerMatchMeta,
} from "@/lib/lenses-api";
import {
  lensTypeToShopCategory,
  shopCategoryToFilter,
  type ShopCategoryId,
} from "@/lib/shop-navigation";
import type { FilterOption, LensItem } from "@/lib/types/lens";
import { cn } from "@/lib/utils";

const TYPE_FILTERS: { key: "all" | ShopCategoryId; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sv", label: "Single Vision" },
  { key: "kt", label: "Kryptok" },
  { key: "v2", label: "Progressive" },
];

const CATEGORY_SHORTCUTS: Record<string, ShopCategoryId> = {
  sv: "sv",
  kt: "kt",
  v2: "v2",
  prog: "v2",
  progressive: "v2",
  kryptok: "kt",
  "single-vision": "sv",
  singlevision: "sv",
};

function typeFilterToOption(key: "all" | ShopCategoryId): FilterOption {
  if (key === "all") return "All";
  return shopCategoryToFilter(key);
}

function productHref(item: LensItem): string {
  const category = lensTypeToShopCategory(item.lensType);
  const catalogItem = item.item?.trim() ?? "";
  const params = new URLSearchParams({ category });
  if (catalogItem) params.set("item", catalogItem);
  return `/shop/products/${item.id}?${params.toString()}`;
}

function formatDiopter(value: number): string {
  if (Math.abs(value) < 1e-9) return "0";
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatPowerMatchLabel(match: PowerMatchMeta): string {
  const sph = formatDiopter(match.querySph);
  const cyl =
    match.queryCyl === null || match.queryCyl === undefined
      ? "—"
      : formatDiopter(match.queryCyl);
  return `${sph}/${cyl}`;
}

function powerMatchHint(match: PowerMatchMeta): string | null {
  if (match.mode === "exact") return null;
  const label = formatPowerMatchLabel(match);
  if (match.mode === "range") {
    return `No exact ${label} endpoint — showing products whose power range covers it.`;
  }
  return `No exact ${label} — showing closest available powers.`;
}

function syncTypeChipFromQuery(query: string): "all" | ShopCategoryId | null {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, "");
  return CATEGORY_SHORTCUTS[normalized] ?? null;
}

export function CatalogSearchScreen() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q")?.trim() ?? "";

  const [typeFilter, setTypeFilter] = useState<"all" | ShopCategoryId>("all");
  const [lenses, setLenses] = useState<LensItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [powerMatch, setPowerMatch] = useState<PowerMatchMeta | null>(null);
  const [initialLoading, setInitialLoading] = useState(Boolean(urlQuery));
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(urlQuery);
  const [sort, setSort] = useState<LensSortOption>(DEFAULT_LENS_SORT);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const [hasMore, setHasMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);
  const debouncedSearchRef = useRef(urlQuery);
  const sortRef = useRef(sort);
  const typeRef = useRef(typeFilter);
  debouncedSearchRef.current = debouncedSearch;
  sortRef.current = sort;
  typeRef.current = typeFilter;

  useEffect(() => {
    setSearchQuery(urlQuery);
    setDebouncedSearch(urlQuery);
    const synced = syncTypeChipFromQuery(urlQuery);
    if (synced) {
      setTypeFilter(synced);
    }
  }, [urlQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 450);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const synced = syncTypeChipFromQuery(debouncedSearch);
    if (!synced) return;
    setTypeFilter((current) => (current === "all" ? synced : current));
  }, [debouncedSearch]);

  const loadPage = useCallback(async (pageToLoad: number, replace: boolean) => {
    const q = debouncedSearchRef.current.trim();
    if (!q) {
      setLenses([]);
      setTotalCount(0);
      setPowerMatch(null);
      setHasMore(false);
      hasMoreRef.current = false;
      setInitialLoading(false);
      setError(null);
      return;
    }

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
        type: typeFilterToOption(typeRef.current),
        search: q,
        sort: sortRef.current,
      });

      if (currentRequestId !== requestIdRef.current) return;

      const mapped = data.items.map(mapApiLens);
      setLenses((current) => (replace ? mapped : [...current, ...mapped]));
      setTotalCount(data.total);
      if (replace) {
        setPowerMatch(data.powerMatch ?? null);
      }
      pageRef.current = data.page;
      hasMoreRef.current = data.hasMore;
      setHasMore(data.hasMore);
    } catch {
      if (currentRequestId !== requestIdRef.current) return;
      if (pageToLoad === 1) {
        setLenses([]);
        setTotalCount(0);
        setPowerMatch(null);
      }
      setError("Unable to load search results.");
    } finally {
      if (currentRequestId === requestIdRef.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
        setInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    pageRef.current = 1;
    hasMoreRef.current = true;
    setHasMore(false);
    setInitialLoading(Boolean(debouncedSearch.trim()));
    void loadPage(1, true);
  }, [loadPage, debouncedSearch, sort, typeFilter]);

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

    const sentinel = document.getElementById("catalog-search-sentinel");
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadPage, initialLoading, lenses.length, hasMore]);

  const hasQuery = debouncedSearch.trim().length > 0;
  const matchHint = powerMatch ? powerMatchHint(powerMatch) : null;

  return (
    <div className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="relative space-y-6">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            asChild
            className="w-fit rounded-xl px-0 font-semibold text-[var(--brand-link)] hover:bg-[var(--brand-primary)]/10"
          >
            <Link href="/shop">
              <ArrowLeft className="size-4" />
              Back to Shop
            </Link>
          </Button>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-3xl">
              Search catalog
            </h1>
            <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
              Search across Single Vision, Kryptok, and Progressive products
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:max-w-xl">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--brand-text-muted)]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="sv, kt, v2, coating, brand, or -0.25/-0.25…"
                className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] pl-10"
                autoFocus
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

          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((filter) => {
              const active = typeFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setTypeFilter(filter.key)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-bold transition-colors sm:text-sm",
                    active
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]"
                      : "border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {!hasQuery ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-16 text-center">
            <Package className="size-10 text-[var(--brand-text-muted)]" />
            <p className="text-sm font-medium text-[var(--brand-text-muted)]">
              Try shortcuts like sv, kt, or v2; coating or item names; or power as
              SPH/CYL (e.g. -0.25/-0.25).
            </p>
          </div>
        ) : initialLoading ? (
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
              No products found for &quot;{debouncedSearch}&quot;.
            </p>
            <p className="max-w-md text-xs font-medium text-[var(--brand-text-muted)]">
              Shortcuts: sv (Single Vision), kt (Kryptok), v2 (Progressive). Power
              search uses SPH/CYL like -1.00/-0.50.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--brand-text-muted)]">
                {totalCount} result{totalCount === 1 ? "" : "s"} for &quot;
                {debouncedSearch}&quot;
              </p>
              {matchHint ? (
                <p className="text-xs font-medium text-[var(--brand-primary)]">
                  {matchHint}
                </p>
              ) : null}
            </div>
            {lenses.map((item, index) => (
              <LensProductCard
                key={`${item.id}-${index}`}
                item={item}
                href={productHref(item)}
              />
            ))}
            {loadingMore && (
              <div className="space-y-3 pt-2">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>
            )}
            {hasMore && lenses.length >= LOAD_MORE_AT_INDEX && (
              <div id="catalog-search-sentinel" className="h-4" />
            )}
            {hasMore && !loadingMore && lenses.length > 0 && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => void loadPage(pageRef.current + 1, false)}
                  className="rounded-xl border-[var(--brand-input-border)] font-semibold"
                >
                  Load more results
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
