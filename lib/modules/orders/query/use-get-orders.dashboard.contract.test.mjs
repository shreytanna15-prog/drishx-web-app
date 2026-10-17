/**
 * Phase D — customer dashboard uses useGetOrdersOverview (not full orders list).
 * Run: node --test lib/modules/orders/query/use-get-orders.dashboard.contract.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("customer-dashboard useGetOrdersOverview contract", () => {
  it("uses useGetOrdersOverview without fetchOrders / full-list stats", () => {
    const src = readFileSync(
      join(root, "components/dashboard/customer-dashboard.tsx"),
      "utf8"
    );
    assert.match(src, /useGetOrdersOverview/);
    assert.doesNotMatch(src, /useGetOrders\b/);
    assert.doesNotMatch(src, /computeCustomerOrderOverview/);
    assert.doesNotMatch(src, /from ["']@\/lib\/orders-api["']/);
    assert.doesNotMatch(src, /(?<![A-Za-z])fetchOrders\s*\(/);
  });
});
