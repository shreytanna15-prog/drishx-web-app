"use client";

import { ChevronDown, ChevronLeft, Loader2, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  QueryEmptyState,
  QueryErrorState,
  QueryLoadMoreButton,
} from "@/components/query-list-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_INVOICE_SORT,
  filterAndSortInvoices,
  formatInvoiceAmount,
  invoiceDateFilterToRange,
  INVOICE_DATE_FILTERS,
  INVOICE_SORT_OPTIONS,
  INVOICE_STATUS_FILTERS,
  type InvoiceDateFilter,
  type InvoiceRecord,
  type InvoiceSortOption,
  type InvoiceStatusFilter,
} from "@/lib/invoices-api";
import { usePaginatedListState } from "@/lib/hooks/use-paginated-list-state";
import { useGetInvoices } from "@/lib/modules/invoices/query/use-get-invoices";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

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

function chipClass(active: boolean) {
  return cn(
    "rounded-xl border px-3 py-2 text-sm font-bold transition-colors",
    active
      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]"
      : "border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
  );
}

export function InvoicesScreen() {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("ALL");
  const [dateFilter, setDateFilter] = useState<InvoiceDateFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [sort, setSort] = useState<InvoiceSortOption>(DEFAULT_INVOICE_SORT);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchQuery.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  // Server accepts concrete InvoiceStatus; legacy UNPAID is client-filtered.
  const serverStatus =
    statusFilter === "ALL" || statusFilter === "UNPAID"
      ? undefined
      : statusFilter;
  const dateRange = invoiceDateFilterToRange(dateFilter);

  const listResetKey = `${statusFilter}|${dateFilter}|${debouncedQ}`;
  const { page, setPage, items, onPageSuccess } =
    usePaginatedListState<InvoiceRecord>(listResetKey);

  const { data, loading, refreshing, error, refetch } = useGetInvoices(
    {
      page,
      limit: PAGE_SIZE,
      status: serverStatus,
      q: debouncedQ || undefined,
      dateFrom: dateRange.dateFrom,
      dateTo: dateRange.dateTo,
    },
    { onSuccess: onPageSuccess }
  );

  // Sort (+ legacy UNPAID) remain client-side on pages loaded so far.
  // Date range is applied server-side via dateFrom/dateTo.
  const filtered = useMemo(
    () =>
      filterAndSortInvoices(items, {
        status: statusFilter === "UNPAID" ? "UNPAID" : "ALL",
        date: "ALL",
        search: "",
        sort,
      }),
    [items, statusFilter, sort]
  );

  const filtersActive =
    statusFilter !== "ALL" ||
    dateFilter !== "ALL" ||
    searchQuery.trim().length > 0;
  const emptyMessage =
    items.length === 0
      ? "No invoices found."
      : filtersActive
        ? "No invoices match these filters."
        : "No invoices found.";

  const showInitialLoading = loading && page === 1 && items.length === 0;
  const hasMore = Boolean(data?.hasMore);

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
            setPage(1);
            void refetch();
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

      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--brand-text-muted)]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice number, amount…"
            className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] pl-10"
          />
        </div>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as InvoiceSortOption)}
            aria-label="Sort invoices"
            className="h-11 w-full appearance-none rounded-xl border border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] px-3 pr-10 text-sm font-semibold text-[var(--brand-text)] outline-none"
          >
            {INVOICE_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[var(--brand-text-muted)]" />
        </div>

        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Filter by payment status">
          {INVOICE_STATUS_FILTERS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => setStatusFilter(entry.key)}
              className={chipClass(statusFilter === entry.key)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by date">
          {INVOICE_DATE_FILTERS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => setDateFilter(entry.key)}
              className={chipClass(dateFilter === entry.key)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {!showInitialLoading && !error ? (
          <p className="text-xs font-semibold text-[var(--brand-text-muted)]">
            {filtered.length} invoice{filtered.length === 1 ? "" : "s"}
            {hasMore ? " (load more for older)" : ""}
          </p>
        ) : null}
      </div>

      {showInitialLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : error ? (
        <QueryErrorState
          message={error.message}
          onRetry={() => {
            setPage(1);
            void refetch();
          }}
        />
      ) : filtered.length === 0 ? (
        <QueryEmptyState message={emptyMessage} />
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
          <QueryLoadMoreButton
            hasMore={hasMore}
            loading={loading || refreshing}
            onLoadMore={() => setPage((p) => p + 1)}
          />
        </div>
      )}
    </div>
  );
}
