/**
 * Phase B/D — order detail uses useGetOrderGroup (batch/detail), not full list.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("order-detail-screen useGetOrderGroup contract", () => {
  it("uses useGetOrderGroup and groupOrdersForList (no local fetchOrders)", () => {
    const src = readFileSync(
      join(root, "components/orders/order-detail-screen.tsx"),
      "utf8"
    );
    assert.match(src, /useGetOrderGroup/);
    assert.match(src, /groupOrdersForList/);
    assert.match(src, /refetch/);
    assert.doesNotMatch(src, /useGetOrders\b/);
    assert.doesNotMatch(src, /from ["']@\/lib\/orders-api["']/);
    assert.doesNotMatch(src, /(?<![A-Za-z])fetchOrders\s*\(/);
  });
});
