---
name: drishx-client-api
description: >-
  Website client API calling pattern without React Query — pure api functions,
  useApiQuery / useApiMutation hooks, list pagination (Paginated), summary vs
  detail DTOs, centralized loading and error handling via authFetch. Use when
  adding or changing web UI data fetching, mutations, list screens, loading
  states, API hooks, or lib/*-api.ts client wrappers.
---

# DrishX Website — Client API Calling

**No TanStack Query / SWR.** One pattern for reads and writes. Components never call `authFetch` / `authFetchJson` directly.

This skill also covers **list/table contracts**: pagination params, `Paginated<T>`, summary vs detail DTOs, and migration rules for hot lists (orders first).

## Stack (this repo)

| Layer | Location |
|-------|----------|
| Transport | `authFetch` / `authFetchJson` in `lib/auth-fetch.ts` (Bearer + refresh). Public/unauthed may use `fetchWithRetry` in `lib/fetch-with-retry.ts` **only inside api files**. |
| Feature API | Existing `lib/<feature>-api.ts` or `lib/modules/<feature>/api.ts` |
| Shared hooks | `lib/hooks/use-api-query.ts`, `use-api-mutation.ts` |
| Registry | `lib/constants/api-registry.ts` |
| Shared types | `lib/types/api-client.ts` (`QueryOptions`, `MutationOptions`, `Paginated`) |

Website often hits same-origin `/api/...` BFF routes; mobile hits the backend directly. Keep paths as this repo already uses them. When the BFF proxies a list endpoint, **forward `page` / `limit` / filter query params unchanged**.

## Folder rules

1. **`api`** — pure async functions (no React, no toasts).
2. **`types`** — Payload / Response / Params.
3. **`query`** — `use-get-<entity>.ts` → `useApiQuery`.
4. **`mutation`** — `use-<action>-<entity>.ts` → `useApiMutation`.

Incremental OK: keep `lib/cart-api.ts`, order helpers, etc.; add hooks when touching a screen.

```
lib/modules/<feature>/
  api.ts
  types.ts
  query/use-get-orders.ts
  mutation/use-update-cart.ts
```

## Shared primitives (create once if missing)

### `QueryOptions` / `MutationOptions` / `Paginated`

```ts
// lib/types/api-client.ts
export type QueryOptions<TData> = {
  enabled?: boolean;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
};

export type MutationOptions<TData, TVariables> = {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
};

/** Standard list envelope for table/list endpoints. */
export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  hasMore: boolean;
  total?: number;
};
```

- No response → `TData = void`
- No payload → `TVariables = null`
- Prefer `page` / `limit` on new list work. Cursor domains may differ — document and stay consistent for that feature.

### Registry

```ts
// lib/constants/api-registry.ts
export const QUERY_REGISTRY = {
  getOrders: "getOrders",
  getCart: "getCart",
} as const;

export const MUTATION_REGISTRY = {
  updateCart: "updateCart",
} as const;
```

### `useApiQuery` / `useApiMutation`

Under `lib/hooks/`. Contract:

| | Query | Mutation |
|---|--------|----------|
| Trigger | mount + deps (if enabled) | `mutate(variables)` |
| Loading | `loading` / `refreshing` | `pending` |
| Error | `error` | `error` |
| Retry | `refetch()` | call `mutate` again |

**401 / auth:** do not handle in UI callbacks — `authFetch` refreshes / `handleAuthRedirect` / `onAuthFailure`. Skip `onError` UI for auth failures.

**Other errors:** set `error` + optional `onError` for inline message or future toast.

## List & pagination contract

List query hooks accept **`params` as the first argument**:

```ts
type ListParams = {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
  // …feature filters (e.g. employeeId when staff)
};
```

Rules:

1. Include every request-changing param in `useApiQuery` **`deps`** (`page`, `limit`, `status`, `q`, …).
2. Type list responses as `Paginated<OrderListItem>` (summary), not `Order[]` / full detail arrays, for new or migrated list work.
3. UI: `loading` for first page; `refreshing` for page changes / load-more. No parallel ad-hoc loading state.
4. Status tabs and search → **query params** to the API (and BFF), not only client `.filter` on a full download.
5. **Forbidden:** download all orders then filter for primary tabs/search when the API supports (or should support) those params.
6. Cap `limit` (e.g. 20–50 client default; server max ~100). Do not silently truncate and present the UI as complete.

## List vs detail

| Surface | Type | Endpoint |
|---------|------|----------|
| My orders / employee order lists | Summary (`OrderListItem`, …) | Paginated list `GET` with filters |
| Order detail screens | Full detail | `GET /api/orders/:id` (or existing detail) |

- List rows: id, status, dates, customer/business summary, amounts, lens one-liner / type, flags — not signed images, wholesale line dumps, or power versions.
- Do not reuse the full detail type for list rows.
- Keep detail fetches for detail screens only.

## Migration rules

1. **New screens:** hooks only — never `authFetch` / `authFetchJson` / raw `fetch` in components.
2. **Touched list screens:** migrate to hooks + server params in the same PR.
3. **Hot paths (mandatory for RW-11):**
   - **Orders** — `fetchOrders` / my-orders / employee orders / dashboards that currently pull all orders (Phase B)
   - Follow-ups as backend Phase C lands for other shared lists
4. Opportunistic migration elsewhere; do not rewrite every screen in one PR.
5. After foundation hooks exist, reject new list UIs that call transport from components.

## Gold standard hooks

### List query (paginated summary)

```ts
import { fetchOrders } from "@/lib/orders-api";
import { QUERY_REGISTRY } from "@/lib/constants/api-registry";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import type { Paginated, QueryOptions } from "@/lib/types/api-client";

type ListOrdersParams = {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
};

export function useGetOrders(
  params?: ListOrdersParams,
  options?: QueryOptions<Paginated<OrderListItem>>,
) {
  return useApiQuery(
    QUERY_REGISTRY.getOrders,
    () => fetchOrders(params),
    [params?.page, params?.limit, params?.status, params?.q],
    options,
  );
}
```

Params as 1st arg when needed; `options` last. Detail: separate `useGetOrder(id)`.

### Mutation

```ts
export function useUpdateCart(
  options?: MutationOptions<CartResponse, UpdateCartPayload>,
) {
  return useApiMutation((payload) => updateCart(payload), options);
}
```

**Strict payload rule:** one argument. Id + body → `{ id, data }`.

## Essential rules

1. Components → hooks only. Never `authFetch` / `authFetchJson` / raw `fetch` in components.
2. Api files own transport and path strings (including BFF query-string forwarding).
3. Loading/error from hook flags — no parallel `useState` + `useEffect` fetch boilerplate in screens.
4. Non-401 → `error` / `onError`; success side effects in `onSuccess`.
5. No React Query / Axios for new work.
6. Lists: `Paginated` + server filters; summary on list; detail on `GET :id`.
7. Migrate opportunistically; **orders** list consumers are a mandatory hot path.

## Screen shape

```tsx
const { data, loading, refreshing, error, refetch } = useGetOrders({
  page,
  limit: 20,
  status,
  q,
});
const { mutate, pending } = useUpdateCart({
  onSuccess: () => refetch(),
});

if (loading) return <OrdersSkeleton />;
if (error) return <p>{error.message}</p>; // or shared ErrorState + retry

// data.items — summary rows; page / load-more via params + refreshing
```

## Checklist

- [ ] Registry entry
- [ ] Pure api function
- [ ] Query or mutation hook
- [ ] Screen uses `loading` / `refreshing` / `pending` / `error`
- [ ] Auth errors not double-handled
- [ ] Mutation single-arg payload
- [ ] List hooks: `params` first; `deps` include every request param
- [ ] List response typed as `Paginated<SummaryDto>`
- [ ] Status/search via server params (BFF forwards them)
- [ ] Detail screens use detail GET / detail hook
