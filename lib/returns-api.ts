import { fetchWithRetry } from "./fetch-with-retry";
import { getAuthHeaders } from "./auth-fetch";
import type { LensType } from "./types/lens";

export type ReturnRequestType = "RETURN" | "REPLACEMENT";
export type ReturnRequestStatus =
  | "SUBMITTED"
  | "MORE_INFO_REQUIRED"
  | "ESCALATED_TO_ADMIN"
  | "AWAITING_MATERIAL"
  | "APPROVED_CREDIT"
  | "APPROVED_REPLACEMENT"
  | "REJECTED"
  | "CLOSED";

export type ReturnReason =
  | "WRONG_POWER"
  | "MANUFACTURING_DEFECT"
  | "COATING_ISSUE"
  | "BROKEN_IN_TRANSPORT"
  | "WRONG_PRODUCT"
  | "EXCESS_STOCK_RETURN"
  | "OTHER";

export type ReturnRequestRecord = {
  id: string;
  requestNumber: string;
  requestType: ReturnRequestType;
  status: ReturnRequestStatus;
  customerRemarks?: string | null;
  employeeRemarks?: string | null;
  adminRemarks?: string | null;
  rejectionReason?: string | null;
  approvedAmount?: number | null;
  replacementBatchId?: string | null;
  createdAt: string;
  updatedAt?: string;
  primaryOrderId?: string;
  primaryOrder?: {
    id: string;
    checkoutBatchId?: string | null;
  } | null;
  customer?: {
    id: string;
    name: string | null;
    email: string;
    businessName?: string | null;
  };
  items: Array<{
    id: string;
    originalOrderId: string;
    lensType: LensType | string;
    lensId?: string | null;
    lensLabel: string;
    quantity: number;
    eye?: string | null;
    reason: ReturnReason;
    itemRemarks?: string | null;
    originalSph?: number | null;
    originalCyl?: number | null;
    originalAxis?: number | null;
    originalAdd?: number | null;
    requestedSph?: number | null;
    requestedCyl?: number | null;
    requestedAxis?: number | null;
    requestedAdd?: number | null;
  }>;
  images: Array<{
    id: string;
    imageUrl: string;
    createdAt: string;
  }>;
  timelineEvents: Array<{
    id: string;
    eventType: string;
    message: string;
    createdAt: string;
  }>;
  creditNote?: {
    id: string;
    creditNoteNumber: string;
    amount: number;
  } | null;
};

export const RETURN_REASON_OPTIONS: Array<{ value: ReturnReason; label: string }> = [
  { value: "WRONG_POWER", label: "Wrong power received" },
  { value: "MANUFACTURING_DEFECT", label: "Manufacturing defect" },
  { value: "COATING_ISSUE", label: "Coating issue" },
  { value: "BROKEN_IN_TRANSPORT", label: "Broken in transport" },
  { value: "WRONG_PRODUCT", label: "Wrong product supplied" },
  { value: "EXCESS_STOCK_RETURN", label: "Excess stock return" },
  { value: "OTHER", label: "Other" },
];

export async function fetchReturnRequests(): Promise<ReturnRequestRecord[]> {
  const res = await fetchWithRetry("/api/returns", {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to load return requests.");
  return Array.isArray(data) ? (data as ReturnRequestRecord[]) : [];
}

export async function fetchReturnRequest(
  id: string
): Promise<ReturnRequestRecord> {
  const res = await fetchWithRetry(`/api/returns/${id}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to load return request.");
  return data as ReturnRequestRecord;
}

export async function updateReturnRequest(
  id: string,
  action: "more-info" | "close",
  remarks?: string
): Promise<ReturnRequestRecord> {
  const res = await fetchWithRetry(`/api/returns/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ action, remarks }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to update return request.");
  return data as ReturnRequestRecord;
}

export function formatReturnStatus(status: string) {
  const labels: Record<string, string> = {
    SUBMITTED: "Pending Admin Review",
    MORE_INFO_REQUIRED: "More Info Needed",
    ESCALATED_TO_ADMIN: "Pending Admin Review",
    AWAITING_MATERIAL: "Replacement Approved",
    APPROVED_CREDIT: "Credit Approved",
    APPROVED_REPLACEMENT: "Replacement Approved",
    REJECTED: "Rejected",
    CLOSED: "Closed",
  };
  if (labels[status]) return labels[status];
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatReturnPowerLine(parts: {
  sph?: number | null;
  cyl?: number | null;
  add?: number | null;
  axis?: number | null;
}): string {
  const format = (value: number) => {
    const rounded = Math.round(value * 100) / 100;
    if (rounded === 0) return "0.00";
    const sign = rounded > 0 ? "+" : "";
    return `${sign}${rounded.toFixed(2)}`;
  };
  const labels = [
    parts.sph != null ? `SPH ${format(parts.sph)}` : null,
    parts.cyl != null ? `CYL ${format(parts.cyl)}` : null,
    parts.add != null ? `ADD ${format(parts.add)}` : null,
    parts.axis != null ? `AXIS ${parts.axis}` : null,
  ].filter(Boolean);
  return labels.length > 0 ? labels.join(" · ") : "—";
}

export async function createReturnRequest(input: {
  requestType: ReturnRequestType;
  customerRemarks?: string;
  items: Array<{
    orderId: string;
    quantity: number;
    eye?: string | null;
    reason: ReturnReason;
    itemRemarks?: string;
    requestedSph?: number | null;
    requestedCyl?: number | null;
    requestedAxis?: number | null;
    requestedAdd?: number | null;
  }>;
}): Promise<ReturnRequestRecord> {
  const res = await fetchWithRetry("/api/returns", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to submit return request.");
  return data as ReturnRequestRecord;
}

export async function uploadReturnRequestPhoto(
  returnRequestId: string,
  file: File
): Promise<{ id: string; imageUrl: string }> {
  const formData = new FormData();
  formData.set("photo", file);
  const headers = getAuthHeaders();
  delete headers["Content-Type"];
  const res = await fetchWithRetry(`/api/returns/${returnRequestId}/images`, {
    method: "POST",
    headers,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to upload return photo.");
  return data as { id: string; imageUrl: string };
}
