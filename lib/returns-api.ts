import { fetchWithRetry } from "./fetch-with-retry";
import { getStoredToken } from "./auth-storage";
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

function authHeaders(includeJson = true): HeadersInit {
  const token = getStoredToken();
  if (!token) throw new Error("Not authenticated");
  return includeJson
    ? {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    : {
        Authorization: `Bearer ${token}`,
      };
}

export async function fetchReturnRequests(): Promise<ReturnRequestRecord[]> {
  const res = await fetchWithRetry("/api/returns", {
    headers: authHeaders(),
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
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to load return request.");
  return data as ReturnRequestRecord;
}

export async function updateReturnRequest(
  id: string,
  action: "more-info" | "escalate" | "reject" | "close",
  remarks?: string
): Promise<ReturnRequestRecord> {
  const res = await fetchWithRetry(`/api/returns/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ action, remarks }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to update return request.");
  return data as ReturnRequestRecord;
}

export function formatReturnStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
  }>;
}): Promise<ReturnRequestRecord> {
  const res = await fetchWithRetry("/api/returns", {
    method: "POST",
    headers: authHeaders(),
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
  const res = await fetchWithRetry(`/api/returns/${returnRequestId}/images`, {
    method: "POST",
    headers: authHeaders(false),
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to upload return photo.");
  return data as { id: string; imageUrl: string };
}
