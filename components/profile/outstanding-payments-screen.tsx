"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ProfileSubpageHeader } from "@/components/profile/profile-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInvoiceAmount } from "@/lib/invoices-api";
import { useGetOutstandingReceivables } from "@/lib/modules/finance/query/use-get-outstanding-receivables";
import { useSubmitPaymentClaim } from "@/lib/modules/finance/mutation/use-submit-payment-claim";

export function OutstandingPaymentsScreen() {
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const {
    data,
    loading,
    error: loadError,
    refetch,
  } = useGetOutstandingReceivables();

  const {
    mutate: submitClaim,
    pending: submitting,
    error: claimError,
  } = useSubmitPaymentClaim({
    onSuccess: () => {
      setMessage("Payment claim submitted. Admin will confirm shortly.");
      setAmount("");
      setReference("");
      setSelected([]);
      void refetch();
    },
  });

  const error = claimError?.message || loadError?.message || "";

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    void submitClaim({
      amount: Number(amount),
      mode: "UPI",
      reference,
      invoiceIds: selected.length ? selected : undefined,
    });
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <ProfileSubpageHeader title="Outstanding / Payments" backHref="/profile" />
      {error ? (
        <p className="mb-4 text-sm text-[var(--brand-danger)]">
          {error}
          {loadError ? (
            <>
              {" "}
              <button
                type="button"
                className="underline"
                onClick={() => void refetch()}
              >
                Retry
              </button>
            </>
          ) : null}
        </p>
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
            onSubmit={onSubmit}
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
