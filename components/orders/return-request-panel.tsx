"use client";

import { useMemo, useState } from "react";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { OrderListGroup } from "@/lib/order-list-display";
import {
  createReturnRequest,
  fetchReturnRequests,
  RETURN_REASON_OPTIONS,
  type ReturnReason,
  type ReturnRequestRecord,
  type ReturnRequestType,
  uploadReturnRequestPhoto,
} from "@/lib/returns-api";
import { formatLensType } from "@/lib/types/lens";

type ItemState = {
  selected: boolean;
  quantity: string;
  eye: string;
  reason: ReturnReason;
  itemRemarks: string;
};

function formatReturnStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function orderLabel(group: OrderListGroup, orderId: string) {
  const order = group.orders.find((entry) => entry.id === orderId);
  if (!order) return orderId;
  const lensType = formatLensType(order.lensType);
  const catalog =
    order.progressiveLens?.brand ||
    order.kryptokLens?.brand ||
    order.singleVisionLens?.brand ||
    "";
  return [lensType, catalog].filter(Boolean).join(" · ");
}

export function ReturnRequestPanel({ group }: { group: OrderListGroup }) {
  const [open, setOpen] = useState(false);
  const [requestType, setRequestType] = useState<ReturnRequestType>("RETURN");
  const [customerRemarks, setCustomerRemarks] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState<ReturnRequestRecord[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const [itemState, setItemState] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(
      group.orders.map((order) => [
        order.id,
        {
          selected: false,
          quantity: String(Math.max(1, Math.floor(Number(order.quantity) || 1))),
          eye: order.eye ?? "",
          reason: "WRONG_POWER" as ReturnReason,
          itemRemarks: "",
        },
      ])
    )
  );

  const selectedCount = useMemo(
    () => Object.values(itemState).filter((item) => item.selected).length,
    [itemState]
  );

  async function loadHistory() {
    try {
      const all = await fetchReturnRequests();
      const orderIds = new Set(group.orders.map((order) => order.id));
      setHistory(
        all.filter((request) =>
          request.items.some((item) => orderIds.has(item.originalOrderId))
        )
      );
      setHistoryLoaded(true);
    } catch {
      setHistoryLoaded(true);
    }
  }

  async function handleSubmit() {
    setError("");
    setSuccess("");
    const items = group.orders
      .filter((order) => itemState[order.id]?.selected)
      .map((order) => {
        const state = itemState[order.id]!;
        return {
          orderId: order.id,
          quantity: Number(state.quantity),
          eye: state.eye || null,
          reason: state.reason,
          itemRemarks: state.itemRemarks.trim(),
        };
      });

    if (items.length === 0) {
      setError("Select at least one item.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createReturnRequest({
        requestType,
        customerRemarks,
        items,
      });

      for (const file of files) {
        await uploadReturnRequestPhoto(created.id, file);
      }

      setSuccess(`Request ${created.requestNumber} submitted.`);
      setOpen(false);
      setCustomerRemarks("");
      setFiles([]);
      setItemState((current) =>
        Object.fromEntries(
          Object.entries(current).map(([key, value]) => [
            key,
            { ...value, selected: false, itemRemarks: "" },
          ])
        )
      );
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-base font-bold text-[var(--brand-text)]">
              Returns & replacements
            </p>
            <p className="text-sm text-[var(--brand-text-muted)]">
              Request approval for a return or replacement. No balance is reduced until reviewed.
            </p>
          </div>
          <Button
            type="button"
            className="rounded-xl bg-[var(--brand-primary)] font-bold text-[var(--brand-primary-text)]"
            onClick={() => {
              setOpen((value) => !value);
              if (!historyLoaded) void loadHistory();
            }}
          >
            {open ? "Close form" : "Return / Replacement"}
          </Button>
        </div>

        {success ? (
          <div className="mt-4 rounded-xl border border-[var(--brand-success-border)] bg-[var(--brand-success-bg)] px-4 py-3 text-sm font-medium text-[var(--brand-success)]">
            {success}
          </div>
        ) : null}

        {open ? (
          <div className="mt-4 space-y-4 border-t border-[var(--brand-card-border)] pt-4">
            {error ? (
              <div className="rounded-xl border border-[var(--brand-danger-border)] bg-[var(--brand-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--brand-danger)]">
                {error}
              </div>
            ) : null}

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
                Request type
              </span>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as ReturnRequestType)}
                className="h-10 w-full rounded-lg border border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] px-3 text-sm text-[var(--brand-text)]"
              >
                <option value="RETURN">Return</option>
                <option value="REPLACEMENT">Replacement</option>
              </select>
            </label>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
                Select items
              </p>
              {group.orders.map((order) => {
                const state = itemState[order.id]!;
                return (
                  <div
                    key={order.id}
                    className="rounded-xl border border-[var(--brand-card-border)] p-3"
                  >
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={state.selected}
                        onChange={(e) =>
                          setItemState((current) => ({
                            ...current,
                            [order.id]: { ...current[order.id], selected: e.target.checked },
                          }))
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--brand-text)]">
                          {orderLabel(group, order.id)}
                        </p>
                        <p className="text-xs text-[var(--brand-text-muted)]">
                          Ordered qty: {Number(order.quantity)}
                        </p>
                      </div>
                    </label>

                    {state.selected ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-[var(--brand-text-muted)]">
                            Quantity
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={Math.max(1, Math.floor(Number(order.quantity) || 1))}
                            value={state.quantity}
                            onChange={(e) =>
                              setItemState((current) => ({
                                ...current,
                                [order.id]: { ...current[order.id], quantity: e.target.value },
                              }))
                            }
                            className="h-10 w-full rounded-lg border border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] px-3 text-sm text-[var(--brand-text)]"
                          />
                        </label>

                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-[var(--brand-text-muted)]">
                            Eye
                          </span>
                          <input
                            type="text"
                            placeholder="LEFT / RIGHT"
                            value={state.eye}
                            onChange={(e) =>
                              setItemState((current) => ({
                                ...current,
                                [order.id]: { ...current[order.id], eye: e.target.value },
                              }))
                            }
                            className="h-10 w-full rounded-lg border border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] px-3 text-sm text-[var(--brand-text)]"
                          />
                        </label>

                        <label className="block space-y-1 sm:col-span-2">
                          <span className="text-xs font-semibold text-[var(--brand-text-muted)]">
                            Reason
                          </span>
                          <select
                            value={state.reason}
                            onChange={(e) =>
                              setItemState((current) => ({
                                ...current,
                                [order.id]: {
                                  ...current[order.id],
                                  reason: e.target.value as ReturnReason,
                                },
                              }))
                            }
                            className="h-10 w-full rounded-lg border border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] px-3 text-sm text-[var(--brand-text)]"
                          >
                            {RETURN_REASON_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block space-y-1 sm:col-span-2">
                          <span className="text-xs font-semibold text-[var(--brand-text-muted)]">
                            Item remarks
                          </span>
                          <textarea
                            rows={2}
                            value={state.itemRemarks}
                            onChange={(e) =>
                              setItemState((current) => ({
                                ...current,
                                [order.id]: {
                                  ...current[order.id],
                                  itemRemarks: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-lg border border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] px-3 py-2 text-sm text-[var(--brand-text)]"
                          />
                        </label>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
                Photos (optional)
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="block w-full text-sm text-[var(--brand-text)]"
              />
              {files.length > 0 ? (
                <p className="text-xs text-[var(--brand-text-muted)]">
                  {files.length} file{files.length === 1 ? "" : "s"} selected
                </p>
              ) : null}
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
                General remarks
              </span>
              <textarea
                rows={3}
                value={customerRemarks}
                onChange={(e) => setCustomerRemarks(e.target.value)}
                className="w-full rounded-lg border border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] px-3 py-2 text-sm text-[var(--brand-text)]"
              />
            </label>

            <Button
              type="button"
              disabled={submitting || selectedCount === 0}
              onClick={() => void handleSubmit()}
              className="rounded-xl bg-[var(--brand-primary)] font-bold text-[var(--brand-primary-text)]"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Submit request
                </>
              )}
            </Button>
          </div>
        ) : null}
      </div>

      {history.length > 0 ? (
        <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4">
          <p className="mb-3 text-base font-bold text-[var(--brand-text)]">
            Return request history
          </p>
          <div className="space-y-3">
            {history.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-[var(--brand-card-border)] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-[var(--brand-text)]">
                    {request.requestNumber}
                  </p>
                  <span className="rounded-full border border-[var(--brand-card-border)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-text-muted)]">
                    {formatReturnStatus(request.status)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
                  {request.items.length} item{request.items.length === 1 ? "" : "s"} · {request.requestType.toLowerCase()}
                </p>
                {request.rejectionReason ? (
                  <p className="mt-2 text-sm text-[var(--brand-danger)]">
                    {request.rejectionReason}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
