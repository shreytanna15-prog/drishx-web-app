import { authFetch } from "@/lib/auth-fetch";

export type InvoiceUser = {
  id: string;
  name: string | null;
  email: string;
  gstNumber?: string | null;
  businessName?: string | null;
  businessAddress?: string | null;
  state?: string | null;
  pincode?: string | null;
};

export type InvoiceOrder = {
  id: string;
  lensType: string;
  quantity: number;
  unitPrice: number | string;
  totalAmount: number | string;
  status: string;
  createdAt: string;
  singleVisionLens?: {
    sph: number | string;
    cyl: number | string | null;
  } | null;
  kryptokLens?: {
    sph: number | string;
    cyl: number | string | null;
    axis: number | null;
    add: number | string;
  } | null;
  progressiveLens?: {
    sph: number | string;
    cyl: number | string | null;
    axis: number | null;
    add: number | string;
    eye: string;
  } | null;
};

export type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  userId: string;
  orderId: string;
  amount: number | string;
  status: "PAID" | "UNPAID" | string;
  issuedAt: string;
  createdAt: string;
  updatedAt?: string;
  user?: InvoiceUser;
  order?: InvoiceOrder;
};


export async function fetchInvoices(
  _token?: string | null
): Promise<InvoiceRecord[]> {
  const response = await authFetch("/api/invoices", {
    cache: "no-store",
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result?.error || "Failed to load invoices.");
  }
  return response.json() as Promise<InvoiceRecord[]>;
}

export async function fetchInvoiceById(
  id: string,
  _token?: string | null
): Promise<InvoiceRecord> {
  const response = await authFetch(`/api/invoices/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error || "Failed to load invoice.");
  }
  return result as InvoiceRecord;
}

export function formatInvoiceAmount(value: number | string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return "0";
  }
  return num.toLocaleString("en-IN");
}

export function formatLensOrderDetails(order: InvoiceOrder | undefined): string {
  if (!order) {
    return "—";
  }
  if (order.progressiveLens) {
    const lens = order.progressiveLens;
    return `SPH ${lens.sph}, CYL ${lens.cyl ?? "—"}, ADD ${lens.add}, Eye ${lens.eye}`;
  }
  if (order.kryptokLens) {
    const lens = order.kryptokLens;
    return `SPH ${lens.sph}, CYL ${lens.cyl ?? "—"}, ADD ${lens.add}`;
  }
  if (order.singleVisionLens) {
    const lens = order.singleVisionLens;
    return `SPH ${lens.sph}, CYL ${lens.cyl ?? "—"}`;
  }
  return order.lensType;
}

export type InvoiceStatusFilter = "ALL" | "PAID" | "UNPAID";
export type InvoiceDateFilter =
  | "ALL"
  | "THIS_MONTH"
  | "LAST_30"
  | "LAST_90"
  | "THIS_YEAR";
export type InvoiceSortOption =
  | "newest"
  | "oldest"
  | "amount_desc"
  | "amount_asc";

export const INVOICE_STATUS_FILTERS: {
  key: InvoiceStatusFilter;
  label: string;
}[] = [
  { key: "ALL", label: "All" },
  { key: "PAID", label: "Paid" },
  { key: "UNPAID", label: "Unpaid" },
];

export const INVOICE_DATE_FILTERS: { key: InvoiceDateFilter; label: string }[] =
  [
    { key: "ALL", label: "All dates" },
    { key: "THIS_MONTH", label: "This month" },
    { key: "LAST_30", label: "Last 30 days" },
    { key: "LAST_90", label: "Last 3 months" },
    { key: "THIS_YEAR", label: "This year" },
  ];

export const INVOICE_SORT_OPTIONS: {
  value: InvoiceSortOption;
  label: string;
}[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount_desc", label: "Amount: High → Low" },
  { value: "amount_asc", label: "Amount: Low → High" },
];

export const DEFAULT_INVOICE_SORT: InvoiceSortOption = "newest";

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function matchesInvoiceDateFilter(
  issuedAt: string,
  filter: InvoiceDateFilter,
  now = new Date()
): boolean {
  if (filter === "ALL") return true;
  const issued = new Date(issuedAt);
  if (Number.isNaN(issued.getTime())) return false;

  if (filter === "THIS_MONTH") {
    return (
      issued.getFullYear() === now.getFullYear() &&
      issued.getMonth() === now.getMonth()
    );
  }
  if (filter === "THIS_YEAR") {
    return issued.getFullYear() === now.getFullYear();
  }

  const from = startOfLocalDay(now);
  from.setDate(from.getDate() - (filter === "LAST_30" ? 29 : 89));
  return issued >= from;
}

export function matchesInvoiceSearch(
  invoice: InvoiceRecord,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const amount = Number(invoice.amount);
  const amountRaw = Number.isFinite(amount) ? String(amount) : "";
  const amountFormatted = Number.isFinite(amount)
    ? amount.toLocaleString("en-IN")
    : "";
  return [invoice.invoiceNumber, amountRaw, amountFormatted, invoice.order?.lensType]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export function filterAndSortInvoices(
  invoices: InvoiceRecord[],
  options: {
    status: InvoiceStatusFilter;
    date: InvoiceDateFilter;
    search: string;
    sort: InvoiceSortOption;
  }
): InvoiceRecord[] {
  const filtered = invoices.filter((invoice) => {
    if (options.status !== "ALL" && invoice.status !== options.status) {
      return false;
    }
    if (!matchesInvoiceDateFilter(invoice.issuedAt, options.date)) {
      return false;
    }
    return matchesInvoiceSearch(invoice, options.search);
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (options.sort === "newest" || options.sort === "oldest") {
      const delta =
        new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      return options.sort === "newest" ? delta : -delta;
    }
    const amountDelta = (Number(b.amount) || 0) - (Number(a.amount) || 0);
    return options.sort === "amount_desc" ? amountDelta : -amountDelta;
  });
  return sorted;
}
