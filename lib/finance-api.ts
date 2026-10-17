import { authFetch } from "@/lib/auth-fetch";

export type OutstandingReceivables = {
  outstanding: number;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    amountOutstanding: number | string;
    status: string;
  }>;
};

export type SubmitPaymentClaimPayload = {
  amount: number;
  mode?: string;
  reference?: string;
  invoiceIds?: string[];
};

/** GET /api/finance/receivables — pure api (no React). */
export async function fetchOutstandingReceivables(): Promise<OutstandingReceivables> {
  const res = await authFetch("/api/finance/receivables", { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof json?.error === "string" ? json.error : "Failed to load."
    );
  }
  return json as OutstandingReceivables;
}

/** POST /api/finance/payments (action: claim) — pure api (no React). */
export async function submitPaymentClaim(
  payload: SubmitPaymentClaimPayload
): Promise<unknown> {
  const res = await authFetch("/api/finance/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "claim",
      amount: payload.amount,
      mode: payload.mode ?? "UPI",
      reference: payload.reference,
      invoiceIds: payload.invoiceIds,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof json?.error === "string" ? json.error : "Claim failed."
    );
  }
  return json;
}
