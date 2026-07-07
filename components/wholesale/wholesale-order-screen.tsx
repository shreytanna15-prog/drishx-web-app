"use client";

import {
  ArrowLeft,
  ChevronDown,
  Grid3X3,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { WholesaleQtyMatrix } from "@/components/wholesale/wholesale-qty-matrix";
import { WholesaleRangePicker } from "@/components/wholesale/wholesale-range-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/cart-context";
import { useOrderMode } from "@/contexts/order-mode-context";
import {
  formatPowerLabel,
  sanitizePositiveIntegerInput,
} from "@/lib/cart-utils";
import { resolveCrossPowerMeta } from "@/lib/cross-power";
import {
  formatAddAxisLabel,
  formatLensItemCoatingSummary,
  formatSphCylSlash,
  LENS_PRICE_PER_PAIR_LABEL,
} from "@/lib/lens-display";
import { piecesFromDisplayQuantity } from "@/lib/order-quantity";
import { resolveSelectableRange } from "@/lib/prescription-range";
import { toApiLensType } from "@/lib/types/lens";
import type { LensItem } from "@/lib/types/lens";
import {
  buildQtyMapFromMatrixSpec,
  buildWholesaleMatrixSpec,
  collectQtyEntriesFromSpec,
  countMatrixCells,
  countVisibleMatrixCells,
  MATRIX_INITIAL_COLS,
  MATRIX_INITIAL_ROWS,
  MATRIX_LOAD_MORE_COLS,
  MATRIX_LOAD_MORE_ROWS,
  yieldToUi,
  type BuildMatrixParams,
} from "@/lib/wholesale-matrix";
import {
  buildWholesaleSpecFromOrderState,
} from "@/lib/wholesale-cart";
import {
  getDefaultRangeEndpoints,
  resolveWholesaleBoundOptions,
} from "@/lib/wholesale-range-options";
import {
  buildPowerList,
  defaultWholesaleGridMode,
  resolveWholesalePowerProfile,
} from "@/lib/wholesale-powers";

type QtyMap = Record<string, string>;

function parseLensPayload(raw: string | null): LensItem | null {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as LensItem;
  } catch {
    return null;
  }
}

function normalizePairsText(text: string): string {
  const sanitized = sanitizePositiveIntegerInput(text);
  if (sanitized === "") return "";
  const n = Number(sanitized);
  if (!Number.isInteger(n) || n < 1) return "";
  return String(n);
}

export function WholesaleOrderScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const item = useMemo(
    () => parseLensPayload(searchParams.get("payload")),
    [searchParams]
  );
  const { addWholesaleBatchToCart } = useCart();
  const { setMode } = useOrderMode();

  const selectableRange = useMemo(
    () => (item ? resolveSelectableRange(item) : null),
    [item]
  );
  const boundOptions = useMemo(
    () => (item ? resolveWholesaleBoundOptions(item) : { sph: [], cyl: [], add: [] }),
    [item]
  );
  const powerProfile = useMemo(
    () => (item ? resolveWholesalePowerProfile(item) : "compound"),
    [item]
  );
  const gridMode = useMemo(
    () => defaultWholesaleGridMode(powerProfile),
    [powerProfile]
  );
  const crossPowerMeta = useMemo(
    () => (item ? resolveCrossPowerMeta(item) : null),
    [item]
  );
  const showSphRange = powerProfile !== "cyl-only";
  const showCylRange = powerProfile !== "sph-only";

  useEffect(() => {
    setMode("wholesale");
  }, [setMode]);

  const [sphFrom, setSphFrom] = useState(0);
  const [sphTo, setSphTo] = useState(0);
  const [sphStep, setSphStep] = useState(0.25);
  const [cylFrom, setCylFrom] = useState(0);
  const [cylTo, setCylTo] = useState(0);
  const [cylStep, setCylStep] = useState(0.25);
  const [addFrom, setAddFrom] = useState(1);
  const [addTo, setAddTo] = useState(3);
  const [addStep, setAddStep] = useState(0.25);
  const [pairsDefault, setPairsDefault] = useState("1");
  const [qtyMap, setQtyMap] = useState<QtyMap>({});
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [visibleRowCount, setVisibleRowCount] = useState(MATRIX_INITIAL_ROWS);
  const [visibleColCount, setVisibleColCount] = useState(MATRIX_INITIAL_COLS);

  useEffect(() => {
    if (!item) return;

    const bounds = resolveWholesaleBoundOptions(item);
    const sph = getDefaultRangeEndpoints(bounds.sph);
    const cyl = getDefaultRangeEndpoints(bounds.cyl);
    const add = getDefaultRangeEndpoints(bounds.add);

    setSphFrom(sph.from);
    setSphTo(sph.to);
    setCylFrom(cyl.from);
    setCylTo(cyl.to);
    setAddFrom(add.from);
    setAddTo(add.to);
    setSphStep(0.25);
    setCylStep(0.25);
    setAddStep(0.25);
    setQtyMap({});
    setError(null);
    setVisibleRowCount(MATRIX_INITIAL_ROWS);
    setVisibleColCount(MATRIX_INITIAL_COLS);
  }, [item?.id]);

  const rangeHint = useMemo(() => {
    if (!selectableRange) return null;
    const parts: string[] = [];
    if (powerProfile !== "cyl-only") {
      const sphOpts = selectableRange.sph.options;
      const sphStart = sphOpts[0] ?? selectableRange.sph.min;
      const sphEnd = sphOpts[sphOpts.length - 1] ?? selectableRange.sph.max;
      parts.push(
        `SPH ${formatPowerLabel(sphStart)} to ${formatPowerLabel(sphEnd)}`
      );
    }
    if (powerProfile !== "sph-only" && boundOptions.cyl.length > 0) {
      const cylStart = boundOptions.cyl[0]!;
      const cylEnd = boundOptions.cyl[boundOptions.cyl.length - 1]!;
      parts.push(
        `CYL ${formatPowerLabel(cylStart)} to ${formatPowerLabel(cylEnd)}`
      );
    }
    return parts.length > 0 ? parts.join(" · ") : null;
  }, [boundOptions.cyl, powerProfile, selectableRange]);

  const sphList = useMemo(() => {
    if (!Number.isFinite(sphStep) || sphStep <= 0) return [];
    return buildPowerList(sphFrom, sphTo, sphStep);
  }, [sphFrom, sphTo, sphStep]);

  const cylList = useMemo(() => {
    if (!Number.isFinite(cylStep) || cylStep <= 0) return [];
    return buildPowerList(cylFrom, cylTo, cylStep);
  }, [cylFrom, cylTo, cylStep]);

  const isKryptok = item?.lensType === "Kryptok";
  const isProgressive = item?.lensType === "Progressive";
  const isBifocalLens = isKryptok || isProgressive;
  const isSingleVision = item?.lensType === "Single Vision";
  const productAxis = item?.axis ?? null;

  const addList = useMemo(() => {
    if (!isBifocalLens) return [];
    if (!Number.isFinite(addStep) || addStep <= 0) return [];
    return buildPowerList(addFrom, addTo, addStep);
  }, [addFrom, addStep, addTo, isBifocalLens]);

  const matrixParams = useMemo(
    (): BuildMatrixParams => ({
      mode: gridMode,
      isBifocalLens,
      isSingleVision,
      sphList,
      cylList,
      addList,
      productAxis,
      crossPowerMeta,
    }),
    [
      addList,
      crossPowerMeta,
      cylList,
      gridMode,
      isBifocalLens,
      isSingleVision,
      productAxis,
      sphList,
    ]
  );

  const matrixSpec = useMemo(
    () => buildWholesaleMatrixSpec(matrixParams),
    [matrixParams]
  );

  const hasGeneratedGrid = Object.keys(qtyMap).length > 0;

  const visibleMatrixRows = useMemo(
    () => matrixSpec?.rows.slice(0, visibleRowCount) ?? [],
    [matrixSpec, visibleRowCount]
  );

  const visibleMatrixCols = useMemo(
    () => matrixSpec?.cols.slice(0, visibleColCount) ?? [],
    [matrixSpec, visibleColCount]
  );

  const totalMatrixCells = useMemo(
    () => (matrixSpec ? countMatrixCells(matrixSpec) : 0),
    [matrixSpec]
  );

  const visibleMatrixCells = useMemo(
    () =>
      matrixSpec
        ? countVisibleMatrixCells(matrixSpec, visibleRowCount, visibleColCount)
        : 0,
    [matrixSpec, visibleColCount, visibleRowCount]
  );

  const hasMoreRows = matrixSpec
    ? visibleMatrixRows.length < matrixSpec.rows.length
    : false;
  const hasMoreCols = matrixSpec
    ? visibleMatrixCols.length < matrixSpec.cols.length
    : false;

  useEffect(() => {
    setVisibleRowCount(MATRIX_INITIAL_ROWS);
    setVisibleColCount(MATRIX_INITIAL_COLS);
  }, [powerProfile]);

  const title = item ? `${item.brand || "Lens"} • Wholesale` : "Wholesale";

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setQtyMap({});

    const defaultPairs = Number(pairsDefault.trim());
    if (!Number.isInteger(defaultPairs) || defaultPairs < 1) {
      setError("Default pairs must be at least 1.");
      setGenerating(false);
      return;
    }

    if (showSphRange && sphList.length === 0) {
      setError("Enter a valid SPH range and step.");
      setGenerating(false);
      return;
    }
    if (showCylRange && cylList.length === 0) {
      setError("Enter a valid CYL range and step.");
      setGenerating(false);
      return;
    }
    if (isBifocalLens && addList.length === 0) {
      setError("Enter a valid ADD range (+1 to +3) and step.");
      setGenerating(false);
      return;
    }

    await yieldToUi();

    const spec = buildWholesaleMatrixSpec(matrixParams);
    if (!spec || countMatrixCells(spec) === 0) {
      setError("No valid combinations for the selected ranges.");
      setGenerating(false);
      return;
    }

    const next = await buildQtyMapFromMatrixSpec(spec, defaultPairs);
    if (Object.keys(next).length === 0) {
      setError("No valid combinations for the selected ranges.");
      setGenerating(false);
      return;
    }

    setQtyMap(next);
    setVisibleRowCount(MATRIX_INITIAL_ROWS);
    setVisibleColCount(MATRIX_INITIAL_COLS);
    setGenerating(false);
  }

  function handleLoadMoreMatrix() {
    if (!matrixSpec) return;
    setVisibleRowCount((current) =>
      Math.min(current + MATRIX_LOAD_MORE_ROWS, matrixSpec.rows.length)
    );
    setVisibleColCount((current) =>
      Math.min(current + MATRIX_LOAD_MORE_COLS, matrixSpec.cols.length)
    );
  }

  function handleMatrixQtyChange(key: string, text: string) {
    setQtyMap((current) => ({ ...current, [key]: normalizePairsText(text) }));
  }

  function totalPairsSelected(): number {
    if (matrixSpec && hasGeneratedGrid) {
      return collectQtyEntriesFromSpec(matrixSpec, qtyMap, matrixParams).reduce(
        (sum, entry) => sum + entry.pairs,
        0
      );
    }
    return Object.values(qtyMap).reduce((sum, v) => {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1) return sum;
      return sum + n;
    }, 0);
  }

  async function handleAddAllToCart() {
    if (!item || addingToCart) return;

    const entries = matrixSpec
      ? collectQtyEntriesFromSpec(matrixSpec, qtyMap, matrixParams)
      : [];

    if (entries.length === 0) {
      setError("Enter at least 1 quantity in the grid.");
      return;
    }

    const defaultPairs = Number(pairsDefault);
    if (!Number.isInteger(defaultPairs) || defaultPairs < 1) {
      setError("Enter a valid default pairs value.");
      return;
    }

    setAddingToCart(true);
    setError(null);

    const wholesaleSpec = buildWholesaleSpecFromOrderState({
      sphFrom,
      sphTo,
      sphStep,
      cylFrom,
      cylTo,
      cylStep,
      addFrom,
      addTo,
      addStep,
      gridMode,
      defaultPairsPerCell: defaultPairs,
      qtyMap,
      productAxis,
      isBifocalLens,
      isSingleVision,
      crossPower: item.crossPower ?? null,
      showSphRange,
      showCylRange,
    });

    try {
      const { expandedLineCount } = await addWholesaleBatchToCart({
        lensId: item.id,
        lensType: toApiLensType(item.lensType ?? "Progressive"),
        unitPrice: item.price,
        brand: item.brand,
        coating: item.coating,
        item: item.item,
        lensTypeLabel: item.lensType ?? "Progressive",
        ranges: wholesaleSpec.ranges,
        gridMode: wholesaleSpec.gridMode,
        defaultPairsPerCell: wholesaleSpec.defaultPairsPerCell,
        qtyOverrides: wholesaleSpec.qtyOverrides,
        productAxis: wholesaleSpec.productAxis,
        isBifocalLens: wholesaleSpec.isBifocalLens,
        isSingleVision: wholesaleSpec.isSingleVision,
        crossPower: wholesaleSpec.crossPower,
      });

      if (expandedLineCount > 0) {
        router.push("/cart");
        return;
      }

      setError("Could not add wholesale batch to cart.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to cart.");
    } finally {
      setAddingToCart(false);
    }
  }

  const totalPairs = totalPairsSelected();
  const showLoadMoreBar =
    hasGeneratedGrid &&
    matrixSpec != null &&
    (hasMoreRows || hasMoreCols);
  const matrixRowProgress = matrixSpec
    ? Math.round((visibleMatrixRows.length / matrixSpec.rows.length) * 100)
    : 0;
  const matrixColProgress = matrixSpec
    ? Math.round((visibleMatrixCols.length / matrixSpec.cols.length) * 100)
    : 0;

  if (!item) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center">
        <p className="text-sm font-medium text-[var(--brand-text-muted)]">
          Unable to load product details.
        </p>
        <Button asChild className="rounded-xl bg-[var(--brand-primary)] font-bold">
          <Link href="/wholesale">Back to wholesale</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-4xl flex-1 px-4 py-6 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 md:pb-28">
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          asChild
          className="size-10 rounded-xl px-0 text-[var(--brand-link)] hover:bg-[var(--brand-primary)]/10"
        >
          <Link href="/wholesale" aria-label="Back">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="truncate text-xl font-extrabold text-[var(--brand-text)] sm:text-2xl">
          {title}
        </h1>
      </div>

      <div className="space-y-6">
        <Card className="rounded-2xl border-[var(--brand-card-border)] bg-[var(--brand-card)] py-0 shadow-none">
          <CardContent className="p-5">
            <h2 className="text-xl font-extrabold text-[var(--brand-text)]">
              {item.brand || "Lens"}
            </h2>
            <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
              {formatLensItemCoatingSummary(item)}
            </p>
            <p className="mt-2 text-base font-bold text-[var(--brand-text)]">
              {formatSphCylSlash(item)}
            </p>
            {isBifocalLens ? (
              <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
                {formatAddAxisLabel(item)}
              </p>
            ) : null}
            <p className="mt-3 text-lg font-extrabold text-[var(--brand-primary)]">
              ₹{item.price}
              <span className="ml-1 text-sm font-bold text-[var(--brand-text-muted)]">
                {LENS_PRICE_PER_PAIR_LABEL}
              </span>
            </p>
            <p className="mt-2 text-sm font-bold text-[var(--brand-primary)]">
              Wholesale orders are in pairs only.
            </p>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
              Ranges
            </h3>
            {rangeHint ? (
              <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
                {rangeHint}
              </p>
            ) : null}
          </div>

          {showSphRange ? (
            <div className="space-y-2">
              <p className="text-sm font-bold text-[var(--brand-text)]">SPH</p>
              <WholesaleRangePicker
                from={sphFrom}
                to={sphTo}
                step={sphStep}
                boundOptions={boundOptions.sph}
                onFromChange={setSphFrom}
                onToChange={setSphTo}
                onStepChange={setSphStep}
              />
            </div>
          ) : null}

          {showCylRange ? (
            <div className="space-y-2">
              <p className="text-sm font-bold text-[var(--brand-text)]">CYL</p>
              <WholesaleRangePicker
                from={cylFrom}
                to={cylTo}
                step={cylStep}
                boundOptions={boundOptions.cyl}
                onFromChange={setCylFrom}
                onToChange={setCylTo}
                onStepChange={setCylStep}
              />
            </div>
          ) : null}

          {isBifocalLens ? (
            <div className="space-y-2">
              <p className="text-sm font-bold text-[var(--brand-text)]">ADD</p>
              <p className="text-xs font-medium text-[var(--brand-text-muted)]">
                Common for SPH and CYL
              </p>
              <WholesaleRangePicker
                from={addFrom}
                to={addTo}
                step={addStep}
                boundOptions={boundOptions.add}
                onFromChange={setAddFrom}
                onToChange={setAddTo}
                onStepChange={setAddStep}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-[var(--brand-text)]">
                Default pairs
              </label>
              <Input
                value={pairsDefault}
                onChange={(e) =>
                  setPairsDefault(normalizePairsText(e.target.value))
                }
                inputMode="numeric"
                className="h-11 w-24 rounded-xl text-center font-bold"
                placeholder="1"
              />
            </div>
            <Button
              onClick={() => void handleGenerate()}
              disabled={generating}
              className="h-11 rounded-xl bg-[var(--brand-primary)] font-bold text-[var(--brand-primary-text)]"
            >
              {generating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Grid3X3 className="size-4" />
              )}
              {generating ? "Generating…" : "Generate"}
            </Button>
          </div>

          {error ? (
            <p className="text-sm font-medium text-[var(--brand-danger)]">
              {error}
            </p>
          ) : null}
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
            Quantity matrix
          </h3>

          {generating ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] py-16">
              <Loader2 className="size-8 animate-spin text-[var(--brand-primary)]" />
              <p className="text-sm text-[var(--brand-text-muted)]">
                Building quantity matrix…
              </p>
            </div>
          ) : !hasGeneratedGrid || !matrixSpec ? (
            <div className="rounded-2xl border border-dashed border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-12 text-center">
              <p className="text-sm text-[var(--brand-text-muted)]">
                Click &quot;Generate&quot; to create the matrix.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-[var(--brand-text-muted)]">
                Showing {visibleMatrixRows.length} of {matrixSpec.rows.length}{" "}
                row{matrixSpec.rows.length === 1 ? "" : "s"} ·{" "}
                {visibleMatrixCols.length} of {matrixSpec.cols.length} col
                {matrixSpec.cols.length === 1 ? "" : "s"} · {visibleMatrixCells}{" "}
                visible · {totalMatrixCells} total pair
                {totalMatrixCells === 1 ? "" : "s"}
              </p>
              <WholesaleQtyMatrix
                spec={matrixSpec}
                visibleRows={visibleMatrixRows}
                visibleCols={visibleMatrixCols}
                qtyMap={qtyMap}
                defaultPairs={pairsDefault.trim() || "1"}
                onQtyChange={handleMatrixQtyChange}
              />

              <div className="space-y-3 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4">
                <p className="text-center text-xs font-medium text-[var(--brand-text-muted)]">
                  Enter quantities in pairs.
                </p>

                {showLoadMoreBar ? (
                  <div className="space-y-3 border-t border-[var(--brand-card-border)] pt-4">
                    <div className="flex items-center justify-center gap-3 text-xs font-semibold text-[var(--brand-text-muted)]">
                      {hasMoreRows ? (
                        <span>
                          Rows {visibleMatrixRows.length}/{matrixSpec.rows.length}
                        </span>
                      ) : null}
                      {hasMoreRows && hasMoreCols ? (
                        <span aria-hidden>·</span>
                      ) : null}
                      {hasMoreCols ? (
                        <span>
                          Cols {visibleMatrixCols.length}/{matrixSpec.cols.length}
                        </span>
                      ) : null}
                    </div>

                    {hasMoreRows ? (
                      <div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--brand-card-border)_70%,transparent)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#f5ad42] to-[#e8941f] transition-all duration-300"
                          style={{ width: `${matrixRowProgress}%` }}
                        />
                      </div>
                    ) : null}

                    {hasMoreCols && !hasMoreRows ? (
                      <div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--brand-card-border)_70%,transparent)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#f5ad42] to-[#e8941f] transition-all duration-300"
                          style={{ width: `${matrixColProgress}%` }}
                        />
                      </div>
                    ) : null}

                    <Button
                      variant="outline"
                      onClick={handleLoadMoreMatrix}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-[var(--brand-primary)]/30 bg-[color-mix(in_srgb,var(--brand-card)_92%,var(--brand-primary)_8%)] font-extrabold text-[var(--brand-primary)] shadow-sm transition hover:border-[var(--brand-primary)]/50 hover:bg-[var(--brand-primary)]/10"
                    >
                      <ChevronDown className="size-4 shrink-0" />
                      Load more
                      {hasMoreRows ? (
                        <span className="ml-1 rounded-full bg-[var(--brand-primary)]/15 px-2 py-0.5 text-[11px] font-extrabold">
                          {matrixSpec.rows.length - visibleMatrixRows.length} rows
                        </span>
                      ) : null}
                      {hasMoreCols ? (
                        <span className="ml-1 rounded-full bg-[var(--brand-primary)]/15 px-2 py-0.5 text-[11px] font-extrabold">
                          {matrixSpec.cols.length - visibleMatrixCols.length} cols
                        </span>
                      ) : null}
                    </Button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 border-t border-[var(--brand-card-border)] bg-[var(--brand-header-bg)]/95 px-4 py-3 backdrop-blur-md md:bottom-0">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[var(--brand-text)]">
              {totalPairs} pair{totalPairs === 1 ? "" : "s"} selected
            </p>
            <p className="text-xs text-[var(--brand-text-muted)]">
              Will add multiple lines to cart
            </p>
          </div>
          <Button
            onClick={() => void handleAddAllToCart()}
            disabled={totalPairs < 1 || addingToCart}
            className="h-11 rounded-xl bg-gradient-to-r from-[#f5ad42] to-[#e8941f] px-5 font-extrabold text-[var(--brand-primary-text)]"
          >
            {addingToCart ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShoppingCart className="size-4" />
            )}
            {addingToCart ? "Adding…" : "Add to cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
