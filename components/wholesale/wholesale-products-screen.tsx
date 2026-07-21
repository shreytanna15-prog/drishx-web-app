"use client";

import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { LensItem } from "@/lib/types/lens";
import {
  parseWholesaleCategory,
  wholesaleCategoryTitle,
  wholesaleCategoryToFilter,
} from "@/lib/wholesale-navigation";

export function WholesaleProductsScreen() {
  const searchParams = useSearchParams();
  const category = useMemo(
    () => parseWholesaleCategory(searchParams.get("category")),
    [searchParams]
  );
  const selectedItem = searchParams.get("item")?.trim() ?? "";
  const filter = wholesaleCategoryToFilter(category);

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
    pageRef.current = 1;
    hasMoreRef.current = false;
    setInitialLoading(true);
    void loadPage(1, true);
  }, [loadPage, debouncedSearch, selectedItem, sort]);

  const loadNextPage = useCallback(() => {
    void loadPage(pageRef.current + 1, false);
  }, [loadPage]);

  useEffect(() => {
    if (initialLoading || loadingMore || !hasMoreRef.current) return;
    if (lenses.length >= LOAD_MORE_AT_INDEX) return;
    void loadPage(pageRef.current + 1, false);
  }, [initialLoading, lenses.length, loadPage, loadingMore]);

  const title =
    selectedItem || `${wholesaleCategoryTitle(category)} • Wholesale`;

  function buildOrderHref(item: LensItem) {
    return `/wholesale/order?payload=${encodeURIComponent(JSON.stringify(item))}`;
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="relative space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            asChild
            className="size-10 rounded-xl px-0 text-[var(--brand-link)] hover:bg-[var(--brand-primary)]/10"
          >
            <Link
              href={`/wholesale/items?category=${category}`}
              aria-label="Back to items"
            >
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-3xl">
              {title}
            </h1>
            <p className="text-sm text-[var(--brand-text-muted)]">
              Select a product for bulk ordering
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--brand-text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search power, coating, plano…"
              className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-card)] pl-10"
            />
          </div>
          <div className="relative sm:w-64">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as LensSortOption)}
              aria-label="Sort products"
              className="h-11 w-full appearance-none rounded-xl border border-[var(--brand-input-border)] bg-[var(--brand-card)] px-3 pr-10 text-sm font-semibold text-[var(--brand-text)] outline-none"
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

        {initialLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-16 text-center">
            <AlertCircle className="size-10 text-[var(--brand-danger)]" />
            <p className="text-sm font-medium text-[var(--brand-text-muted)]">
              {error}
            </p>
            <Button
              onClick={() => {
                setInitialLoading(true);
                void loadPage(1, true);
              }}
              className="rounded-xl bg-[var(--brand-primary)] font-bold"
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-[var(--brand-text-muted)]">
              {totalCount} product{totalCount === 1 ? "" : "s"}
            </p>
            <div className="space-y-3">
              {lenses.map((item) => (
                <LensProductCard
                  key={item.id}
                  item={item}
                  href={buildOrderHref(item)}
                />
              ))}
            </div>
            {lenses.length === 0 ? (
              <p className="py-12 text-center text-sm text-[var(--brand-text-muted)]">
                No products found.
              </p>
            ) : null}
            {hasMoreRef.current ? (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  disabled={loadingMore}
                  onClick={loadNextPage}
                  className="rounded-xl border-[var(--brand-input-border)] font-semibold"
                >
                  {loadingMore ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Load more
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
