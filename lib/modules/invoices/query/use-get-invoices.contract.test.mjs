/**
 * Phase C/D — website invoices list uses paginated useGetInvoices + load-more.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("useGetInvoices contract", () => {
  it("feature hook wraps fetchInvoices via useApiQuery with params", () => {
    const src = readFileSync(
      join(root, "lib/modules/invoices/query/use-get-invoices.ts"),
      "utf8"
    );
    assert.match(src, /QUERY_REGISTRY\.getInvoices/);
    assert.match(src, /useApiQuery/);
    assert.match(src, /fetchInvoices\(params\)/);
    assert.doesNotMatch(src, /authFetch\(/);
  });

  it("invoices-screen uses paginated useGetInvoices + usePaginatedListState", () => {
    const src = readFileSync(
      join(root, "components/profile/invoices-screen.tsx"),
      "utf8"
    );
    assert.match(src, /useGetInvoices/);
    assert.match(src, /usePaginatedListState/);
    assert.match(src, /onPageSuccess|onSuccess:\s*onPageSuccess/);
    assert.match(src, /refetch/);
    assert.doesNotMatch(src, /(?<![A-Za-z])fetchInvoices\s*\(/);
    assert.doesNotMatch(src, /loadInvoices/);
  });

  it("registry includes getInvoices", () => {
    const src = readFileSync(
      join(root, "lib/constants/api-registry.ts"),
      "utf8"
    );
    assert.match(src, /getInvoices:\s*"getInvoices"/);
  });
});
