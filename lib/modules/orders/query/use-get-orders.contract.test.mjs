/**
 * Phase B — my-orders uses paginated useGetOrders + load-more accumulation.
 * Run: node --test lib/modules/orders/query/use-get-orders.contract.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("useGetOrders contract", () => {
  it("feature hook wraps fetchOrders via useApiQuery + registry with params", () => {
    const src = readFileSync(
      join(root, "lib/modules/orders/query/use-get-orders.ts"),
      "utf8"
    );
    assert.match(src, /QUERY_REGISTRY\.getOrders/);
    assert.match(src, /useApiQuery/);
    assert.match(src, /fetchOrders\(params\)/);
    assert.doesNotMatch(src, /authFetch\(/);
  });

  it("my-orders-screen uses paginated useGetOrders + usePaginatedListState", () => {
    const src = readFileSync(
      join(root, "components/orders/my-orders-screen.tsx"),
      "utf8"
    );
    assert.match(src, /useGetOrders/);
    assert.match(src, /usePaginatedListState/);
    assert.match(src, /onPageSuccess|onSuccess:\s*onPageSuccess/);
    assert.match(src, /refetch/);
    assert.doesNotMatch(src, /from ["']@\/lib\/orders-api["']/);
    assert.doesNotMatch(src, /(?<![A-Za-z])fetchOrders\s*\(/);
  });

  it("registry includes getOrders", () => {
    const src = readFileSync(
      join(root, "lib/constants/api-registry.ts"),
      "utf8"
    );
    assert.match(src, /getOrders:\s*"getOrders"/);
  });
});
