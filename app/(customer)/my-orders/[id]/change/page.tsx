"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGetCatalogOrder } from '@/lib/modules/orders/query/use-get-catalog-order';
import { useGetOrderModifications } from '@/lib/modules/orders/query/use-get-order-modifications';
import { useRequestOrderModification } from '@/lib/modules/orders/mutation/use-request-order-modification';
import { useGetCatalogPowers } from '@/lib/modules/catalog-stock/query/use-get-catalog-powers';

export default function ChangeCatalogOrderPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, loading, error: orderError } = useGetCatalogOrder(id);
  const { data: changes, refetch } = useGetOrderModifications(id);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [powerSearch, setPowerSearch] = useState('');
  const [q, setQ] = useState('');
  const [selectedPowerId, setSelectedPowerId] = useState('');
  const { data: powers } = useGetCatalogPowers({ q, page: 1, limit: 24 });
  const { mutate, pending, error } = useRequestOrderModification({
    onSuccess: () => { setReason(''); void refetch(); },
  });
  const units = Number(quantity);
  const hasPending = changes?.items.some((change) => change.status === 'PENDING');
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 text-[var(--brand-text)]">
      <Link href={`/my-orders/${id}`} className="text-sm text-[var(--brand-primary)] hover:underline">← Back to order</Link>
      <h1 className="text-2xl font-bold">Request an order change</h1>
      <p className="text-sm text-[var(--brand-text-muted)]">An admin must approve a controlled reversal. If approved, the original order is cancelled and you place a new order for your preferred power and quantity.</p>
      {loading ? <p>Loading order…</p> : null}
      {orderError ? <p role="alert">{orderError.message}</p> : null}
      {order?.lensProductPowerId && !['CANCELLED', 'COMPLETED', 'DISPATCHED'].includes(order.status) ? (
        <section className="space-y-4 rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5">
          <p>Current quantity: {order.quantity}</p>
          <label className="block space-y-1 text-sm">Requested quantity
            <Input type="number" min={1} step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </label>
          <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); setQ(powerSearch.trim()); }}>
            <Input aria-label="Search replacement power" placeholder="Search replacement SKU (optional)" value={powerSearch} onChange={(event) => setPowerSearch(event.target.value)} />
            <Button type="submit" variant="outline">Search</Button>
          </form>
          <select aria-label="Requested replacement power" value={selectedPowerId} onChange={(event) => setSelectedPowerId(event.target.value)} className="w-full rounded-md border p-2">
            <option value="">Keep current power</option>
            {powers?.items.map((power) => <option key={power.id} value={power.id}>{power.skuCode} · {power.sph.toFixed(2)}/{power.cyl.toFixed(2)}</option>)}
          </select>
          <label className="block space-y-1 text-sm">Reason for change
            <Input value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} />
          </label>
          {error ? <p role="alert" className="text-red-600">{error.message}</p> : null}
          <Button disabled={pending || hasPending || !reason.trim() || !Number.isInteger(units) || units <= 0} onClick={() => void mutate({ orderId: id, quantity: units, reason, ...(selectedPowerId ? { lensProductPowerId: selectedPowerId } : {}) })}>Request approval</Button>
          {hasPending ? <p className="text-sm">A change request is awaiting admin review.</p> : null}
        </section>
      ) : null}
      <h2 className="text-lg font-semibold">Request history</h2>
      {changes?.items.map((change) => <div key={change.id} className="rounded-lg border border-[var(--brand-card-border)] p-4 text-sm">
        <strong>{change.status}</strong> · {change.reason} · requested {change.requestedQuantity} units
        {change.decisionReason ? <p>Admin: {change.decisionReason}</p> : null}
      </div>)}
      {changes?.items.length === 0 ? <p>No requests yet.</p> : null}
      {changes?.items.some((change) => change.status === 'APPROVED') ? <Link href="/shop/catalog" className="text-[var(--brand-primary)] underline">Shop a new catalog order</Link> : null}
    </main>
  );
}
