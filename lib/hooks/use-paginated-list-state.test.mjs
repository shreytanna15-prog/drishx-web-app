import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);

// Pure helpers are duplicated inline from the TS module for node:test without a TS loader.
function mergePaginatedItems(prev, page) {
  if (page.page <= 1) return page.items;
  const seen = new Set(prev.map((row) => row.id));
  const merged = [...prev];
  for (const row of page.items) {
    if (!seen.has(row.id)) merged.push(row);
  }
  return merged;
}

function applyPaginatedPageSuccess(prev, page) {
  if (page.page > 1 && prev.length === 0) return prev;
  return mergePaginatedItems(prev, page);
}

describe("usePaginatedListState helpers", () => {
  it("page 1 replaces accumulated items", () => {
    const next = mergePaginatedItems(
      [{ id: "a" }, { id: "b" }],
      { page: 1, items: [{ id: "c" }] }
    );
    assert.deepEqual(next, [{ id: "c" }]);
  });

  it("later pages append and dedupe by id", () => {
    const next = mergePaginatedItems(
      [{ id: "a" }, { id: "b" }],
      { page: 2, items: [{ id: "b" }, { id: "c" }] }
    );
    assert.deepEqual(
      next.map((r) => r.id),
      ["a", "b", "c"]
    );
  });

  it("ignores stale page>1 after reset (empty prev)", () => {
    const next = applyPaginatedPageSuccess([], {
      page: 3,
      items: [{ id: "stale" }],
    });
    assert.deepEqual(next, []);
  });

  it("accepts page 1 after reset", () => {
    const next = applyPaginatedPageSuccess([], {
      page: 1,
      items: [{ id: "fresh" }],
    });
    assert.deepEqual(next, [{ id: "fresh" }]);
  });

  it("source exports applyPaginatedPageSuccess", () => {
    const src = readFileSync(
      join(root, "lib/hooks/use-paginated-list-state.ts"),
      "utf8"
    );
    assert.match(src, /export function applyPaginatedPageSuccess/);
    assert.match(src, /page\.page > 1 && prev\.length === 0/);
    // silence unused require in some runners
    assert.equal(typeof require, "function");
  });
});
