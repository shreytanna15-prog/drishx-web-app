"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetCatalogPowers } from "@/lib/modules/catalog-stock/query/use-get-catalog-powers";
import { useGetCatalogDeliveryServices } from "@/lib/modules/catalog-stock/query/use-get-catalog-delivery-services";
import { usePlaceCatalogOrder } from "@/lib/modules/catalog-stock/mutation/use-place-catalog-order";
import {
  getOnBehalfCustomOrderContext,
  EMPLOYEE_ON_BEHALF_CATALOG_PATH,
} from "@/lib/on-behalf-custom-order";

export default function EmployeeOnBehalfCatalogPage() {
  const router = useRouter();
  const [context, setContext] = useState(() => getOnBehalfCustomOrderContext());
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [stockMode, setStockMode] = useState<"LIVE" | "NON_LIVE">("LIVE");
  const [deliveryServiceId, setDeliveryServiceId] = useState("");
  const { data, loading, error, refetch } = useGetCatalogPowers({ q, page, limit: 24 });
  const { data: services } = useGetCatalogDeliveryServices();
  const { mutate, pending, error: orderError } = usePlaceCatalogOrder({
    onSuccess: () => router.push(context?.returnTo || "/employee/orders/on-behalf"),
  });

  useEffect(() => {
    setContext(getOnBehalfCustomOrderContext());
  }, []);

  if (!context?.userId) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <p>Select a customer on Order on behalf first.</p>
        <Button asChild><Link href="/employee/orders/on-behalf">Back</Link></Button>
      </main>
    );
  }

  const selected = data?.items.find((item) => item.id === selectedId);
  const units = Number(quantity);
  const canOrder = selected && deliveryServiceId && Number.isInteger(units) && units > 0 &&
    (stockMode !== "LIVE" || units <= selected.available);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 text-[var(--brand-text)]">
      <Link href={context.returnTo || "/employee/orders/on-behalf"} className="text-sm text-[var(--brand-primary)] hover:underline">
        ← Back to on-behalf
      </Link>
      <div>
        <h1 className="text-3xl font-bold">Catalog stock (on behalf)</h1>
        <p className="text-sm text-[var(--brand-text-muted)]">
          Ordering for {context.customerLabel}. Path: {EMPLOYEE_ON_BEHALF_CATALOG_PATH}
        </p>
      </div>
      <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); setPage(1); setQ(search.trim()); setSelectedId(""); }}>
        <Input aria-label="Search catalog" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search SKU or name" />
        <Button type="submit">Search</Button>
      </form>
      {loading ? <p>Loading…</p> : null}
      {error ? <p role="alert">{error.message} <button type="button" className="underline" onClick={() => void refetch()}>Retry</button></p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((item) => (
          <button key={item.id} type="button" onClick={() => setSelectedId(item.id)}
            className={`rounded-xl border p-4 text-left ${selectedId === item.id ? "border-[var(--brand-primary)]" : "border-[var(--brand-card-border)]"} bg-[var(--brand-card)]`}>
            <strong className="block">{item.name}</strong>
            <span className="block text-xs">{item.skuCode}</span>
            <span className="mt-2 block text-sm">SPH {item.sph.toFixed(2)} / CYL {item.cyl.toFixed(2)}</span>
            <span className="mt-2 block">₹{item.price.toFixed(2)} · {item.available} available</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <Button type="button" variant="outline" disabled={page <= 1} onClick={() => { setPage((value) => value - 1); setSelectedId(""); }}>Previous</Button>
        Page {page}
        <Button type="button" variant="outline" disabled={!data?.hasMore} onClick={() => { setPage((value) => value + 1); setSelectedId(""); }}>Next</Button>
      </div>
      {selected ? (
        <section className="space-y-4 rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5">
          <h2 className="text-xl font-semibold">Order {selected.skuCode}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-sm">Stock mode
              <select className="block w-full rounded-md border p-2" value={stockMode} onChange={(event) => setStockMode(event.target.value as "LIVE" | "NON_LIVE")}>
                <option value="LIVE">Live</option>
                <option value="NON_LIVE">Non-live</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">Quantity
              <Input type="number" min={1} step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </label>
            <label className="space-y-1 text-sm">Delivery
              <select className="block w-full rounded-md border p-2" value={deliveryServiceId} onChange={(event) => setDeliveryServiceId(event.target.value)}>
                <option value="">Choose…</option>
                {services?.filter((service) => service.isActive !== false).map((service) => (
                  <option key={service.id} value={service.id}>{service.courierCompany} · {service.serviceName}</option>
                ))}
              </select>
            </label>
          </div>
          {orderError ? <p role="alert" className="text-red-600">{orderError.message}</p> : null}
          <Button disabled={!canOrder || pending} onClick={() => void mutate({
            lensProductPowerId: selected.id, quantity: units, stockMode, deliveryServiceId, userId: context.userId,
          })}>
            {pending ? "Placing…" : "Place on-behalf order"}
          </Button>
        </section>
      ) : null}
    </main>
  );
}
