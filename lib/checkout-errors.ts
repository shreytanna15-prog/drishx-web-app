/**
 * Map checkout / place-order API errors to customer-facing copy (Phase D/G).
 */

export function mapCheckoutErrorMessage(error: unknown): string {
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
  if (
    upper.includes("CREDIT_SUSPENDED") ||
    /credit suspended/i.test(message)
  ) {
    return "Credit is suspended on your account. Contact support or clear dues.";
  }
  if (
    upper.includes("CREDIT_LIMIT") ||
    /credit limit/i.test(message) ||
    /exceed/i.test(message)
  ) {
    return message;
  }
  if (upper.includes("ACCOUNT_CLOSED") || /closed/i.test(message)) {
    return "This account has been closed.";
  }
  return message;
}
