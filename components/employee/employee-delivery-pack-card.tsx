"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchDeliveryServices, type DeliveryServiceOption } from "@/lib/delivery-api";
import { dispatchOrder, updateOrderStatus } from "@/lib/orders-api";
import type { OrderTrackingStatus } from "@/lib/order-tracking";
import type { OrderRecord } from "@/lib/types/orders";

type Props = {
  order: OrderRecord;
  onDone: () => Promise<void> | void;
};

function formatDispatchDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** True while courier handover is blocked by the daily dispatch cutoff. */
function isHeldAfterCutoff(order: OrderRecord): boolean {
  if (order.dispatchOverridden) return false;
  if (!order.cutoffDeferred || !order.dispatchDate) return false;
  const dispatchDate = new Date(order.dispatchDate);
  if (Number.isNaN(dispatchDate.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dispatchDate.getTime() > today.getTime();
}

export function EmployeeDeliveryPackCard({ order, onDone }: Props) {
  const [services, setServices] = useState<DeliveryServiceOption[]>([]);
  const [serviceId, setServiceId] = useState(order.deliveryServiceId ?? "");
  const [weight, setWeight] = useState(
    order.delivery?.actualWeight != null ? String(order.delivery.actualWeight) : ""
  );
  const [reason, setReason] = useState("");
  const [courierName, setCourierName] = useState(order.courierName ?? "");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heldAfterCutoff = isHeldAfterCutoff(order);

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
    setCourierName(order.courierName ?? "");
    setTrackingNumber(order.trackingNumber ?? "");
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

  async function handleDispatch() {
    if (heldAfterCutoff) {
      setError(
        order.dispatchDate
          ? `Held after the daily dispatch cutoff until ${formatDispatchDay(order.dispatchDate)}. An admin can move it forward.`
          : "Held after the daily dispatch cutoff. An admin can move it forward."
      );
      return;
    }
    if (!courierName.trim() || !trackingNumber.trim()) {
      setError("Enter courier name and tracking number to dispatch.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await dispatchOrder(order.id, courierName.trim(), trackingNumber.trim());
      if (res.duplicateWarning) setError(res.duplicateWarning);
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dispatch.");
    } finally {
      setBusy(false);
    }
  }

  if (terminal) return null;

  return (
    <div className="rounded-2xl border border-(--brand-card-border) bg-(--brand-card) p-4 text-sm">
      <h4 className="mb-2 font-extrabold text-(--brand-text)">
        Delivery — pack &amp; weigh
      </h4>
      {order.cutoffDeferred ? (
        <div
          className={`mb-3 rounded-xl border px-3 py-2 ${
            order.dispatchOverridden
              ? "border-(--brand-card-border)"
              : "border-(--brand-danger)"
          }`}
        >
          <p
            className={`text-xs font-extrabold ${
              order.dispatchOverridden
                ? "text-(--brand-text)"
                : "text-(--brand-danger)"
            }`}
          >
            {order.dispatchOverridden
              ? "Dispatch moved forward by admin · cutoff lifted"
              : heldAfterCutoff
                ? `Held after daily dispatch cutoff${
                    order.dispatchDate
                      ? ` — expected dispatch ${formatDispatchDay(order.dispatchDate)}`
                      : ""
                  }`
                : order.dispatchDate
                  ? `Placed after cutoff · expected dispatch ${formatDispatchDay(order.dispatchDate)}`
                  : "Placed after the daily dispatch cutoff"}
          </p>
          {heldAfterCutoff ? (
            <p className="mt-1 text-xs font-medium text-(--brand-text-muted)">
              Courier handover is blocked until the cutoff day arrives or an admin
              moves this order forward.
            </p>
          ) : null}
        </div>
      ) : null}
      {order.delivery ? (
        <p className="mb-2 font-medium text-(--brand-text-muted)">
          {String(order.delivery.actualWeight)} kg → {String(order.delivery.chargeableWeight)} kg
          chargeable · ₹{Number(order.delivery.customerCharge).toLocaleString("en-IN")}
        </p>
      ) : (
        <p className="mb-2 text-xs font-medium text-(--brand-text-muted)">
          Charge is calculated after packing from the actual packed weight.
        </p>
      )}
      {!isPacked ? (
        <div className="space-y-2">
          <select
            className="h-10 w-full rounded-xl border border-(--brand-input-border) bg-transparent px-3"
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
          {error ? <p className="text-xs font-bold text-(--brand-danger)">{error}</p> : null}
          <Button onClick={() => void handlePack()} disabled={busy} className="w-full rounded-xl">
            {busy ? "Saving…" : "Mark packed with weight"}
          </Button>
          <p className="text-xs font-medium text-(--brand-text-muted)">
            Courier dispatch box appears here after the order becomes PACKED.
          </p>
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
          {error ? <p className="text-xs font-bold text-(--brand-danger)">{error}</p> : null}
          <Button
            variant="outline"
            onClick={() => void handleCorrect()}
            disabled={busy}
            className="w-full rounded-xl"
          >
            {busy ? "Saving…" : "Correct weight"}
          </Button>
          <div className="border-t border-(--brand-card-border) pt-2">
            <p className="mb-1 text-xs font-bold text-(--brand-text)">Dispatch — handover to courier</p>
            <div className="space-y-2">
              <Input
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                placeholder="Courier, e.g. Sri Raj Courier"
                disabled={heldAfterCutoff}
              />
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Tracking / AWB number"
                disabled={heldAfterCutoff}
              />
              <Button
                onClick={() => void handleDispatch()}
                disabled={busy || heldAfterCutoff}
                className="w-full rounded-xl"
              >
                {busy
                  ? "Dispatching…"
                  : heldAfterCutoff
                    ? "Held until dispatch day"
                    : "Dispatch order"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
