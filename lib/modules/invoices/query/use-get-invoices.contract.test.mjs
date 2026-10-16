/**
 * Phase 3 Batch 3 — website invoices list uses useGetInvoices.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("useGetInvoices contract", () => {
  it("feature hook wraps fetchInvoices via useApiQuery", () => {
    const src = readFileSync(
      join(root, "lib/modules/invoices/query/use-get-invoices.ts"),
      "utf8"
    );
    assert.match(src, /QUERY_REGISTRY\.getInvoices/);
    assert.match(src, /useApiQuery/);
    assert.match(src, /fetchInvoices\(\)/);
    assert.doesNotMatch(src, /authFetch\(/);
  });

  it("invoices-screen uses useGetInvoices (no local fetchInvoices effect)", () => {
    const src = readFileSync(
      join(root, "components/profile/invoices-screen.tsx"),
      "utf8"
    );
    assert.match(src, /useGetInvoices/);
    assert.match(src, /refetch/);
    assert.doesNotMatch(src, /fetchInvoices/);
    assert.doesNotMatch(src, /loadInvoices/);
    assert.doesNotMatch(src, /useEffect\(/);
  });

  it("registry includes getInvoices", () => {
    const src = readFileSync(
      join(root, "lib/constants/api-registry.ts"),
      "utf8"
    );
    assert.match(src, /getInvoices:\s*"getInvoices"/);
  });
});
