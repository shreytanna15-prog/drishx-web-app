"use client";

import { useState } from "react";
import type { Paginated } from "@/lib/types/api-client";

/** Merge a server page into an accumulated list (page 1 replaces). */
export function mergePaginatedItems<T extends { id: string }>(
  prev: T[],
  page: Pick<Paginated<T>, "page" | "items">
): T[] {
  if (page.page <= 1) return page.items;
  const seen = new Set(prev.map((row) => row.id));
  const merged = [...prev];
  for (const row of page.items) {
    if (!seen.has(row.id)) merged.push(row);
  }
  return merged;
}

/**
 * Apply a page result after a possible filter reset.
 * Ignores stale page>1 writes when the list was cleared (empty prev).
 */
export function applyPaginatedPageSuccess<T extends { id: string }>(
  prev: T[],
  page: Pick<Paginated<T>, "page" | "items">
): T[] {
  if (page.page > 1 && prev.length === 0) {
    return prev;
  }
  return mergePaginatedItems(prev, page);
}

/**
 * Page + accumulated items for server-paginated lists.
 * When `resetKey` changes (filters/search), page resets and items clear during render.
 * Pass `onPageSuccess` to the query hook's `onSuccess` (not a sync effect).
 */
export function usePaginatedListState<T extends { id: string }>(resetKey: string) {
  const [trackedKey, setTrackedKey] = useState(resetKey);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<T[]>([]);

  if (resetKey !== trackedKey) {
    setTrackedKey(resetKey);
    setPage(1);
    setItems([]);
  }

  function onPageSuccess(result: Pick<Paginated<T>, "page" | "items">) {
    setItems((prev) => applyPaginatedPageSuccess(prev, result));
  }

  return { page, setPage, items, setItems, onPageSuccess };
}
