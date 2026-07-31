"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  acceptAlternateSuggestion,
  fetchAlternateSuggestions,
  fetchPowerVersions,
  formatAlternatePowerLabel,
  markOrderPowerNotAvailable,
  rejectAllAlternateSuggestions,
  rejectAlternateSuggestion,
} from "@/lib/alternate-power-api";
import type {
  AlternatePowerSuggestion,
  OrderPowerVersion,
  OrderRecord,
} from "@/lib/types/orders";

type Mode = "customer" | "staff";

type AlternatePowerPanelProps = {
  order: OrderRecord;
  mode: Mode;
  onChanged?: () => void;
};

function availabilityLabel(s: AlternatePowerSuggestion) {
  if (s.availability === "WAREHOUSE") return "Warehouse · Available";
  if (s.availability === "OUT_OF_STOCK") return "Not in stock";
  return `Supplier${s.etaDays != null ? ` · ${s.etaDays} day(s)` : ""}`;
}

function formatPowerDelta(
  suggestion: { sph: number; cyl: number | null },
  reference: { sph: number | null; cyl: number | null } | null
): string | null {
  if (!reference || reference.sph == null) return null;
  const dSph = Math.abs(Number(suggestion.sph) - Number(reference.sph));
  const dCyl = Math.abs((suggestion.cyl ?? 0) - (reference.cyl ?? 0));
  return `ΔSPH ${dSph.toFixed(2)} · ΔCYL ${dCyl.toFixed(2)}`;
}

export function AlternatePowerPanel({
  order,
  mode,
  onChanged,
}: AlternatePowerPanelProps) {
  const isRetail = (order.lineType ?? "RETAIL") === "RETAIL";
  const [suggestions, setSuggestions] = useState<AlternatePowerSuggestion[]>(
    order.alternateSuggestions?.filter((s) => s.status === "PENDING") ?? []
  );
  const [versions, setVersions] = useState<OrderPowerVersion[]>(
    order.powerVersions ?? []
  );
  const [busy, setBusy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const referencePower = useMemo(() => {
    const na = [...versions]
      .reverse()
      .find((v) => v.status === "POWER_NOT_AVAILABLE");
    const latest = versions[versions.length - 1];
    const ref = na ?? latest;
    if (ref) return { sph: ref.sph, cyl: ref.cyl };
    return {
      sph: order.sph != null ? Number(order.sph) : null,
      cyl: order.cyl != null ? Number(order.cyl) : null,
    };
  }, [versions, order.sph, order.cyl]);

  const reload = useCallback(async () => {
    try {
      const [nextSuggestions, nextVersions] = await Promise.all([
        fetchAlternateSuggestions(order.id, true),
        fetchPowerVersions(order.id),
      ]);
      setSuggestions(nextSuggestions);
      setVersions(nextVersions);
    } catch {
      // keep existing
    }
  }, [order.id]);

  useEffect(() => {
    if (!isRetail) return;
    void reload();
  }, [isRetail, reload]);

  if (!isRetail) return null;

  async function runAction(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError(null);
    setMessage(null);
    try {
      await action();
      await reload();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 sm:p-5">
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
          Alternate power
        </h3>
        <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
          Original ordered power is never overwritten. Accepted alternates create a
          new version and restart fulfilment.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-[var(--brand-danger, #b91c1c)]" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-[var(--brand-success, #15803d)]">{message}</p>
      ) : null}

      {versions.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
            Power history
          </p>
          <ul className="space-y-2">
            {versions.map((v) => (
              <li
                key={v.id}
                className="rounded-xl border border-[var(--brand-card-border)] px-3 py-2 text-sm"
              >
                <span className="font-semibold text-[var(--brand-text)]">
                  V{v.versionNumber}: {formatAlternatePowerLabel(v.sph, v.cyl)}
                </span>
                <span className="ml-2 text-xs text-[var(--brand-text-muted)]">
                  {v.source} · {v.status}
                  {v.isFinalFulfilled ? " · Final" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {mode === "staff" && order.status === "AWAITING_PROCUREMENT" ? (
        <Button
          type="button"
          variant="outline"
          disabled={busy === "na"}
          onClick={() =>
            void runAction("na", async () => {
              const result = await markOrderPowerNotAvailable(order.id, {
                notes: "Marked not available from supplier",
              });
              setSuggestions(result.suggestions);
              setMessage(
                result.suggestions.length
                  ? `${result.suggestions.length} alternate(s) sent to customer for Accept/Reject.`
                  : "Marked not available. No other powers exist for this product family to suggest."
              );
            })
          }
        >
          {busy === "na" ? "Working…" : "Mark power not available"}
        </Button>
      ) : null}

      {mode === "customer" &&
      suggestions.length === 0 &&
      versions.some((v) => v.status === "POWER_NOT_AVAILABLE") ? (
        <p className="text-sm text-[var(--brand-text-muted)]">
          Ordered power is not available. No alternate powers are ready yet —
          our team will follow up.
        </p>
      ) : null}

      {mode === "staff" &&
      suggestions.length === 0 &&
      versions.some((v) => v.status === "POWER_NOT_AVAILABLE") ? (
        <p className="text-sm text-[var(--brand-text-muted)]">
          No alternate powers were generated for this product family. Add stock
          with nearby powers, or provide a supplier lens id from admin.
        </p>
      ) : null}

      {suggestions.length > 0 && mode === "customer" ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
            Choose an alternate power
          </p>
          <ul className="space-y-3">
            {suggestions.map((s) => {
              const delta = formatPowerDelta(s, referencePower);
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--brand-card-border)] px-3 py-3"
                >
                  <div>
                    <p className="font-semibold text-[var(--brand-text)]">
                      {formatAlternatePowerLabel(s.sph, s.cyl)}
                    </p>
                    <p className="text-xs text-[var(--brand-text-muted)]">
                      {availabilityLabel(s)}
                      {delta ? ` · ${delta}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={Boolean(busy)}
                      onClick={() =>
                        void runAction(`accept-${s.id}`, async () => {
                          await acceptAlternateSuggestion(order.id, s.id);
                          setMessage(
                            "Alternate accepted. Fulfilment will continue."
                          );
                        })
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={Boolean(busy)}
                      onClick={() =>
                        void runAction(`reject-${s.id}`, async () => {
                          await rejectAlternateSuggestion(order.id, s.id);
                          setMessage("Suggestion rejected.");
                        })
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <Button
            type="button"
            variant="ghost"
            className="mt-2"
            disabled={Boolean(busy)}
            onClick={() =>
              void runAction("reject-all", async () => {
                await rejectAllAlternateSuggestions(order.id);
                setMessage("All alternates rejected. Our team will follow up.");
              })
            }
          >
            Reject all
          </Button>
        </div>
      ) : null}

      {suggestions.length > 0 && mode === "staff" ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
            Sent to customer for approval
          </p>
          <ul className="space-y-2">
            {suggestions.map((s) => {
              const delta = formatPowerDelta(s, referencePower);
              return (
                <li
                  key={s.id}
                  className="rounded-xl border border-[var(--brand-card-border)] px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-[var(--brand-text)]">
                    {formatAlternatePowerLabel(s.sph, s.cyl)}
                  </span>
                  <span className="ml-2 text-xs text-[var(--brand-text-muted)]">
                    {availabilityLabel(s)}
                    {delta ? ` · ${delta}` : ""} · Waiting for customer
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
