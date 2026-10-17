import { authFetch } from "@/lib/auth-fetch";
import type { Paginated } from "@/lib/types/api-client";

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
  /** Customer-selected prescription at checkout (not catalog defaults). */
  sph?: number | string | null;
  cyl?: number | string | null;
  axis?: number | null;
  add?: number | string | null;
  eye?: string | null;
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

export type InvoiceLine = {
  id: string;
  description: string;
  powerLabel?: string | null;
  hsnCode?: string | null;
  quantity: number | string;
  unitPrice: number | string;
  gstRatePercent: number | string;
  taxableAmount: number | string;
  cgstAmount?: number | string;
  sgstAmount?: number | string;
  igstAmount?: number | string;
  lineTotal: number | string;
};

export type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  userId: string;
  orderId: string;
  amount: number | string;
  amountPaid?: number | string;
  amountOutstanding?: number | string;
  taxableAmount?: number | string;
  cgstAmount?: number | string;
  sgstAmount?: number | string;
  igstAmount?: number | string;
  status: "PAID" | "UNPAID" | "ISSUED" | "PARTIALLY_PAID" | string;
  issuedAt: string;
  createdAt: string;
  updatedAt?: string;
  user?: InvoiceUser;
  order?: InvoiceOrder;
  lines?: InvoiceLine[];
};


export type ListInvoicesParams = {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type PaginatedInvoices = Paginated<InvoiceRecord>;

export function buildInvoicesQueryString(params?: ListInvoicesParams): string {
  const qs = new URLSearchParams();
  if (!params) return "";
  if (params.page != null) qs.set("page", String(params.page));
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.status?.trim()) qs.set("status", params.status.trim());
  if (params.q?.trim()) qs.set("q", params.q.trim());
  if (params.dateFrom?.trim()) qs.set("dateFrom", params.dateFrom.trim());
  if (params.dateTo?.trim()) qs.set("dateTo", params.dateTo.trim());
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function normalizeInvoicesListResponse(data: unknown): PaginatedInvoices {
  if (Array.isArray(data)) {
    return {
      items: data as InvoiceRecord[],
      page: 1,
      limit: data.length,
      hasMore: false,
      total: data.length,
    };
  }
  const body = data as Partial<PaginatedInvoices> | null;
  const items = Array.isArray(body?.items) ? body.items : [];
  return {
    items,
    page: typeof body?.page === "number" ? body.page : 1,
    limit: typeof body?.limit === "number" ? body.limit : items.length,
    hasMore: Boolean(body?.hasMore),
    total: typeof body?.total === "number" ? body.total : undefined,
  };
}

/** Paginated summary list (RW-11 Phase C). */
export async function fetchInvoices(
  params?: ListInvoicesParams
): Promise<PaginatedInvoices> {
  const response = await authFetch(
    `/api/invoices${buildInvoicesQueryString(params)}`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result?.error || "Failed to load invoices.");
  }
  return normalizeInvoicesListResponse(await response.json());
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

/** Printable tax-invoice payload from GET /api/invoices/:id/pdf (HTML, not binary PDF). */
export type InvoiceTaxDocument = {
  html: string;
  contentType: string;
  filename: string;
};

/** Same-origin BFF path — never put tokens in the URL. */
export function invoiceTaxDocumentPath(invoiceId: string): string {
  return `/api/invoices/${encodeURIComponent(invoiceId)}/pdf`;
}

export function sanitizeInvoiceTaxFilename(invoiceNumber?: string): string {
  const base = (invoiceNumber?.trim() || "tax-invoice").replace(
    /[/\\?%*:|"<>]/g,
    "-"
  );
  return /\.html?$/i.test(base) ? base : `${base}.html`;
}

export function filenameFromContentDisposition(
  header: string | null | undefined,
  fallbackInvoiceNumber?: string
): string {
  if (header) {
    const utf8Match = /filename\*=(?:UTF-8''|utf-8'')([^;]+)/i.exec(header);
    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ""));
      } catch {
        // fall through to plain filename / fallback
      }
    }
    const plainMatch = /filename="((?:\\.|[^"\\])*)"|filename=([^;]+)/i.exec(
      header
    );
    if (plainMatch) {
      const raw = (plainMatch[1] ?? plainMatch[2] ?? "").trim();
      if (raw) return raw.replace(/^"|"$/g, "");
    }
  }
  return sanitizeInvoiceTaxFilename(fallbackInvoiceNumber);
}

/**
 * Authenticated fetch of the tax invoice document (printable HTML).
 * Uses authFetch for Bearer + silent refresh. Does not open windows or show UI.
 */
export async function downloadInvoicePdf(
  invoiceId: string,
  invoiceNumber?: string
): Promise<InvoiceTaxDocument> {
  const path = invoiceTaxDocumentPath(invoiceId);
  if (path.includes("?") || /access_token|token=/i.test(path)) {
    throw new Error("Invalid tax invoice path.");
  }

  const response = await authFetch(path, { cache: "no-store" });
  if (!response.ok) {
    let message = "Failed to open tax invoice.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  const contentType =
    response.headers.get("content-type")?.split(";")[0]?.trim() ||
    "text/html";
  const html = await response.text();
  const filename = filenameFromContentDisposition(
    response.headers.get("content-disposition"),
    invoiceNumber
  );

  return { html, contentType, filename };
}

/** Default delay before revoking a blob object URL after opening/downloading. */
export const INVOICE_TAX_DOCUMENT_OBJECT_URL_REVOKE_MS = 60_000;

export function createInvoiceTaxDocumentObjectUrl(
  html: string,
  contentType: string
): string {
  const type = contentType.includes("html")
    ? contentType
    : "text/html;charset=utf-8";
  return URL.createObjectURL(new Blob([html], { type }));
}

export function revokeInvoiceTaxDocumentObjectUrl(objectUrl: string): void {
  URL.revokeObjectURL(objectUrl);
}

/**
 * Show a fetched tax document: prefer an already-opened blank tab, else download fallback.
 * Schedules object-URL cleanup; does not navigate to the authenticated API path.
 */
export function presentInvoiceTaxDocument(
  taxDocument: InvoiceTaxDocument,
  popup: Window | null,
  options?: {
    revokeAfterMs?: number;
    schedule?: typeof setTimeout;
    revoke?: (url: string) => void;
  }
): {
  objectUrl: string;
  openedInPopup: boolean;
  usedDownloadFallback: boolean;
} {
  const objectUrl = createInvoiceTaxDocumentObjectUrl(
    taxDocument.html,
    taxDocument.contentType
  );
  const schedule = options?.schedule ?? setTimeout;
  const revoke = options?.revoke ?? revokeInvoiceTaxDocumentObjectUrl;
  const revokeAfterMs =
    options?.revokeAfterMs ?? INVOICE_TAX_DOCUMENT_OBJECT_URL_REVOKE_MS;

  let openedInPopup = false;

  if (popup && !popup.closed) {
    try {
      popup.location.replace(objectUrl);
      openedInPopup = true;
    } catch {
      try {
        popup.close();
      } catch {
        // ignore
      }
    }
  }

  let usedDownloadFallback = false;
  if (!openedInPopup && typeof globalThis.document !== "undefined") {
    const anchor = globalThis.document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = taxDocument.filename;
    anchor.rel = "noreferrer";
    anchor.target = "_blank";
    globalThis.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    usedDownloadFallback = true;
  }

  schedule(() => {
    revoke(objectUrl);
  }, revokeAfterMs);

  return { objectUrl, openedInPopup, usedDownloadFallback };
}

export function formatInvoiceAmount(value: number | string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return "0";
  }
  return num.toLocaleString("en-IN");
}

function formatPrescriptionParts(parts: {
  sph?: number | string | null;
  cyl?: number | string | null;
  axis?: number | null;
  add?: number | string | null;
  eye?: string | null;
}): string | null {
  const tokens: string[] = [];
  if (parts.sph != null && parts.sph !== "") tokens.push(`SPH ${parts.sph}`);
  if (parts.cyl != null && parts.cyl !== "") tokens.push(`CYL ${parts.cyl}`);
  if (parts.axis != null) tokens.push(`AXIS ${parts.axis}`);
  if (parts.add != null && parts.add !== "") tokens.push(`ADD ${parts.add}`);
  const eye = typeof parts.eye === "string" ? parts.eye.trim() : "";
  if (eye) tokens.push(`Eye ${eye}`);
  return tokens.length ? tokens.join(", ") : null;
}

/**
 * Lens details for an order: prefer checkout prescription on the order,
 * then catalog lens defaults. Prefer {@link formatInvoiceLensDetails} for
 * issued invoices so the UI matches the tax document snapshot.
 */
export function formatLensOrderDetails(order: InvoiceOrder | undefined): string {
  if (!order) {
    return "—";
  }

  const fromOrder = formatPrescriptionParts({
    sph: order.sph,
    cyl: order.cyl,
    axis: order.axis,
    add: order.add,
    eye: order.eye,
  });
  if (fromOrder) return fromOrder;

  if (order.progressiveLens) {
    const lens = order.progressiveLens;
    return (
      formatPrescriptionParts({
        sph: lens.sph,
        cyl: lens.cyl,
        axis: lens.axis,
        add: lens.add,
        eye: lens.eye,
      }) ?? "—"
    );
  }
  if (order.kryptokLens) {
    const lens = order.kryptokLens;
    return (
      formatPrescriptionParts({
        sph: lens.sph,
        cyl: lens.cyl,
        axis: lens.axis,
        add: lens.add,
      }) ?? "—"
    );
  }
  if (order.singleVisionLens) {
    const lens = order.singleVisionLens;
    return (
      formatPrescriptionParts({
        sph: lens.sph,
        cyl: lens.cyl,
      }) ?? "—"
    );
  }
  return order.lensType || "—";
}

/**
 * FIN-01: Prefer frozen InvoiceLine.powerLabel (matches tax PDF), then order
 * prescription fields, then catalog lens defaults.
 */
export function formatInvoiceLensDetails(invoice: {
  lines?: Array<{ powerLabel?: string | null }> | null;
  order?: InvoiceOrder | null;
}): string {
  const labels = (invoice.lines ?? [])
    .map((line) => line.powerLabel?.trim())
    .filter((label): label is string => Boolean(label));
  if (labels.length === 1) return labels[0]!;
  if (labels.length > 1) return labels.join("; ");
  return formatLensOrderDetails(invoice.order ?? undefined);
}

export type InvoiceStatusFilter = "ALL" | "PAID" | "UNPAID" | "ISSUED" | "PARTIALLY_PAID";
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
  { key: "ISSUED", label: "Unpaid" },
  { key: "PARTIALLY_PAID", label: "Partial" },
  { key: "UNPAID", label: "Unpaid (legacy)" },
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

/** Map UI date presets to API dateFrom/dateTo (ISO). */
export function invoiceDateFilterToRange(
  filter: InvoiceDateFilter,
  now = new Date()
): { dateFrom?: string; dateTo?: string } {
  if (filter === "ALL") return {};
  const dateTo = now.toISOString();
  if (filter === "THIS_MONTH") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { dateFrom: from.toISOString(), dateTo };
  }
  if (filter === "THIS_YEAR") {
    const from = new Date(now.getFullYear(), 0, 1);
    return { dateFrom: from.toISOString(), dateTo };
  }
  const from = startOfLocalDay(now);
  from.setDate(from.getDate() - (filter === "LAST_30" ? 29 : 89));
  return { dateFrom: from.toISOString(), dateTo };
}

export function matchesInvoiceDateFilter(
  issuedAt: string,
  filter: InvoiceDateFilter,
  now = new Date()
): boolean {
  if (filter === "ALL") return true;
  const issued = new Date(issuedAt);
  if (Number.isNaN(issued.getTime())) return false;
  const range = invoiceDateFilterToRange(filter, now);
  if (range.dateFrom && issued < new Date(range.dateFrom)) return false;
  if (range.dateTo && issued > new Date(range.dateTo)) return false;
  return true;
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
    if (options.status !== "ALL") {
      const unpaidLike =
        options.status === "UNPAID" || options.status === "ISSUED";
      if (unpaidLike) {
        if (
          invoice.status !== "UNPAID" &&
          invoice.status !== "ISSUED" &&
          invoice.status !== "OVERDUE"
        ) {
          return false;
        }
      } else if (invoice.status !== options.status) {
        return false;
      }
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
