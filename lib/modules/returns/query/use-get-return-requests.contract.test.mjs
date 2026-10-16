/**
 * Phase 3 Batch 3 — website returns list uses useGetReturnRequests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("useGetReturnRequests contract", () => {
  it("feature hook wraps fetchReturnRequests via useApiQuery", () => {
    const src = readFileSync(
      join(root, "lib/modules/returns/query/use-get-return-requests.ts"),
      "utf8"
    );
    assert.match(src, /QUERY_REGISTRY\.getReturnRequests/);
    assert.match(src, /useApiQuery/);
    assert.match(src, /fetchReturnRequests\(\)/);
    assert.doesNotMatch(src, /authFetch\(/);
  });

  it("customer-returns-screen uses useGetReturnRequests (no local fetch effect)", () => {
    const src = readFileSync(
      join(root, "components/returns/customer-returns-screen.tsx"),
      "utf8"
    );
    assert.match(src, /useGetReturnRequests/);
    assert.match(src, /refetch/);
    assert.doesNotMatch(src, /fetchReturnRequests/);
    assert.doesNotMatch(src, /loadRequests/);
    assert.doesNotMatch(src, /useEffect\(/);
  });

  it("registry includes getReturnRequests", () => {
    const src = readFileSync(
      join(root, "lib/constants/api-registry.ts"),
      "utf8"
    );
    assert.match(src, /getReturnRequests:\s*"getReturnRequests"/);
  });
});
