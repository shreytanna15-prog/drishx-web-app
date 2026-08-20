import { getAuthHeaders } from "./auth-fetch";
import { fetchWithRetry } from "./fetch-with-retry";
import type {
  AlternatePowerSuggestion,
  OrderPowerVersion,
  OrderRecord,
} from "./types/orders";

export async function fetchAlternateSuggestions(
  orderId: string,
  pendingOnly = true
): Promise<AlternatePowerSuggestion[]> {
  const qs = pendingOnly ? "?pending=1" : "";
  const response = await fetchWithRetry(
    `/api/orders/${orderId}/alternate-suggestions${qs}`,
    { headers: getAuthHeaders() }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error ?? "Failed to load alternate suggestions.");
  }
  return Array.isArray(data.suggestions) ? data.suggestions : [];
}

export async function fetchPowerVersions(
  orderId: string
): Promise<OrderPowerVersion[]> {
  const response = await fetchWithRetry(`/api/orders/${orderId}/power-versions`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error ?? "Failed to load power versions.");
  }
  return Array.isArray(data.powerVersions) ? data.powerVersions : [];
}

export async function markOrderPowerNotAvailable(
  orderId: string,
  options?: {
    notes?: string;
    supplierOptions?: Array<{ lensId: string; etaDays?: number | null }>;
  }
): Promise<{ suggestions: AlternatePowerSuggestion[] }> {
  const response = await fetchWithRetry(
    `/api/orders/${orderId}/procurement/not-available`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(options ?? {}),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error ?? "Failed to mark power not available.");
  }
  return {
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
  };
}

export async function acceptAlternateSuggestion(
  orderId: string,
  suggestionId: string
): Promise<{ order?: Partial<OrderRecord> }> {
  const response = await fetchWithRetry(
    `/api/orders/${orderId}/alternate-suggestions/${suggestionId}/accept`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error ?? "Failed to accept alternate power.");
  }
  return data;
}

export async function rejectAlternateSuggestion(
  orderId: string,
  suggestionId: string
): Promise<void> {
  const response = await fetchWithRetry(
    `/api/orders/${orderId}/alternate-suggestions/${suggestionId}/reject`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error ?? "Failed to reject suggestion.");
  }
}

export async function rejectAllAlternateSuggestions(
  orderId: string
): Promise<void> {
  const response = await fetchWithRetry(
    `/api/orders/${orderId}/alternate-suggestions/reject-all`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error ?? "Failed to reject suggestions.");
  }
}

export function formatAlternatePowerLabel(
  sph: number | null | undefined,
  cyl: number | null | undefined
): string {
  const s =
    sph === null || sph === undefined ? "—" : Number(sph).toFixed(2);
  const c =
    cyl === null || cyl === undefined ? "—" : Number(cyl).toFixed(2);
  return `${s} / ${c}`;
}
