import { getStoredToken } from "@/lib/auth-storage";

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

function authHeaders(token?: string | null): Record<string, string> {
  const resolved = token ?? getStoredToken();
  if (!resolved) {
    throw new Error("Not authenticated");
  }
  return { Authorization: `Bearer ${resolved}` };
}

export async function fetchInvoices(
  token?: string | null
): Promise<InvoiceRecord[]> {
  const response = await fetch("/api/invoices", {
    headers: authHeaders(token),
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
  token?: string | null
): Promise<InvoiceRecord> {
  const response = await fetch(`/api/invoices/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
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
