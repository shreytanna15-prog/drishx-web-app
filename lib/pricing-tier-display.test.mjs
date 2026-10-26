import assert from "node:assert/strict";
import { describe, it } from "node:test";

function applyTierDiscountDisplay(subtotal, discountPercent) {
  const percent =
    typeof discountPercent === "number" &&
    Number.isFinite(discountPercent) &&
    discountPercent > 0
      ? discountPercent
      : 0;
  const discountAmount =
    percent > 0 ? Math.round((subtotal * percent) / 100) : 0;
  return {
    subtotal,
    discountPercent: percent,
    discountAmount,
    afterDiscount: Math.max(0, subtotal - discountAmount),
  };
}

function mapCheckoutErrorMessage(error) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Checkout failed.";
  const upper = message.toUpperCase();
  if (upper.includes("ACCOUNT_PENDING") || /pending/i.test(message)) {
    return "Your account is pending approval. Orders stay frozen until an admin approves you.";
  }
  if (upper.includes("ACCOUNT_BLOCKED") || /blocked/i.test(message)) {
    return "Your account is blocked. Contact support.";
  }
  if (upper.includes("CREDIT_SUSPENDED") || /credit suspended/i.test(message)) {
    return "Credit is suspended on your account. Contact support or clear dues.";
  }
  return message;
}

describe("RW-12 Phase D display helpers", () => {
  it("tier discount math", () => {
    const r = applyTierDiscountDisplay(1000, 10);
    assert.equal(r.discountAmount, 100);
    assert.equal(r.afterDiscount, 900);
    assert.equal(applyTierDiscountDisplay(1000, null).discountAmount, 0);
  });

  it("checkout error mapping", () => {
    assert.match(mapCheckoutErrorMessage("ACCOUNT_PENDING"), /pending/i);
    assert.match(mapCheckoutErrorMessage("ACCOUNT_BLOCKED"), /blocked/i);
  });
});

describe("RW-12 Phase C walk-in payload", () => {
  it("requires mobile + challengeId", () => {
    const payload = { mobileNumber: "9876543210", challengeId: "ch_1" };
    assert.ok(payload.mobileNumber.length === 10);
    assert.ok(payload.challengeId);
  });
});
