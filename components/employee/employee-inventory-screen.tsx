"use client";

import {
  CloudOff,
  Loader2,
  Package2,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { InventoryProductCard } from "@/components/employee/inventory-product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchLensesPage,
  mapApiLens,
} from "@/lib/lenses-api";
import type { FilterOption, LensItem } from "@/lib/types/lens";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS: FilterOption[] = [
  "All",
  "Kryptok",
  "Progressive",
  "Single Vision",
];
const SEARCH_DEBOUNCE_MS = 500;

export function EmployeeInventoryScreen() {
  const [lenses, setLenses] = useState<LensItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);
  const activeFilterRef = useRef(activeFilter);
  const debouncedSearchRef = useRef(debouncedSearch);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  activeFilterRef.current = activeFilter;
  debouncedSearchRef.current = debouncedSearch;

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchQuery.trim()),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadPage = useCallback(async (pageToLoad: number, replace: boolean) => {
    if (pageToLoad > 1) {
      if (loadingMoreRef.current || !hasMoreRef.current) {
        return;
      }
      loadingMoreRef.current = true;
      setLoadingMore(true);
    } else {
      setIsRefreshing(true);
    }

    const currentRequestId = ++requestIdRef.current;
    const filter = activeFilterRef.current;
    const search = debouncedSearchRef.current;

    setError(null);

    try {
      const data = await fetchLensesPage({
        page: pageToLoad,
        type: filter,
        search,
      });

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const mapped = data.items.map(mapApiLens);
      setLenses((current) => (replace ? mapped : [...current, ...mapped]));
      setTotalCount(data.total);
      setHasMore(data.hasMore);
      pageRef.current = data.page;
      hasMoreRef.current = data.hasMore;
      setHasLoadedOnce(true);
    } catch {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      if (pageToLoad === 1) {
        setLenses([]);
        setTotalCount(0);
      }
      setError("Unable to load inventory from the backend.");
    } finally {
      if (currentRequestId === requestIdRef.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
        setIsRefreshing(false);
        setInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    pageRef.current = 1;
    hasMoreRef.current = true;
    setHasMore(true);
    void loadPage(1, true);
  }, [activeFilter, debouncedSearch, loadPage]);

  const loadNextPage = useCallback(() => {
    if (!hasMoreRef.current || loadingMoreRef.current || isRefreshing) {
      return;
    }
    void loadPage(pageRef.current + 1, false);
  }, [loadPage, isRefreshing]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || initialLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [initialLoading, lenses.length, loadNextPage]);

  const subtitleText = (() => {
    if (isRefreshing && searchQuery.length > 0) {
      return `Searching for "${searchQuery}"…`;
    }
    if (debouncedSearch.length > 0) {
      return `${totalCount} result${totalCount === 1 ? "" : "s"} for "${debouncedSearch}"`;
    }
    return `${totalCount} products in inventory`;
  })();

  return (
    <div className="relative mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(100%,36rem)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold text-[var(--brand-text)] sm:text-3xl">
              Inventory
            </h1>
            <div className="mt-1 flex items-center gap-2">
              {isRefreshing && hasLoadedOnce ? (
                <Loader2 className="size-4 animate-spin text-[var(--brand-primary)]" />
              ) : null}
              <p className="text-sm text-[var(--brand-text-muted)]">
                {subtitleText}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "size-11 shrink-0 rounded-xl border-[var(--brand-card-border)]",
              searchActive &&
                "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-primary-text)] hover:bg-[var(--brand-primary)] hover:opacity-95"
            )}
            onClick={() => setSearchActive((current) => !current)}
            aria-label={searchActive ? "Hide search" : "Show search"}
            aria-pressed={searchActive}
          >
            <Search className="size-5" />
          </Button>
        </div>

        {searchActive ? (
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--brand-text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SPH, CYL, price, brand, eye..."
              autoFocus
              className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-card)] pr-10 pl-10"
            />
            {searchQuery.length > 0 ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-primary-text)]"
                    : "border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
                )}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {initialLoading && !hasLoadedOnce ? (
          <div className="space-y-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        ) : error && lenses.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--brand-danger-border)] bg-[var(--brand-danger-bg)] px-4 py-16 text-center">
            <CloudOff className="size-10 text-[var(--brand-danger)]" />
            <p className="text-sm font-medium text-[var(--brand-danger)]">
              {error}
            </p>
            <Button
              className="rounded-xl"
              onClick={() => void loadPage(1, true)}
            >
              Retry
            </Button>
          </div>
        ) : lenses.length === 0 ? (
          <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-16 text-center">
            {isRefreshing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-8 animate-spin text-[var(--brand-primary)]" />
                <p className="text-sm text-[var(--brand-text-muted)]">
                  Searching…
                </p>
              </div>
            ) : (
              <>
                <Package2 className="mx-auto mb-3 size-10 text-[var(--brand-text-muted)]" />
                <p className="text-sm font-medium text-[var(--brand-text-muted)]">
                  {debouncedSearch
                    ? "No products match your search."
                    : "No products found for this filter."}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {lenses.map((item) => (
              <InventoryProductCard key={item.id} item={item} />
            ))}

            {loadingMore ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--brand-text-muted)]">
                <Loader2 className="size-4 animate-spin" />
                Loading more products…
              </div>
            ) : null}
            <div ref={loadMoreRef} className="h-1" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
