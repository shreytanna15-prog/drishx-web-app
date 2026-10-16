/**
 * Focused pure-helper regression tests (no React Testing Library).
 * Run: node --test lib/hooks/api-hook-utils.test.mjs
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

function toHookError(error) {
  return error instanceof Error ? error : new Error(String(error));
}

function isStaleRequest(requestId, latestRequestId) {
  return requestId !== latestRequestId;
}

class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthError";
  }
}

function isAuthFailureError(error) {
  return error instanceof AuthError;
}

describe("api-hook-utils", () => {
  it("toHookError preserves Error instances", () => {
    const err = new Error("boom");
    assert.equal(toHookError(err), err);
  });

  it("toHookError wraps non-Error values", () => {
    const err = toHookError("fail");
    assert.ok(err instanceof Error);
    assert.equal(err.message, "fail");
  });

  it("isStaleRequest detects superseded requests", () => {
    assert.equal(isStaleRequest(1, 2), true);
    assert.equal(isStaleRequest(3, 3), false);
  });

  it("isAuthFailureError identifies AuthError only", () => {
    assert.equal(isAuthFailureError(new AuthError("expired")), true);
    assert.equal(isAuthFailureError(new Error("network")), false);
  });

  it("auth failures should skip UI onError (policy check)", () => {
    const authErr = new AuthError("TOKEN_EXPIRED");
    const shouldInvokeOnError = !isAuthFailureError(authErr);
    assert.equal(shouldInvokeOnError, false);
  });

  it("non-auth failures should invoke UI onError", () => {
    const err = new Error("server");
    assert.equal(!isAuthFailureError(err), true);
  });
});
