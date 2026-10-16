/**
 * Phase 3 Batch 5 — employee orders screens use useGetOrders.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("useGetOrders employee contract", () => {
  it("employee-orders-screen uses useGetOrders (no fetchOrders import)", () => {
    const src = readFileSync(
      join(root, "components/employee/employee-orders-screen.tsx"),
      "utf8"
    );
    assert.match(src, /useGetOrders/);
    assert.match(src, /refetch/);
    assert.match(src, /enrichOrdersWithCatalogStock/);
    assert.doesNotMatch(src, /from ["']@\/lib\/orders-api["']/);
  });

  it("employee-order-detail-screen uses useGetOrders; keeps updateOrderStatus", () => {
    const src = readFileSync(
      join(root, "components/employee/employee-order-detail-screen.tsx"),
      "utf8"
    );
    assert.match(src, /useGetOrders/);
    assert.match(src, /refetch/);
    assert.match(src, /updateOrderStatus/);
    assert.match(src, /filterStaffFulfillmentOrders/);
    assert.doesNotMatch(src, /(?<![A-Za-z])fetchOrders\s*\(/);
  });

  it("employee-home-dashboard uses useGetOrders; tasks stay sequential", () => {
    const src = readFileSync(
      join(root, "components/employee/employee-home-dashboard.tsx"),
      "utf8"
    );
    assert.match(src, /useGetOrders/);
    assert.match(src, /fetchMyTasks/);
    assert.match(src, /ordersLoading/);
    assert.doesNotMatch(src, /(?<![A-Za-z])fetchOrders\s*\(/);
    assert.doesNotMatch(src, /Promise\.all/);
  });
});


