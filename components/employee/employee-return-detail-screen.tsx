"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  fetchReturnRequest,
  formatReturnPowerLine,
  formatReturnStatus,
  updateReturnRequest,
  type ReturnRequestRecord,
} from "@/lib/returns-api";

export function EmployeeReturnDetailScreen() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<ReturnRequestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const id = params?.id;
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      setRequest(await fetchReturnRequest(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load return request.");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(action: "more-info" | "escalate" | "reject") {
    if (!request) return;
    if (action === "reject" && !remarks.trim()) {
      setError("Remarks are required to reject.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const updated = await updateReturnRequest(request.id, action, remarks.trim());
      setRequest(updated);
      setRemarks("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update return request.");
    } finally {
      setSubmitting(false);
    }
  }

  const canAct =
    request?.status === "SUBMITTED" || request?.status === "MORE_INFO_REQUIRED";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/employee/returns">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-text)]">
            {request?.requestNumber ?? "Return request"}
          </h1>
          <p className="text-sm text-[var(--brand-text-muted)]">
            Review evidence and escalate for admin decision
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      {loading || !request ? (
        <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-6 text-sm text-[var(--brand-text-muted)]">
          Loading request...
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--brand-text)]">
                  {request.customer?.businessName ||
                    request.customer?.name ||
                    request.customer?.email ||
                    "Customer"}
                </p>
                <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
                  {request.requestType} · {formatReturnStatus(request.status)}
                </p>
              </div>
            </div>
            {request.customerRemarks ? (
              <p className="mt-4 text-sm text-[var(--brand-text)]">{request.customerRemarks}</p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
              Items
            </h2>
            <div className="mt-4 space-y-3">
              {request.items.map((item) => (
                <div key={item.id} className="rounded-xl border border-[var(--brand-card-border)] p-3">
                  <p className="font-semibold text-[var(--brand-text)]">{item.lensLabel}</p>
                  <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
                    Qty {item.quantity}
                    {item.eye ? ` · ${item.eye}` : ""} · {formatReturnStatus(item.reason)}
                  </p>
                  <p className="mt-2 text-xs text-[var(--brand-text-muted)]">
                    Original:{" "}
                    {formatReturnPowerLine({
                      sph: item.originalSph,
                      cyl: item.originalCyl,
                      add: item.originalAdd,
                      axis: item.originalAxis,
                    })}
                  </p>
                  {item.requestedSph != null || item.requestedCyl != null ? (
                    <p className="mt-1 text-xs font-semibold text-[var(--brand-text)]">
                      Requested:{" "}
                      {formatReturnPowerLine({
                        sph: item.requestedSph,
                        cyl: item.requestedCyl,
                        add: item.requestedAdd,
                        axis: item.requestedAxis,
                      })}
                    </p>
                  ) : null}
                  {item.itemRemarks ? (
                    <p className="mt-2 text-sm text-[var(--brand-text)]">{item.itemRemarks}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          {request.images.length > 0 ? (
            <section className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
                Photos
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {request.images.map((image) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={image.id}
                    src={image.imageUrl}
                    alt="Return evidence"
                    className="aspect-square w-full rounded-xl border border-[var(--brand-card-border)] object-contain p-2"
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
              Employee actions
            </h2>
            <label className="mt-4 block space-y-1">
              <span className="text-xs font-semibold text-[var(--brand-text-muted)]">
                Remarks
              </span>
              <textarea
                rows={4}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={!canAct || submitting}
                className="w-full rounded-lg border border-[var(--brand-card-border)] bg-transparent px-3 py-2 text-sm text-[var(--brand-text)]"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                disabled={!canAct || submitting}
                onClick={() => void runAction("more-info")}
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Ask for more photos
              </Button>
              <Button
                variant="secondary"
                disabled={!canAct || submitting}
                onClick={() => void runAction("escalate")}
              >
                Escalate to admin
              </Button>
              <Button
                variant="destructive"
                disabled={!canAct || submitting}
                onClick={() => void runAction("reject")}
              >
                Reject
              </Button>
            </div>
            {!canAct ? (
              <p className="mt-3 text-sm text-[var(--brand-text-muted)]">
                This request is already {formatReturnStatus(request.status)}.
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
              Timeline
            </h2>
            <div className="mt-4 space-y-3">
              {request.timelineEvents.map((event) => (
                <div key={event.id} className="rounded-xl border border-[var(--brand-card-border)] p-3">
                  <p className="font-semibold text-[var(--brand-text)]">{event.message}</p>
                  <p className="mt-1 text-xs text-[var(--brand-text-muted)]">
                    {formatReturnStatus(event.eventType)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
