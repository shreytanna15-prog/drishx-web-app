"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ProfileSubpageHeader } from "@/components/profile/profile-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { authFetch } from "@/lib/auth-fetch";
import { formatInvoiceAmount } from "@/lib/invoices-api";

type OutstandingPayload = {
  outstanding: number;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    amountOutstanding: number | string;
    status: string;
  }>;
};

export function OutstandingPaymentsScreen() {
  const [data, setData] = useState<OutstandingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/finance/receivables", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load.");
      setData(json);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitClaim(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const res = await authFetch("/api/finance/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "claim",
          amount: Number(amount),
          mode: "UPI",
          reference,
          invoiceIds: selected.length ? selected : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Claim failed.");
      setMessage("Payment claim submitted. Admin will confirm shortly.");
      setAmount("");
      setReference("");
      setSelected([]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <ProfileSubpageHeader title="Outstanding / Payments" backHref="/profile" />
      {error ? (
        <p className="mb-4 text-sm text-[var(--brand-danger)]">{error}</p>
      ) : null}
      {loading || !data ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5">
            <p className="text-xs uppercase text-[var(--brand-label)]">
              Total outstanding
            </p>
            <p className="mt-2 text-3xl font-extrabold text-[var(--brand-primary)]">
              ₹{formatInvoiceAmount(data.outstanding)}
            </p>
          </section>
          <section className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5">
            <h3 className="mb-3 text-sm font-bold">Open invoices</h3>
            <ul className="space-y-2">
              {data.invoices.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(inv.id)}
                      onChange={(e) => {
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, inv.id]
                            : prev.filter((x) => x !== inv.id)
                        );
                      }}
                    />
                    <Link
                      href={`/profile/invoices/${inv.id}`}
                      className="font-semibold text-[var(--brand-primary)]"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </label>
                  <span>₹{formatInvoiceAmount(inv.amountOutstanding)}</span>
                </li>
              ))}
              {data.invoices.length === 0 ? (
                <li className="text-[var(--brand-text-muted)]">No outstanding invoices.</li>
              ) : null}
            </ul>
          </section>
          <form
            onSubmit={submitClaim}
            className="space-y-3 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5"
          >
            <h3 className="text-sm font-bold">Submit payment claim</h3>
            <Input
              placeholder="Amount paid"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Input
              placeholder="UTR / reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
            <Button type="submit" disabled={submitting} className="w-full rounded-xl">
              {submitting ? "Submitting…" : "Submit claim"}
            </Button>
            {message ? (
              <p className="text-sm text-[var(--brand-success)]">{message}</p>
            ) : null}
          </form>
        </div>
      )}
    </div>
  );
}
