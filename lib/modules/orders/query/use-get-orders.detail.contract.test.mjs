/**
 * Phase 3 Batch 2 — order detail uses useGetOrders (full list for batch grouping).
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("order-detail-screen useGetOrders contract", () => {
  it("uses useGetOrders and groupOrdersForList (no local fetchOrders effect)", () => {
    const src = readFileSync(
      join(root, "components/orders/order-detail-screen.tsx"),
      "utf8"
    );
    assert.match(src, /useGetOrders/);
    assert.match(src, /groupOrdersForList/);
    assert.match(src, /refetch/);
    assert.doesNotMatch(src, /from ["']@\/lib\/orders-api["']/);
    assert.doesNotMatch(src, /useEffect\(/);
  });
});
