"use client";

import { useEffect, useState } from "react";
import { fetchDeliveryServices, type DeliveryServiceOption } from "@/lib/delivery-api";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (id: string) => void;
};

export function DeliveryServicePicker({ value, onChange }: Props) {
  const [services, setServices] = useState<DeliveryServiceOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await fetchDeliveryServices();
        if (!cancelled) setServices(list);
      } catch {
        if (!cancelled) setServices([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-xs font-medium text-[var(--brand-text-muted)]">Loading delivery options…</p>;
  }
  if (services.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-extrabold text-[var(--brand-text)]">Delivery</h3>
      <div className="space-y-2">
        {services.map((s) => {
          const selected = value === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left",
                selected
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/8"
                  : "border-[var(--brand-card-border)] bg-[var(--brand-card)]"
              )}
            >
              <span>
                <span className="block text-sm font-bold text-[var(--brand-text)]">
                  {s.serviceName}
                </span>
                <span className="block text-xs font-medium text-[var(--brand-text-muted)]">
                  ₹{s.customerRate}/kg{s.etaText ? ` · ${s.etaText}` : ""}
                </span>
              </span>
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  selected ? "border-[var(--brand-primary)]" : "border-[var(--brand-text-muted)]"
                )}
              >
                {selected ? (
                  <span className="size-2.5 rounded-full bg-[var(--brand-primary)]" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs font-medium text-[var(--brand-text-muted)]">
        Delivery charge will be calculated after packing based on actual package weight.
      </p>
    </section>
  );
}

export function DeliverySummary({ order }: { order: { deliveryService?: { serviceName: string } | null; delivery?: { actualWeight: number | string; chargeableWeight: number | string; customerCharge: number | string } | null } }) {
  if (!order.deliveryService && !order.delivery) return null;
  return (
    <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 text-sm">
      <h4 className="mb-1 font-extrabold text-[var(--brand-text)]">Delivery</h4>
      {order.deliveryService ? (
        <p className="font-medium text-[var(--brand-text-muted)]">{order.deliveryService.serviceName}</p>
      ) : null}
      {order.delivery ? (
        <p className="mt-1 font-bold text-[var(--brand-text)]">
          {String(order.delivery.actualWeight)} kg → {String(order.delivery.chargeableWeight)} kg chargeable · ₹
          {Number(order.delivery.customerCharge).toLocaleString("en-IN")}
        </p>
      ) : (
        <p className="mt-1 text-xs font-medium text-[var(--brand-text-muted)]">
          Charge calculated after packing.
        </p>
      )}
    </div>
  );
}
