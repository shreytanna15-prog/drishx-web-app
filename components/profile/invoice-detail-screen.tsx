"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ProfileSubpageHeader } from "@/components/profile/profile-screen";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import {
  fetchInvoiceById,
  formatInvoiceAmount,
  formatLensOrderDetails,
  type InvoiceRecord,
} from "@/lib/invoices-api";
import { cn } from "@/lib/utils";

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 border-b border-[var(--brand-card-border)] py-3 last:border-b-0 sm:grid-cols-[minmax(0,9rem)_1fr] sm:gap-4">
      <dt className="text-xs font-bold uppercase tracking-wider text-[var(--brand-label)]">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-[var(--brand-text)]">{value}</dd>
    </div>
  );
}

export function InvoiceDetailScreen() {
  const params = useParams<{ id: string }>();
  const invoiceId = params.id;
  const { token } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoice = useCallback(async () => {
    if (!invoiceId) {
      setError("Missing invoice id.");
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await fetchInvoiceById(invoiceId, token);
      setInvoice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoice.");
    } finally {
      setLoading(false);
    }
  }, [invoiceId, token]);

  useEffect(() => {
    void loadInvoice();
  }, [loadInvoice]);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <ProfileSubpageHeader
        title="Invoice Details"
        backHref="/profile/invoices"
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[var(--brand-danger-border)] bg-[var(--brand-danger-bg)] px-4 py-8 text-center">
          <p className="text-sm font-medium text-[var(--brand-danger)]">
            {error}
          </p>
          <Button className="mt-4 rounded-xl" onClick={() => void loadInvoice()}>
            Retry
          </Button>
        </div>
      ) : invoice ? (
        <div className="space-y-4">
          <section className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--brand-text-muted)]">
                  Drishx
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-[var(--brand-text)]">
                  {invoice.invoiceNumber}
                </h2>
              </div>
              <span
                className={cn(
                  "inline-flex w-fit rounded-lg px-3 py-1.5 text-xs font-bold",
                  invoice.status === "PAID"
                    ? "bg-[var(--brand-success-bg)] text-[var(--brand-success)]"
                    : "bg-[color-mix(in_srgb,var(--brand-primary)_18%,transparent)] text-[var(--brand-primary)]"
                )}
              >
                {invoice.status === "PAID" ? "Paid" : "Unpaid"}
              </span>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-[var(--brand-primary)]">
              ₹{formatInvoiceAmount(invoice.amount)}
            </p>
            <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
              Issued{" "}
              {new Date(invoice.issuedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </section>

          <section className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-5 sm:px-6">
            <h3 className="py-4 text-sm font-extrabold uppercase tracking-wider text-[var(--brand-text-muted)]">
              Customer
            </h3>
            <dl>
              <DetailBlock
                label="Name"
                value={invoice.user?.name?.trim() || invoice.user?.email || "—"}
              />
              <DetailBlock label="Email" value={invoice.user?.email || "—"} />
              <DetailBlock
                label="Business"
                value={invoice.user?.businessName?.trim() || "—"}
              />
              <DetailBlock
                label="GST"
                value={invoice.user?.gstNumber?.trim() || "—"}
              />
            </dl>
          </section>

          <section className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-5 sm:px-6">
            <h3 className="py-4 text-sm font-extrabold uppercase tracking-wider text-[var(--brand-text-muted)]">
              Order
            </h3>
            <dl>
              <DetailBlock
                label="Lens type"
                value={invoice.order?.lensType || "—"}
              />
              <DetailBlock
                label="Quantity"
                value={invoice.order ? String(invoice.order.quantity) : "—"}
              />
              <DetailBlock
                label="Lens details"
                value={formatLensOrderDetails(invoice.order)}
              />
              <DetailBlock
                label="Order total"
                value={
                  invoice.order
                    ? `₹${formatInvoiceAmount(invoice.order.totalAmount)}`
                    : "—"
                }
              />
            </dl>
          </section>

          <Button
            asChild
            variant="outline"
            className="w-full rounded-xl border-[var(--brand-input-border)]"
          >
            <Link href="/profile/invoices">Back to invoices</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
