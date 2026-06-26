"use client";

import { ChevronLeft, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import {
  fetchInvoices,
  formatInvoiceAmount,
  type InvoiceRecord,
} from "@/lib/invoices-api";
import { cn } from "@/lib/utils";

type InvoiceFilter = "ALL" | "PAID" | "UNPAID";

const FILTERS: { key: InvoiceFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PAID", label: "Paid" },
  { key: "UNPAID", label: "Unpaid" },
];

function InvoiceStatusBadge({ status }: { status: string }) {
  const paid = status === "PAID";
  return (
    <span
      className={cn(
        "rounded-lg px-2.5 py-1 text-xs font-bold",
        paid
          ? "bg-[var(--brand-success-bg)] text-[var(--brand-success)]"
          : "bg-[color-mix(in_srgb,var(--brand-primary)_18%,transparent)] text-[var(--brand-primary)]"
      )}
    >
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}

function InvoiceCard({ invoice }: { invoice: InvoiceRecord }) {
  const issuedDate = new Date(invoice.issuedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/profile/invoices/${invoice.id}`}
      className={cn(
        "block rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 transition-colors",
        "hover:border-[var(--brand-primary)]/45 hover:bg-[var(--brand-primary)]/5 sm:p-5"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold text-[var(--brand-text)] sm:text-lg">
            {invoice.invoiceNumber}
          </p>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
            Issued {issuedDate}
          </p>
        </div>
        <div className="flex items-center gap-3 sm:shrink-0">
          <p className="text-lg font-extrabold text-[var(--brand-text)]">
            ₹{formatInvoiceAmount(invoice.amount)}
          </p>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
      </div>
    </Link>
  );
}

export function InvoicesScreen() {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<InvoiceFilter>("ALL");

  const loadInvoices = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchInvoices(token);
      setInvoices(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load invoices."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const filtered = useMemo(() => {
    if (filter === "ALL") {
      return invoices;
    }
    return invoices.filter((invoice) => invoice.status === filter);
  }, [filter, invoices]);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-[var(--brand-card-border)] pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="size-9 shrink-0 rounded-xl border-[var(--brand-input-border)]"
            asChild
          >
            <Link href="/profile" aria-label="Back to profile">
              <ChevronLeft className="size-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-extrabold text-[var(--brand-text)] sm:text-3xl">
            Invoices
          </h1>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-xl border-[var(--brand-input-border)]"
          onClick={() => {
            setRefreshing(true);
            void loadInvoices();
          }}
          disabled={loading || refreshing}
          aria-label="Refresh invoices"
        >
          {refreshing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
        </Button>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        {FILTERS.map((entry) => {
          const active = filter === entry.key;
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => setFilter(entry.key)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors",
                active
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]"
                  : "border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
              )}
            >
              {entry.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[var(--brand-danger-border)] bg-[var(--brand-danger-bg)] px-4 py-8 text-center">
          <p className="text-sm font-medium text-[var(--brand-danger)]">
            {error}
          </p>
          <Button
            className="mt-4 rounded-xl"
            onClick={() => {
              setLoading(true);
              void loadInvoices();
            }}
          >
            Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-16 text-center">
          <p className="text-sm font-medium text-[var(--brand-text-muted)]">
            No invoices found.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </div>
      )}
    </div>
  );
}
