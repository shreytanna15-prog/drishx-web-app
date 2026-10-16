"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ProfileSubpageHeader } from "@/components/profile/profile-screen";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatInvoiceAmount,
  formatInvoiceLensDetails,
  presentInvoiceTaxDocument,
} from "@/lib/invoices-api";
import { useDownloadInvoicePdf } from "@/lib/modules/invoices/mutation/use-download-invoice-pdf";
import { useGetInvoice } from "@/lib/modules/invoices/query/use-get-invoice";
import { cn } from "@/lib/utils";

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 border-b border-(--brand-card-border) py-3 last:border-b-0 sm:grid-cols-[minmax(0,9rem)_1fr] sm:gap-4">
      <dt className="text-xs font-bold uppercase tracking-wider text-(--brand-label)">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-(--brand-text)">{value}</dd>
    </div>
  );
}

export function InvoiceDetailScreen() {
  const params = useParams<{ id: string }>();
  const invoiceId = typeof params.id === "string" ? params.id : params.id?.[0];

  const { data, loading, error, refetch } = useGetInvoice(invoiceId, {
    enabled: Boolean(invoiceId),
  });
  const {
    mutate: downloadTaxInvoice,
    pending: downloading,
    error: downloadError,
  } = useDownloadInvoicePdf();

  // Drop prior invoice while id changes so we never render stale details.
  const invoice = data?.id === invoiceId ? data : undefined;
  const missingId = !invoiceId;
  const showLoading = Boolean(invoiceId) && (loading || (!invoice && !error));

  async function handleDownloadTaxInvoice() {
    if (!invoice || downloading) return;

    // Open blank tab synchronously so popup blockers allow the later blob URL.
    const popup =
      typeof window !== "undefined"
        ? window.open("about:blank", "_blank")
        : null;

    const taxDocument = await downloadTaxInvoice({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    });

    if (!taxDocument) {
      try {
        popup?.close();
      } catch {
        // ignore
      }
      return;
    }

    presentInvoiceTaxDocument(taxDocument, popup);
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <ProfileSubpageHeader
        title="Invoice Details"
        backHref="/profile/invoices"
      />

      {missingId ? (
        <div className="rounded-2xl border border-(--brand-danger-border) bg-(--brand-danger-bg) px-4 py-8 text-center">
          <p className="text-sm font-medium text-(--brand-danger)">
            Missing invoice id.
          </p>
        </div>
      ) : showLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-(--brand-danger-border) bg-(--brand-danger-bg) px-4 py-8 text-center">
          <p className="text-sm font-medium text-(--brand-danger)">
            {error.message}
          </p>
          <Button
            className="mt-4 rounded-xl"
            onClick={() => {
              void refetch();
            }}
          >
            Retry
          </Button>
        </div>
      ) : invoice ? (
        <div className="space-y-4">
          <section className="rounded-2xl border border-(--brand-card-border) bg-(--brand-card) p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-(--brand-text-muted)">
                  Drishx
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-(--brand-text)">
                  {invoice.invoiceNumber}
                </h2>
              </div>
              <span
                className={cn(
                  "inline-flex w-fit rounded-lg px-3 py-1.5 text-xs font-bold",
                  invoice.status === "PAID"
                    ? "bg-(--brand-success-bg) text-(--brand-success)"
                    : "bg-[color-mix(in_srgb,var(--brand-primary)_18%,transparent)] text-(--brand-primary)"
                )}
              >
                {invoice.status === "PAID"
                  ? "Paid"
                  : invoice.status === "PARTIALLY_PAID"
                    ? "Partially paid"
                    : "Unpaid"}
              </span>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-(--brand-primary)">
              ₹{formatInvoiceAmount(invoice.amount)}
            </p>
            {invoice.amountOutstanding != null ? (
              <p className="mt-1 text-sm text-(--brand-text-muted)">
                Outstanding ₹{formatInvoiceAmount(invoice.amountOutstanding)}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-(--brand-text-muted)">
              Issued{" "}
              {new Date(invoice.issuedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="rounded-xl"
                variant="outline"
                disabled={downloading}
                aria-busy={downloading}
                onClick={() => {
                  void handleDownloadTaxInvoice();
                }}
              >
                {downloading ? "Opening tax invoice…" : "Download tax invoice"}
              </Button>
              {invoice.orderId ? (
                <Button asChild className="rounded-xl">
                  <Link href={`/my-orders/${encodeURIComponent(invoice.orderId)}`}>
                    Return / Replacement
                  </Link>
                </Button>
              ) : null}
            </div>
            {downloadError ? (
              <p
                className="mt-2 text-sm font-medium text-(--brand-danger)"
                role="alert"
              >
                {downloadError.message}
              </p>
            ) : null}
          </section>

          {(invoice.taxableAmount != null ||
            (invoice.lines && invoice.lines.length > 0)) && (
            <section className="rounded-2xl border border-(--brand-card-border) bg-(--brand-card) px-5 sm:px-6">
              <h3 className="py-4 text-sm font-extrabold uppercase tracking-wider text-(--brand-text-muted)">
                Tax breakup
              </h3>
              <dl>
                <DetailBlock
                  label="Taxable"
                  value={`₹${formatInvoiceAmount(invoice.taxableAmount ?? 0)}`}
                />
                <DetailBlock
                  label="CGST"
                  value={`₹${formatInvoiceAmount(invoice.cgstAmount ?? 0)}`}
                />
                <DetailBlock
                  label="SGST"
                  value={`₹${formatInvoiceAmount(invoice.sgstAmount ?? 0)}`}
                />
                <DetailBlock
                  label="IGST"
                  value={`₹${formatInvoiceAmount(invoice.igstAmount ?? 0)}`}
                />
              </dl>
            </section>
          )}

          <section className="rounded-2xl border border-(--brand-card-border) bg-(--brand-card) px-5 sm:px-6">
            <h3 className="py-4 text-sm font-extrabold uppercase tracking-wider text-(--brand-text-muted)">
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
              <DetailBlock
                label="Address"
                value={invoice.user?.businessAddress?.trim() || "—"}
              />
            </dl>
          </section>

          <section className="rounded-2xl border border-(--brand-card-border) bg-(--brand-card) px-5 sm:px-6">
            <h3 className="py-4 text-sm font-extrabold uppercase tracking-wider text-(--brand-text-muted)">
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
                value={formatInvoiceLensDetails(invoice)}
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
            className="w-full rounded-xl border-(--brand-input-border)"
          >
            <Link href="/profile/invoices">Back to invoices</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
