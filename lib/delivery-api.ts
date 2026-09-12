import { fetchWithRetry } from "./fetch-with-retry";
import { getAuthHeaders } from "./auth-fetch";

export type DeliveryServiceOption = {
  id: string;
  courierCompany: string;
  serviceName: string;
  serviceType: string;
  customerRate: number;
  etaText?: string | null;
  isActive?: boolean;
};

export type OrderDeliveryInfo = {
  actualWeight: number | string;
  chargeableWeight: number | string;
  customerCharge: number | string;
  internalCost?: number | string;
  margin?: number | string;
  weightEnteredAt?: string | null;
};

export async function fetchDeliveryServices(): Promise<DeliveryServiceOption[]> {
  const res = await fetchWithRetry("/api/delivery-services", {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}
