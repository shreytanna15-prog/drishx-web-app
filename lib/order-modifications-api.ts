import { authFetch } from '@/lib/auth-fetch';

export type OrderChange = {
  id: string; requestedQuantity: number; requestedPowerId: string | null;
  reason: string; status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decisionReason: string | null; createdAt: string;
};

async function jsonOrError<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({})) as T & { error?: string };
  if (!res.ok) throw new Error(body.error || 'Could not update order change request.');
  return body;
}

export function fetchOrderChanges(orderId: string) {
  return authFetch(`/api/orders/${encodeURIComponent(orderId)}/modification`)
    .then((res) => jsonOrError<{ items: OrderChange[] }>(res));
}

export function requestOrderChange(input: {
  orderId: string; quantity: number; lensProductPowerId?: string; reason: string;
}) {
  return authFetch(`/api/orders/${encodeURIComponent(input.orderId)}/modification`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((res) => jsonOrError<OrderChange>(res));
}
