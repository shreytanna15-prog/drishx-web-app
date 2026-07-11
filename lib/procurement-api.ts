import { getStoredToken } from "@/lib/auth-storage";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import type { ApiLensType } from "@/lib/types/lens";

export type ProcurementRecord = {
  id: string;
  reference: string;
  amount: number | string;
  currency: string;
  description: string | null;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
};

export type StockIntakePayload = {
  lensType: ApiLensType;
  lensId: string;
  quantityAdded: number;
  /** Total purchase amount for this line (procurement expense). */
  amount: number;
  /** Unit cost stored on the lens record. */
  costPrice: number;
  /** Customer selling price stored on the lens record. */
  sellingPrice: number;
  description?: string;
  /** When set, transitions the linked AWAITING_PROCUREMENT order after stock intake. */
  orderId?: string;
};

export type StockIntakeBatchPayload = {
  notes?: string;
  items: StockIntakePayload[];
};

export type StockIntakeBatchResult = {
  batchReference: string;
  totalAmount: number;
  itemCount: number;
  results: {
    transaction: ProcurementRecord;
    lens: { id: string; quantity: number };
  }[];
};

export type ManualExpensePayload = {
  amount: number;
  description: string;
};

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchProcurementHistory(): Promise<ProcurementRecord[]> {
  const res = await fetchWithRetry("/api/expenses/procurement", {
    headers: authHeaders(),
    cache: "no-store",
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (result as { error?: string })?.error ||
        "Failed to load procurement history."
    );
  }
  return result as ProcurementRecord[];
}

export async function recordStockIntake(
  payload: StockIntakePayload
): Promise<{
  transaction: ProcurementRecord;
  lens: { id: string; quantity: number };
}> {
  const res = await fetchWithRetry("/api/expenses/procurement", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (result as { error?: string })?.error || "Failed to record stock intake."
    );
  }
  return result as {
    transaction: ProcurementRecord;
    lens: { id: string; quantity: number };
  };
}

export async function recordStockIntakeBatch(
  payload: StockIntakeBatchPayload
): Promise<StockIntakeBatchResult> {
  const res = await fetchWithRetry("/api/expenses/procurement", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (result as { error?: string })?.error ||
        "Failed to record stock intake batch."
    );
  }
  return result as StockIntakeBatchResult;
}

export async function recordManualExpense(
  payload: ManualExpensePayload
): Promise<ProcurementRecord> {
  const res = await fetchWithRetry("/api/expenses/manual", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (result as { error?: string })?.error || "Failed to record manual expense."
    );
  }
  return result as ProcurementRecord;
}

export async function fetchManualExpenses(): Promise<ProcurementRecord[]> {
  const res = await fetchWithRetry("/api/expenses/manual", {
    headers: authHeaders(),
    cache: "no-store",
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (result as { error?: string })?.error || "Failed to load manual expenses."
    );
  }
  return result as ProcurementRecord[];
}
