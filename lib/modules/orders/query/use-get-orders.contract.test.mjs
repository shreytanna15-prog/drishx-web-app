/**
 * Phase 2 contract checks for useGetOrders wiring (no React Testing Library).
 * Run: node --test lib/modules/orders/query/use-get-orders.contract.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("useGetOrders contract", () => {
  it("feature hook wraps fetchOrders via useApiQuery + registry", () => {
    const src = readFileSync(
      join(root, "lib/modules/orders/query/use-get-orders.ts"),
      "utf8"
    );
    assert.match(src, /QUERY_REGISTRY\.getOrders/);
    assert.match(src, /useApiQuery/);
    assert.match(src, /fetchOrders/);
    assert.doesNotMatch(src, /authFetch\(/);
  });

  it("my-orders-screen uses useGetOrders (no local fetchOrders effect)", () => {
    const src = readFileSync(
      join(root, "components/orders/my-orders-screen.tsx"),
      "utf8"
    );
    assert.match(src, /useGetOrders/);
    assert.match(src, /refetch/);
    assert.doesNotMatch(src, /from ["']@\/lib\/orders-api["']/);
    assert.doesNotMatch(src, /useEffect\(/);
  });

  it("registry includes getOrders", () => {
    const src = readFileSync(
      join(root, "lib/constants/api-registry.ts"),
      "utf8"
    );
    assert.match(src, /getOrders:\s*"getOrders"/);
  });
});
