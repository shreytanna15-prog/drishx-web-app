export type LensSortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "stock_first"
  | "sph_asc";

export const DEFAULT_LENS_SORT: LensSortOption = "price_asc";

export const LENS_SORT_OPTIONS: { value: LensSortOption; label: string }[] = [
  { value: "price_asc", label: "Default (Price: Low → High)" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest" },
  { value: "stock_first", label: "In stock first" },
  { value: "sph_asc", label: "Power: SPH Low → High" },
];

/** True when API natural order (newest) is not enough and client re-sort is required. */
export function isCustomLensSort(
  sort: LensSortOption | null | undefined
): boolean {
  return Boolean(sort) && sort !== "newest";
}

type SortableLens = {
  price?: number | null;
  quantity?: number | null;
  sph?: number | null;
  cyl?: number | null;
  createdAt?: string | Date | null;
};

function toCreatedAtMs(value: string | Date | null | undefined): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function compareNullableNumber(
  a: number | null | undefined,
  b: number | null | undefined,
  direction: 1 | -1
): number {
  const aMissing = a === null || a === undefined || !Number.isFinite(Number(a));
  const bMissing = b === null || b === undefined || !Number.isFinite(Number(b));
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return (Number(a) - Number(b)) * direction;
}

export function compareApiLenses<T extends SortableLens>(
  a: T,
  b: T,
  sort: LensSortOption
): number {
  switch (sort) {
    case "price_asc":
      return (
        compareNullableNumber(a.price, b.price, 1) ||
        toCreatedAtMs(b.createdAt) - toCreatedAtMs(a.createdAt)
      );
    case "price_desc":
      return (
        compareNullableNumber(a.price, b.price, -1) ||
        toCreatedAtMs(b.createdAt) - toCreatedAtMs(a.createdAt)
      );
    case "stock_first": {
      const aInStock = Number(a.quantity) > 0 ? 0 : 1;
      const bInStock = Number(b.quantity) > 0 ? 0 : 1;
      return (
        aInStock - bInStock ||
        compareNullableNumber(a.price, b.price, 1) ||
        toCreatedAtMs(b.createdAt) - toCreatedAtMs(a.createdAt)
      );
    }
    case "sph_asc":
      return (
        compareNullableNumber(a.sph, b.sph, 1) ||
        compareNullableNumber(a.cyl, b.cyl, 1) ||
        compareNullableNumber(a.price, b.price, 1) ||
        toCreatedAtMs(b.createdAt) - toCreatedAtMs(a.createdAt)
      );
    case "newest":
    default:
      return toCreatedAtMs(b.createdAt) - toCreatedAtMs(a.createdAt);
  }
}

export function sortApiLenses<T extends SortableLens>(
  items: T[],
  sort: LensSortOption
): T[] {
  return [...items].sort((a, b) => compareApiLenses(a, b, sort));
}

export function paginateItems<T>(
  items: T[],
  page: number,
  limit: number
): { items: T[]; total: number; page: number; limit: number; hasMore: boolean } {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const total = items.length;
  const offset = (safePage - 1) * safeLimit;
  return {
    items: items.slice(offset, offset + safeLimit),
    total,
    page: safePage,
    limit: safeLimit,
    hasMore: offset + safeLimit < total,
  };
}
