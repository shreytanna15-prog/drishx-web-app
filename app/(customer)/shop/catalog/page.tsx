"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetCatalogPowers } from "@/lib/modules/catalog-stock/query/use-get-catalog-powers";
import { useGetCatalogDeliveryServices } from "@/lib/modules/catalog-stock/query/use-get-catalog-delivery-services";
import { usePlaceCatalogOrder } from "@/lib/modules/catalog-stock/mutation/use-place-catalog-order";

export default function CatalogStockShopPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [stockMode, setStockMode] = useState<"LIVE" | "NON_LIVE">("LIVE");
  const [deliveryServiceId, setDeliveryServiceId] = useState("");
  const { data, loading, refreshing, error, refetch } = useGetCatalogPowers({ q, page, limit: 24 });
  const { data: services } = useGetCatalogDeliveryServices();
  const { mutate, pending, error: orderError } = usePlaceCatalogOrder({
    onSuccess: (result) => router.push(`/my-orders/${result.order.id}`),
  });
  const selected = data?.items.find((item) => item.id === selectedId);
  const units = Number(quantity);
  const canOrder = selected && deliveryServiceId && Number.isInteger(units) && units > 0 &&
    (stockMode !== "LIVE" || units <= selected.available);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 text-[var(--brand-text)]">
      <Link href="/shop" className="text-sm text-[var(--brand-primary)] hover:underline">← Back to shop</Link>
      <div>
        <h1 className="text-3xl font-bold">Catalog stock</h1>
        <p className="text-sm text-[var(--brand-text-muted)]">Shop by exact variant and power. Live orders require available stock; non-live orders can raise procurement for a shortage.</p>
      </div>
      <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); setPage(1); setQ(search.trim()); setSelectedId(""); }}>
        <Input aria-label="Search catalog SKU or name" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search SKU or name" />
        <Button type="submit">Search</Button>
      </form>
      {loading ? <p>Loading catalog stock…</p> : null}
      {refreshing ? <p className="text-sm">Refreshing…</p> : null}
      {error ? <p role="alert">{error.message} <button onClick={() => void refetch()} className="underline">Retry</button></p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((item) => (
          <button key={item.id} type="button" onClick={() => setSelectedId(item.id)}
            className={`rounded-xl border p-4 text-left ${selectedId === item.id ? "border-[var(--brand-primary)]" : "border-[var(--brand-card-border)]"} bg-[var(--brand-card)]`}>
            <strong className="block">{item.name}</strong>
            <span className="block text-xs">{item.skuCode} · {item.family} · {item.base}</span>
            <span className="mt-2 block text-sm">SPH {item.sph.toFixed(2)} / CYL {item.cyl.toFixed(2)}
              {item.axis != null ? ` · Axis ${item.axis}` : ""}{item.addition != null ? ` · ADD ${item.addition}` : ""}{item.eye ? ` · ${item.eye}` : ""}
            </span>
            <span className="mt-2 block">₹{item.price.toFixed(2)} per pair · {item.available} available</span>
          </button>
        ))}
      </div>
      {data && data.items.length === 0 ? <p>No stock leaves found for this search.</p> : null}
      <div className="flex items-center gap-3 text-sm">
        <Button type="button" variant="outline" disabled={page <= 1} onClick={() => { setPage((value) => value - 1); setSelectedId(""); }}>Previous</Button>
        Page {page} of {Math.max(1, Math.ceil((data?.total ?? 0) / 24))}
        <Button type="button" variant="outline" disabled={!data?.hasMore} onClick={() => { setPage((value) => value + 1); setSelectedId(""); }}>Next</Button>
      </div>
      {selected ? (
        <section className="space-y-4 rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5">
          <h2 className="text-xl font-semibold">Order {selected.skuCode} · {selected.sph.toFixed(2)} / {selected.cyl.toFixed(2)}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-sm">Stock mode
              <select className="block w-full rounded-md border p-2" value={stockMode} onChange={(event) => setStockMode(event.target.value as "LIVE" | "NON_LIVE")}>
                <option value="LIVE">Live — available only</option><option value="NON_LIVE">Non-live — procure shortage</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">Quantity
              <Input type="number" min={1} step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </label>
            <label className="space-y-1 text-sm">Delivery service
              <select className="block w-full rounded-md border p-2" value={deliveryServiceId} onChange={(event) => setDeliveryServiceId(event.target.value)}>
                <option value="">Choose a service</option>
                {services?.filter((service) => service.isActive !== false).map((service) => <option key={service.id} value={service.id}>{service.courierCompany} · {service.serviceName}</option>)}
              </select>
            </label>
          </div>
          {orderError ? <p role="alert" className="text-red-600">{orderError.message}</p> : null}
          <Button disabled={!canOrder || pending} onClick={() => void mutate({ lensProductPowerId: selected.id, quantity: units, stockMode, deliveryServiceId })}>
            {pending ? "Placing order…" : "Place order"}
          </Button>
        </section>
      ) : null}
    </main>
  );
}
