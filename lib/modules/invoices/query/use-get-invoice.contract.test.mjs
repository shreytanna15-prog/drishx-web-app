/**
 * Phase 3 Batch 4 — website invoice detail uses useGetInvoice.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("useGetInvoice contract", () => {
  it("feature hook wraps fetchInvoiceById via useApiQuery", () => {
    const src = readFileSync(
      join(root, "lib/modules/invoices/query/use-get-invoice.ts"),
      "utf8"
    );
    assert.match(src, /QUERY_REGISTRY\.getInvoice/);
    assert.match(src, /useApiQuery/);
    assert.match(src, /fetchInvoiceById\(invoiceId!\)/);
    assert.match(src, /\[invoiceId\]/);
    assert.doesNotMatch(src, /authFetch\(/);
  });

  it("invoice-detail-screen uses useGetInvoice (no local fetchInvoiceById effect)", () => {
    const src = readFileSync(
      join(root, "components/profile/invoice-detail-screen.tsx"),
      "utf8"
    );
    assert.match(src, /useGetInvoice/);
    assert.match(src, /refetch/);
    assert.match(src, /data\?\.id === invoiceId/);
    assert.doesNotMatch(src, /fetchInvoiceById/);
    assert.doesNotMatch(src, /const loadInvoice\b/);
    assert.doesNotMatch(src, /useEffect\(/);
    assert.doesNotMatch(
      src,
      /href=\{`\/api\/invoices\/\$\{invoice\.id\}\/pdf`\}/
    );
  });

  it("registry includes getInvoice", () => {
    const src = readFileSync(
      join(root, "lib/constants/api-registry.ts"),
      "utf8"
    );
    assert.match(src, /getInvoice:\s*"getInvoice"/);
  });
});
