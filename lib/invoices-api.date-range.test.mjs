import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "lib/invoices-api.ts"), "utf8");

describe("invoice date filter server params", () => {
  it("exports invoiceDateFilterToRange and query dateFrom/dateTo", () => {
    assert.match(src, /export function invoiceDateFilterToRange/);
    assert.match(src, /qs\.set\("dateFrom"/);
    assert.match(src, /qs\.set\("dateTo"/);
    assert.match(src, /dateFrom\?: string/);
  });

  it("invoices screen passes date range to useGetInvoices", () => {
    const screen = readFileSync(
      join(root, "components/profile/invoices-screen.tsx"),
      "utf8"
    );
    assert.match(screen, /invoiceDateFilterToRange/);
    assert.match(screen, /dateFrom:\s*dateRange\.dateFrom/);
    assert.match(screen, /date:\s*"ALL"/);
  });
});
