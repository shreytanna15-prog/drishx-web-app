"use client";

import { useEffect, useMemo, useState } from "react";

import { formatPowerLabel } from "@/lib/cart-utils";
import { fetchLensById } from "@/lib/lenses-api";
import { getOrderLensDetails } from "@/lib/orders-api";
import {
  resolveAddOptions,
  resolveSelectableRange,
} from "@/lib/prescription-range";
import { formatLensType, type FilterOption, type SelectableRange } from "@/lib/types/lens";
import type { OrderRecord } from "@/lib/types/orders";
import { cn } from "@/lib/utils";

export type ReplacementPowerValue = {
  sph: number | null;
  cyl: number | null;
  add: number | null;
  axis: number | null;
};

type ReplacementPowerFieldsProps = {
  order: OrderRecord;
  enabled: boolean;
  value: ReplacementPowerValue;
  onChange: (value: ReplacementPowerValue) => void;
};

function snapToOption(value: number | null, options: number[]): number | null {
  if (value === null || options.length === 0) return options[0] ?? null;
  const match = options.find((option) => Math.abs(option - value) < 0.001);
  if (match !== undefined) return match;
  return options.reduce((best, option) =>
    Math.abs(option - value) < Math.abs(best - value) ? option : best
  );
}

function formatCurrentPower(order: OrderRecord): string {
  const details = getOrderLensDetails(order);
  if (!details) return "—";
  const parts = [
    details.sph != null ? `SPH ${formatPowerLabel(Number(details.sph))}` : null,
    details.cyl != null ? `CYL ${formatPowerLabel(Number(details.cyl))}` : null,
    details.add != null ? `ADD ${formatPowerLabel(Number(details.add))}` : null,
    details.axis != null ? `AXIS ${details.axis}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function toFilterOption(lensType: string): FilterOption | null {
  const formatted = formatLensType(lensType);
  if (
    formatted === "Single Vision" ||
    formatted === "Kryptok" ||
    formatted === "Progressive"
  ) {
    return formatted;
  }
  return null;
}

function getCatalogLensId(order: OrderRecord): string | null {
  return (
    order.singleVisionLens?.id ??
    order.kryptokLens?.id ??
    order.progressiveLens?.id ??
    null
  );
}

const selectClass =
  "h-10 w-full rounded-lg border border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] px-3 text-sm text-[var(--brand-text)]";

export function ReplacementPowerFields({
  order,
  enabled,
  value,
  onChange,
}: ReplacementPowerFieldsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<SelectableRange | null>(null);
  const [supportsAdd, setSupportsAdd] = useState(false);

  const catalogId = getCatalogLensId(order);
  const filterOption = toFilterOption(order.lensType);
  const canSelectPower = Boolean(enabled && catalogId && filterOption);

  const currentLabel = useMemo(() => formatCurrentPower(order), [order]);
  const addOptions = useMemo(
    () => (supportsAdd ? resolveAddOptions() : []),
    [supportsAdd]
  );

  useEffect(() => {
    if (!canSelectPower || !catalogId || !filterOption) {
      setRange(null);
      setSupportsAdd(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const lens = await fetchLensById(catalogId, filterOption);
        if (cancelled) return;
        const selectable = resolveSelectableRange(lens);
        setRange(selectable);
        const showAdd = filterOption !== "Single Vision";
        setSupportsAdd(showAdd);

        const details = getOrderLensDetails(order);
        const nextSph = snapToOption(
          value.sph ?? (details?.sph != null ? Number(details.sph) : null),
          selectable.sph.options
        );
        const nextCyl = selectable.cyl
          ? snapToOption(
              value.cyl ?? (details?.cyl != null ? Number(details.cyl) : null),
              selectable.cyl.options
            )
          : null;
        const nextAdd = showAdd
          ? snapToOption(
              value.add ?? (details?.add != null ? Number(details.add) : null),
              resolveAddOptions()
            )
          : null;

        onChange({
          sph: nextSph,
          cyl: nextCyl,
          add: nextAdd,
          axis: value.axis ?? details?.axis ?? null,
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load product power range."
          );
          setRange(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally only re-fetch when product / enablement changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSelectPower, catalogId, filterOption, order.id]);

  if (!enabled) return null;

  if (!catalogId || !filterOption) {
    return (
      <div className="rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-card)]/60 px-3 py-2 sm:col-span-2">
        <p className="text-xs font-semibold text-[var(--brand-text-muted)]">
          Current power
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--brand-text)]">
          {currentLabel}
        </p>
        <p className="mt-2 text-xs text-[var(--brand-text-muted)]">
          Power selection is available for catalog products only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-card)]/60 px-3 py-2">
        <p className="text-xs font-semibold text-[var(--brand-text-muted)]">
          Current power
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--brand-text)]">
          {currentLabel}
        </p>
      </div>

      {loading ? (
        <p className="text-xs text-[var(--brand-text-muted)]">
          Loading available powers…
        </p>
      ) : error ? (
        <p className="text-xs font-medium text-[var(--brand-danger)]">{error}</p>
      ) : range ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[var(--brand-text-muted)]">
              New SPH
            </span>
            <select
              className={selectClass}
              value={value.sph ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  sph: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            >
              {range.sph.options.map((option) => (
                <option key={option} value={option}>
                  {formatPowerLabel(option)}
                </option>
              ))}
            </select>
          </label>

          {range.cyl ? (
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[var(--brand-text-muted)]">
                New CYL
              </span>
              <select
                className={selectClass}
                value={value.cyl ?? ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    cyl: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              >
                {range.cyl.options.map((option) => (
                  <option key={option} value={option}>
                    {formatPowerLabel(option)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {supportsAdd ? (
            <label className={cn("block space-y-1", !range.cyl && "sm:col-span-2")}>
              <span className="text-xs font-semibold text-[var(--brand-text-muted)]">
                New ADD
              </span>
              <select
                className={selectClass}
                value={value.add ?? ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    add: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              >
                {addOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatPowerLabel(option)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
