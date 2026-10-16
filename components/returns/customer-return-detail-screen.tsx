"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  formatReturnPowerLine,
  formatReturnStatus,
} from "@/lib/returns-api";
import { useGetReturnRequest } from "@/lib/modules/returns/query/use-get-return-request";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CustomerReturnDetailScreen() {
  const params = useParams<{ id: string }>();
  const returnId = typeof params?.id === "string" ? params.id : params?.id?.[0];

  const { data, loading, error } = useGetReturnRequest(returnId, {
    enabled: Boolean(returnId),
  });

  // Drop prior request while id changes so we never render stale details.
  const request = data?.id === returnId ? data : undefined;

  const orderGroupKey =
    request?.primaryOrder?.checkoutBatchId?.trim() ||
    request?.primaryOrder?.id ||
    request?.primaryOrderId ||
    request?.items[0]?.originalOrderId;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/returns">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-text)]">
            {request?.requestNumber ?? "Return details"}
          </h1>
          <p className="text-sm text-[var(--brand-text-muted)]">
            Status and history for this request
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[var(--brand-danger-border)] bg-[var(--brand-danger-bg)] px-4 py-3 text-sm text-[var(--brand-danger)]">
          {error.message}
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
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
                  {request.requestType === "REPLACEMENT" ? "Replacement" : "Return"}
                </p>
                <p className="mt-1 text-lg font-extrabold text-[var(--brand-text)]">
                  {formatReturnStatus(request.status)}
                </p>
                <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
                  Submitted {formatDate(request.createdAt)}
                </p>
              </div>
              {orderGroupKey ? (
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href={`/my-orders/${encodeURIComponent(orderGroupKey)}`}>
                    View source order
                  </Link>
                </Button>
              ) : null}
            </div>
            {request.customerRemarks ? (
              <p className="mt-4 text-sm text-[var(--brand-text)]">
                <span className="font-semibold text-[var(--brand-text-muted)]">Your remarks: </span>
                {request.customerRemarks}
              </p>
            ) : null}
            {request.adminRemarks ? (
              <p className="mt-2 text-sm text-[var(--brand-text)]">
                <span className="font-semibold text-[var(--brand-text-muted)]">Admin notes: </span>
                {request.adminRemarks}
              </p>
            ) : null}
            {request.employeeRemarks ? (
              <p className="mt-2 text-sm text-[var(--brand-text)]">
                <span className="font-semibold text-[var(--brand-text-muted)]">Staff notes: </span>
                {request.employeeRemarks}
              </p>
            ) : null}
            {request.rejectionReason ? (
              <p className="mt-3 text-sm text-rose-600">
                <span className="font-semibold">Rejected: </span>
                {request.rejectionReason}
              </p>
            ) : null}
            {request.creditNote || request.approvedAmount != null ? (
              <p className="mt-3 text-sm font-semibold text-[var(--brand-text)]">
                Credit: ₹
                {Number(
                  request.creditNote?.amount ?? request.approvedAmount ?? 0
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                {request.creditNote?.creditNoteNumber
                  ? ` · ${request.creditNote.creditNoteNumber}`
                  : ""}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
              Items
            </h2>
            <div className="mt-4 space-y-3">
              {request.items.map((item) => (
                <div key={item.id} className="rounded-xl border border-[var(--brand-card-border)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--brand-text)]">{item.lensLabel}</p>
                    <p className="text-sm text-[var(--brand-text-muted)]">Qty {item.quantity}</p>
                  </div>
                  <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
                    {formatReturnStatus(item.reason)}
                    {item.eye ? ` · ${item.eye}` : ""}
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
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              Timeline
            </h2>
            <div className="mt-4 space-y-3">
              {request.timelineEvents.length === 0 ? (
                <p className="text-sm text-[var(--brand-text-muted)]">No events yet.</p>
              ) : (
                request.timelineEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-[var(--brand-card-border)] p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[var(--brand-text)]">{event.message}</p>
                      <p className="text-xs text-[var(--brand-text-muted)]">
                        {formatDate(event.createdAt)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-[var(--brand-text-muted)]">
                      {formatReturnStatus(event.eventType)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
