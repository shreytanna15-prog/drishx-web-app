/**
 * Phase 3 Batch 4 — website return detail uses useGetReturnRequest.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("useGetReturnRequest contract", () => {
  it("feature hook wraps fetchReturnRequest via useApiQuery", () => {
    const src = readFileSync(
      join(root, "lib/modules/returns/query/use-get-return-request.ts"),
      "utf8"
    );
    assert.match(src, /QUERY_REGISTRY\.getReturnRequest/);
    assert.match(src, /useApiQuery/);
    assert.match(src, /fetchReturnRequest\(returnId!\)/);
    assert.match(src, /\[returnId\]/);
    assert.doesNotMatch(src, /authFetch\(/);
  });

  it("customer-return-detail-screen uses useGetReturnRequest (no local fetch effect)", () => {
    const src = readFileSync(
      join(root, "components/returns/customer-return-detail-screen.tsx"),
      "utf8"
    );
    assert.match(src, /useGetReturnRequest/);
    assert.match(src, /data\?\.id === returnId/);
    assert.doesNotMatch(src, /fetchReturnRequest/);
    assert.doesNotMatch(src, /const load =/);
    assert.doesNotMatch(src, /useEffect\(/);
  });

  it("registry includes getReturnRequest", () => {
    const src = readFileSync(
      join(root, "lib/constants/api-registry.ts"),
      "utf8"
    );
    assert.match(src, /getReturnRequest:\s*"getReturnRequest"/);
  });
});
