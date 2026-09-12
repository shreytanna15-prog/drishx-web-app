"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchDeliveryServices, type DeliveryServiceOption } from "@/lib/delivery-api";
import { updateOrderStatus } from "@/lib/orders-api";
import type { OrderTrackingStatus } from "@/lib/order-tracking";
import type { OrderRecord } from "@/lib/types/orders";

type Props = {
  order: OrderRecord;
  onDone: () => Promise<void> | void;
};

export function EmployeeDeliveryPackCard({ order, onDone }: Props) {
  const [services, setServices] = useState<DeliveryServiceOption[]>([]);
  const [serviceId, setServiceId] = useState(order.deliveryServiceId ?? "");
  const [weight, setWeight] = useState(
    order.delivery?.actualWeight != null ? String(order.delivery.actualWeight) : ""
  );
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await fetchDeliveryServices();
        if (!cancelled) setServices(list);
      } catch {
        if (!cancelled) setServices([]);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setServiceId(order.deliveryServiceId ?? "");
    setWeight(order.delivery?.actualWeight != null ? String(order.delivery.actualWeight) : "");
    setReason("");
  }, [order]);

  const isPacked = order.status === "PACKED";
  const terminal = order.status === "COMPLETED" || order.status === "CANCELLED";

  async function handlePack() {
    const w = Number(weight);
    if (!Number.isFinite(w) || w <= 0) {
      setError("Enter the packed weight (kg) greater than 0.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Status machine requires PENDING → PICKING → PACKED. Walk through
      // PICKING automatically so staff can pack in one click.
      if (order.status !== "PICKING" && order.status !== "PACKED") {
        await updateOrderStatus(order.id, "PICKING", order.pickedQuantity ?? 0);
      }
      await updateOrderStatus(order.id, "PACKED" as OrderTrackingStatus, order.pickedQuantity ?? 0, {
        deliveryServiceId: serviceId || undefined,
        actualWeight: w,
      });
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark packed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCorrect() {
    const w = Number(weight);
    if (!Number.isFinite(w) || w <= 0) {
      setError("Enter the packed weight (kg) greater than 0.");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required to change the packed weight.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateOrderStatus(order.id, order.status as OrderTrackingStatus, order.pickedQuantity ?? 0, {
        deliveryServiceId: serviceId || undefined,
        actualWeight: w,
        weightReason: reason.trim(),
      });
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to correct weight.");
    } finally {
      setBusy(false);
    }
  }

  if (terminal) return null;

  return (
    <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 text-sm">
      <h4 className="mb-2 font-extrabold text-[var(--brand-text)]">
        Delivery — pack &amp; weigh
      </h4>
      {order.delivery ? (
        <p className="mb-2 font-medium text-[var(--brand-text-muted)]">
          {String(order.delivery.actualWeight)} kg → {String(order.delivery.chargeableWeight)} kg
          chargeable · ₹{Number(order.delivery.customerCharge).toLocaleString("en-IN")}
        </p>
      ) : (
        <p className="mb-2 text-xs font-medium text-[var(--brand-text-muted)]">
          Charge is calculated after packing from the actual packed weight.
        </p>
      )}
      {!isPacked ? (
        <div className="space-y-2">
          <select
            className="h-10 w-full rounded-xl border border-[var(--brand-input-border)] bg-transparent px-3"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="">Select delivery service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.serviceName} — ₹{s.customerRate}/kg
              </option>
            ))}
          </select>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Packed weight (kg), e.g. 2.40"
          />
          {error ? <p className="text-xs font-bold text-[var(--brand-danger)]">{error}</p> : null}
          <Button onClick={() => void handlePack()} disabled={busy} className="w-full rounded-xl">
            {busy ? "Saving…" : "Mark packed with weight"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            type="number"
            min={0}
            step={0.01}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Corrected weight (kg)"
          />
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for change (required)"
          />
          {error ? <p className="text-xs font-bold text-[var(--brand-danger)]">{error}</p> : null}
          <Button
            variant="outline"
            onClick={() => void handleCorrect()}
            disabled={busy}
            className="w-full rounded-xl"
          >
            {busy ? "Saving…" : "Correct weight"}
          </Button>
        </div>
      )}
    </div>
  );
}
