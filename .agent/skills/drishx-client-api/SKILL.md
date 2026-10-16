---
name: drishx-client-api
description: >-
  Website client API calling pattern without React Query — pure api functions,
  useApiQuery / useApiMutation hooks, centralized loading and error handling via
  authFetch. Use when adding or changing web UI data fetching, mutations, loading
  states, API hooks, or lib/*-api.ts client wrappers.
---

# DrishX Website — Client API Calling

**No TanStack Query / SWR.** One pattern for reads and writes. Components never call `authFetch` / `authFetchJson` directly.

## Stack (this repo)

| Layer | Location |
|-------|----------|
| Transport | `authFetch` / `authFetchJson` in `lib/auth-fetch.ts` (Bearer + refresh). Public/unauthed may use `fetchWithRetry` in `lib/fetch-with-retry.ts` **only inside api files**. |
| Feature API | Existing `lib/<feature>-api.ts` or `lib/modules/<feature>/api.ts` |
| Shared hooks | `lib/hooks/use-api-query.ts`, `use-api-mutation.ts` |
| Registry | `lib/constants/api-registry.ts` |
| Shared types | `lib/types/api-client.ts` |

Website often hits same-origin `/api/...` BFF routes; mobile hits the backend directly. Keep paths as this repo already uses them.

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

### `QueryOptions` / `MutationOptions`

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
```

- No response → `TData = void`
- No payload → `TVariables = null`

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

## Gold standard hooks

### Query

```ts
import { fetchOrders } from "@/lib/orders-api"; // or existing helper
import { QUERY_REGISTRY } from "@/lib/constants/api-registry";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import type { QueryOptions } from "@/lib/types/api-client";

export function useGetOrders(options?: QueryOptions<Order[]>) {
  return useApiQuery(
    QUERY_REGISTRY.getOrders,
    () => fetchOrders(),
    [],
    options,
  );
}
```

Params as 1st arg when needed; `options` last.

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
2. Api files own transport and path strings.
3. Loading/error from hook flags — no parallel `useState` + `useEffect` fetch boilerplate in screens.
4. Non-401 → `error` / `onError`; success side effects in `onSuccess`.
5. No React Query / Axios for new work.
6. Migrate opportunistically when editing a screen.

## Screen shape

```tsx
const { data, loading, error, refetch } = useGetOrders();
const { mutate, pending } = useUpdateCart({
  onSuccess: () => refetch(),
});

if (loading) return <OrdersSkeleton />;
if (error) return <p>{error.message}</p>; // or shared ErrorState + retry
```

## Checklist

- [ ] Registry entry
- [ ] Pure api function
- [ ] Query or mutation hook
- [ ] Screen uses `loading` / `pending` / `error`
- [ ] Auth errors not double-handled
- [ ] Mutation single-arg payload
