/**
 * Phase B/D — employee orders use paginated useGetOrders; home uses overview;
 * detail uses useGetOrderGroup.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("useGetOrders employee contract", () => {
  it("employee-orders-screen uses paginated useGetOrders (no fetchOrders import)", () => {
    const src = readFileSync(
      join(root, "components/employee/employee-orders-screen.tsx"),
      "utf8"
    );
    assert.match(src, /useGetOrders/);
    assert.match(src, /usePaginatedListState/);
    assert.match(src, /refetch/);
    assert.match(src, /enrichOrdersWithCatalogStock/);
    assert.doesNotMatch(src, /from ["']@\/lib\/orders-api["']/);
  });

  it("employee-order-detail-screen uses useGetOrderGroup; keeps updateOrderStatus", () => {
    const src = readFileSync(
      join(root, "components/employee/employee-order-detail-screen.tsx"),
      "utf8"
    );
    assert.match(src, /useGetOrderGroup/);
    assert.match(src, /refetch/);
    assert.match(src, /updateOrderStatus/);
    assert.match(src, /filterStaffFulfillmentOrders/);
    assert.doesNotMatch(src, /useGetOrders\b/);
    assert.doesNotMatch(src, /(?<![A-Za-z])fetchOrders\s*\(/);
  });

  it("employee-home-dashboard uses useGetOrdersOverview (not full orders list)", () => {
    const src = readFileSync(
      join(root, "components/employee/employee-home-dashboard.tsx"),
      "utf8"
    );
    assert.match(src, /useGetOrdersOverview/);
    assert.doesNotMatch(src, /useGetOrders\b/);
    assert.doesNotMatch(src, /fetchMyTasks/);
    assert.doesNotMatch(src, /(?<![A-Za-z])fetchOrders\s*\(/);
    assert.doesNotMatch(src, /Promise\.all/);
  });
});
