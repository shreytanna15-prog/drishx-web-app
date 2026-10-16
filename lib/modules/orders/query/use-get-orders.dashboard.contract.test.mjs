/**
 * Phase 3 Batch 1 — customer dashboard uses useGetOrders (no local fetchOrders effect).
 * Run: node --test lib/modules/orders/query/use-get-orders.dashboard.contract.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("customer-dashboard useGetOrders contract", () => {
  it("uses useGetOrders and derives stats without fetchOrders useEffect", () => {
    const src = readFileSync(
      join(root, "components/dashboard/customer-dashboard.tsx"),
      "utf8"
    );
    assert.match(src, /useGetOrders/);
    assert.match(src, /computeCustomerOrderOverview/);
    assert.doesNotMatch(src, /from ["']@\/lib\/orders-api["']/);
    assert.doesNotMatch(src, /useEffect\(/);
  });
});
