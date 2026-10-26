/**
 * Client-side display of pricing-tier discount (applied server-side before GST).
 */

export type TierDiscountBreakdown = {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  afterDiscount: number;
};

export function applyTierDiscountDisplay(
  subtotal: number,
  discountPercent: number | null | undefined
): TierDiscountBreakdown {
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
