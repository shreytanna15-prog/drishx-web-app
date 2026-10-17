/**
 * Regression: order-group batch expansion must not silently stop at page 1 / 100.
 * Mirrors collectAllBatchOrderPages in lib/orders-api.ts (node:test, no TS loader).
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORDER_GROUP_MAX_PAGES = 50;

async function collectAllBatchOrderPages(fetchPage, maxPages = ORDER_GROUP_MAX_PAGES) {
  const all = [];
  let page = 1;
  let hasMore = true;
  while (hasMore && page <= maxPages) {
    const result = await fetchPage(page);
    all.push(...result.items);
    hasMore = result.hasMore;
    page += 1;
  }
  return all;
}

describe("collectAllBatchOrderPages", () => {
  it("loads every page when a batch exceeds 100 lines", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({ id: `o${i + 1}` }));
    const page2 = Array.from({ length: 5 }, (_, i) => ({ id: `o${101 + i}` }));
    const calls = [];

    const items = await collectAllBatchOrderPages(async (page) => {
      calls.push(page);
      if (page === 1) return { items: page1, hasMore: true };
      if (page === 2) return { items: page2, hasMore: false };
      throw new Error(`unexpected page ${page}`);
    });

    assert.deepEqual(calls, [1, 2]);
    assert.equal(items.length, 105);
    assert.equal(items[0].id, "o1");
    assert.equal(items[99].id, "o100");
    assert.equal(items[100].id, "o101");
    assert.equal(items[104].id, "o105");
  });

  it("stops on first page when hasMore is false", async () => {
    const calls = [];
    const items = await collectAllBatchOrderPages(async (page) => {
      calls.push(page);
      return { items: [{ id: "a" }, { id: "b" }], hasMore: false };
    });
    assert.deepEqual(calls, [1]);
    assert.equal(items.length, 2);
  });

  it("respects maxPages safety cap", async () => {
    let pages = 0;
    const items = await collectAllBatchOrderPages(
      async (page) => {
        pages = page;
        return {
          items: [{ id: `p${page}` }],
          hasMore: true,
        };
      },
      3
    );
    assert.equal(pages, 3);
    assert.equal(items.length, 3);
  });
});

describe("fetchOrdersForGroup multipage contract", () => {
  it("uses collectAllBatchOrderPages / listAllOrdersForBatch (not page-1-only)", () => {
    const src = readFileSync(join(root, "lib/orders-api.ts"), "utf8");
    assert.match(src, /collectAllBatchOrderPages/);
    assert.match(src, /listAllOrdersForBatch/);
    assert.match(src, /ORDER_GROUP_MAX_PAGES/);
    assert.match(src, /while \(hasMore && page <= maxPages\)/);
    // Must not leave the old single-page batch fetch as the group path.
    assert.doesNotMatch(
      src,
      /fetchOrders\(\{\s*batchId:\s*key,\s*limit:\s*100,\s*page:\s*1\s*\}\)/
    );
  });
});
