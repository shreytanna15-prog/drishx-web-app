/**
 * WEB-PDF-01 — download mutation + invoice detail wiring.
 * Run: node --test lib/modules/invoices/mutation/use-download-invoice-pdf.contract.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("useDownloadInvoicePdf contract", () => {
  it("feature hook wraps downloadInvoicePdf via useApiMutation", () => {
    const src = readFileSync(
      join(root, "lib/modules/invoices/mutation/use-download-invoice-pdf.ts"),
      "utf8"
    );
    assert.match(src, /useApiMutation/);
    assert.match(src, /downloadInvoicePdf\(variables\.id/);
    assert.doesNotMatch(src, /authFetch\(/);
  });

  it("registry includes downloadInvoicePdf", () => {
    const src = readFileSync(
      join(root, "lib/constants/api-registry.ts"),
      "utf8"
    );
    assert.match(src, /downloadInvoicePdf:\s*"downloadInvoicePdf"/);
  });

  it("invoice-detail uses authenticated download (no bare pdf href)", () => {
    const src = readFileSync(
      join(root, "components/profile/invoice-detail-screen.tsx"),
      "utf8"
    );
    assert.match(src, /useDownloadInvoicePdf/);
    assert.match(src, /presentInvoiceTaxDocument/);
    assert.match(src, /disabled=\{downloading\}/);
    assert.match(src, /window\.open\("about:blank"/);
    assert.doesNotMatch(src, /href=\{`\/api\/invoices\/\$\{invoice\.id\}\/pdf`\}/);
    assert.doesNotMatch(src, /authFetch\(/);
  });
});
