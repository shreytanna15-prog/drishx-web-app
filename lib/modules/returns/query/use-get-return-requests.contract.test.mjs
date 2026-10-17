/**
 * Phase C/D — website returns list uses paginated useGetReturnRequests + load-more.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("useGetReturnRequests contract", () => {
  it("feature hook wraps fetchReturnRequests via useApiQuery with params", () => {
    const src = readFileSync(
      join(root, "lib/modules/returns/query/use-get-return-requests.ts"),
      "utf8"
    );
    assert.match(src, /QUERY_REGISTRY\.getReturnRequests/);
    assert.match(src, /useApiQuery/);
    assert.match(src, /fetchReturnRequests\(params\)/);
    assert.doesNotMatch(src, /authFetch\(/);
  });

  it("customer-returns-screen uses paginated useGetReturnRequests + usePaginatedListState", () => {
    const src = readFileSync(
      join(root, "components/returns/customer-returns-screen.tsx"),
      "utf8"
    );
    assert.match(src, /useGetReturnRequests/);
    assert.match(src, /usePaginatedListState/);
    assert.match(src, /onPageSuccess|onSuccess:\s*onPageSuccess/);
    assert.match(src, /refetch/);
    assert.doesNotMatch(src, /(?<![A-Za-z])fetchReturnRequests\s*\(/);
    assert.doesNotMatch(src, /loadRequests/);
  });

  it("registry includes getReturnRequests", () => {
    const src = readFileSync(
      join(root, "lib/constants/api-registry.ts"),
      "utf8"
    );
    assert.match(src, /getReturnRequests:\s*"getReturnRequests"/);
  });
});
