"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PrescriptionWheelPicker } from "@/components/shop/prescription-wheel-picker";
import { RelatedLensCard } from "@/components/shop/related-lens-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/contexts/cart-context";
import { useOrderMode } from "@/contexts/order-mode-context";
import {
  buildCartLineId,
  formatPowerLabel,
  formatPowerRangeLabel,
  powerRangeFromOptions,
  sanitizePairQuantityInput,
  validatePrescriptionInOptions,
} from "@/lib/cart-utils";
import { coerceCrossCylForSph, resolveCrossPowerMeta } from "@/lib/cross-power";
import {
  formatAddValue,
  formatAxisValue,
  formatLensItemCoatingSummary,
  formatLensProductCardTitle,
  isSameLensPower,
  LENS_PRICE_PER_PAIR_LABEL,
} from "@/lib/lens-display";
import {
  fetchLensById,
  fetchRelatedLenses,
} from "@/lib/lenses-api";
import {
  coerceDisplayQuantity,
  formatPairQuantity,
  getDefaultDisplayQuantity,
  MIN_PAIR_QUANTITY,
  PAIR_QUANTITY_STEP,
  piecesFromDisplayQuantity,
  validateDisplayQuantityForMode,
} from "@/lib/order-quantity";
import {
  resolveAddOptions,
  resolveCrossCylRangeForSph,
  resolveCrossSphRangeForMax,
  resolveSelectableRange,
} from "@/lib/prescription-range";
import {
  PROGRESSIVE_EYE_OPTIONS,
  progressiveCartEyes,
  progressivePairQuantityRequired,
  piecesPerEyeFromDisplayQuantity,
  validateProgressivePairQuantity,
  type ProgressiveEyeOption,
} from "@/lib/progressive-eye";
import {
  shopCategoryDisplayTitle,
  shopCategoryToFilter,
  type ShopCategoryId,
} from "@/lib/shop-navigation";
import { setPendingOnBehalfSelection } from "@/lib/on-behalf-selection";
import { setPendingStockLensSelection } from "@/lib/stock-lens-selection";
import type { LensItem } from "@/lib/types/lens";
import { cn } from "@/lib/utils";
import { isWhiteCatalogLensId } from "@/lib/white-catalog";

export type LensProductDetailSelectResult = {
  lens: LensItem;
  quantity: number;
};

type LensProductDetailScreenProps = {
  lensId: string;
  category: ShopCategoryId;
  catalogItem: string;
  initialItem?: LensItem | null;
  mode?: "default" | "on-behalf-select" | "stock-select";
  backHref?: string;
  /** When set (e.g. embedded Add Stock), select returns here instead of navigating. */
  onSelected?: (selection: LensProductDetailSelectResult) => void;
  onCancel?: () => void;
};

export function LensProductDetailScreen({
  lensId,
  category,
  catalogItem,
  initialItem = null,
  mode = "default",
  backHref,
  onSelected,
  onCancel,
}: LensProductDetailScreenProps) {
  const router = useRouter();
  const isOnBehalfSelectMode = mode === "on-behalf-select";
  const isStockSelectMode = mode === "stock-select";
  const isSelectMode = isOnBehalfSelectMode || isStockSelectMode;
  const { addToCart, updateQuantity, items: cartItems } = useCart();
  const { mode: orderMode, isWholesale } = useOrderMode();
  const filter = shopCategoryToFilter(category);
  const categoryTitle = shopCategoryDisplayTitle(category);

  const [item, setItem] = useState<LensItem | null>(initialItem);
  const [loading, setLoading] = useState(!initialItem);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [relatedLenses, setRelatedLenses] = useState<LensItem[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const lensType = item?.lensType ?? filter;
  const showAdd = lensType !== "Single Vision";
  const showProgressiveEye = lensType === "Progressive";

  const selectableRange = useMemo(() => {
    if (!item) {
      return null;
    }
    return resolveSelectableRange(item);
  }, [item]);

  const crossMeta = useMemo(
    () => (item ? resolveCrossPowerMeta(item) : null),
    [item]
  );

  const addOptions = useMemo(
    () => (item && showAdd ? resolveAddOptions(item) : []),
    [item, showAdd]
  );

  const initialSph = selectableRange?.sph.options[0] ?? item?.sph ?? 0;
  const initialCyl =
    crossMeta && selectableRange
      ? coerceCrossCylForSph(
          initialSph,
          selectableRange.cyl?.options[0] ?? 0,
          crossMeta.maxCyl,
          crossMeta.cylStartRange
        )
      : (selectableRange?.cyl?.options[0] ?? item?.cyl ?? 0);
  const initialAdd = addOptions[0] ?? 1;

  const [sph, setSph] = useState<number>(initialSph);
  const [cyl, setCyl] = useState<number>(initialCyl);
  const [add, setAdd] = useState<number>(initialAdd);
  const [selectedEye, setSelectedEye] = useState<ProgressiveEyeOption>("LEFT");
  const [quantity, setQuantity] = useState(() =>
    String(getDefaultDisplayQuantity(orderMode))
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const bothEyesSelected =
    showProgressiveEye && progressivePairQuantityRequired(selectedEye);

  const effectiveSelectableRange = useMemo(() => {
    if (!selectableRange || !crossMeta) {
      return selectableRange;
    }

    const sphRange = resolveCrossSphRangeForMax(crossMeta);
    const cylRange = resolveCrossCylRangeForSph(sph, crossMeta);
    return {
      ...selectableRange,
      sph: sphRange,
      cyl: cylRange.options.length ? cylRange : selectableRange.cyl,
    };
  }, [sph, crossMeta, selectableRange]);

  const formQuantityText = quantity.trim();
  const displayQtyNumber = formQuantityText ? Number(formQuantityText) : 0;
  const totalPieces =
    displayQtyNumber > 0
      ? piecesFromDisplayQuantity(displayQtyNumber, "pair")
      : 0;
  const piecesPerEye =
    showProgressiveEye && displayQtyNumber > 0
      ? piecesPerEyeFromDisplayQuantity(displayQtyNumber, "pair", selectedEye)
      : totalPieces;

  useEffect(() => {
    if (initialItem) {
      setItem(initialItem);
      setLoading(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;

    async function loadLens() {
      setLoading(true);
      setLoadError(null);
      try {
        const lens = await fetchLensById(lensId, filter);
        if (!cancelled) {
          setItem(lens);
        }
      } catch {
        if (!cancelled) {
          setItem(null);
          setLoadError("Unable to load product details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLens();
    return () => {
      cancelled = true;
    };
  }, [lensId, filter, initialItem]);

  const isWhiteCatalogProduct = item ? isWhiteCatalogLensId(item.id) : false;

  useEffect(() => {
    if (!item) {
      return;
    }

    const range = resolveSelectableRange(item);
    const nextSph = range.sph.options[0] ?? item.sph ?? 0;
    const nextCyl =
      crossMeta && range.cyl
        ? coerceCrossCylForSph(
            nextSph,
            range.cyl.options[0] ?? 0,
            crossMeta.maxCyl,
            crossMeta.cylStartRange
          )
        : (range.cyl?.options[0] ?? item.cyl ?? 0);
    setSph(nextSph);
    setCyl(nextCyl);
    setAdd(resolveAddOptions(item)[0] ?? 1);
    setSelectedEye("LEFT");
    setQuantity(String(getDefaultDisplayQuantity(orderMode)));
    setError(null);
  }, [item, crossMeta, orderMode]);

  useEffect(() => {
    setQuantity(String(getDefaultDisplayQuantity(orderMode)));
  }, [orderMode]);

  useEffect(() => {
    if (!bothEyesSelected) {
      return;
    }
    const parsed = Number(quantity);
    if (
      Number.isFinite(parsed) &&
      Math.abs(parsed - Math.round(parsed)) > 1e-9
    ) {
      setQuantity(String(Math.max(1, Math.round(parsed))));
    }
  }, [bothEyesSelected, quantity]);

  useEffect(() => {
    if (!effectiveSelectableRange) {
      return;
    }

    const sphOpts = effectiveSelectableRange.sph.options;
    if (sphOpts.length > 0 && !sphOpts.some((opt) => Math.abs(opt - sph) < 0.001)) {
      setSph(sphOpts[0]!);
    }

    const cylOpts = effectiveSelectableRange.cyl?.options ?? [];
    if (cylOpts.length > 0 && !cylOpts.some((opt) => Math.abs(opt - cyl) < 0.001)) {
      if (crossMeta) {
        setCyl(coerceCrossCylForSph(sph, cyl, crossMeta.maxCyl, crossMeta.cylStartRange));
      } else {
        setCyl(cylOpts[0]!);
      }
    }

    if (showAdd && addOptions.length > 0 && !addOptions.some((opt) => Math.abs(opt - add) < 0.001)) {
      setAdd(addOptions[0]!);
    }
  }, [effectiveSelectableRange, addOptions, showAdd, sph, cyl, add, crossMeta]);

  useEffect(() => {
    if (!item?.id || !item.lensType || isWhiteCatalogLensId(item.id)) {
      setRelatedLenses([]);
      return;
    }

    const currentLens = item;
    const lensIdForFetch = item.id;
    let cancelled = false;

    async function loadRelated() {
      setRelatedLoading(true);
      try {
        const relatedItems = await fetchRelatedLenses(lensIdForFetch, filter);
        const filtered = relatedItems.filter(
          (related) => !isSameLensPower(related, currentLens)
        );
        if (!cancelled) {
          setRelatedLenses(filtered);
        }
      } catch {
        if (!cancelled) {
          setRelatedLenses([]);
        }
      } finally {
        if (!cancelled) {
          setRelatedLoading(false);
        }
      }
    }

    void loadRelated();
    return () => {
      cancelled = true;
    };
  }, [item, filter]);

  function handleSphChange(value: number) {
    setSph(value);
    if (crossMeta) {
      setCyl((currentCyl) =>
        coerceCrossCylForSph(value, currentCyl, crossMeta.maxCyl, crossMeta.cylStartRange)
      );
    }
    setError(null);
  }

  function handleCylChange(value: number) {
    setCyl(value);
    setError(null);
  }

  function adjustQuantity(direction: -1 | 1) {
    const step = bothEyesSelected ? 1 : PAIR_QUANTITY_STEP;
    const min = bothEyesSelected ? 1 : MIN_PAIR_QUANTITY;
    const parsed = Number.parseFloat(quantity);
    const current =
      Number.isFinite(parsed) && parsed > 0
        ? parsed
        : getDefaultDisplayQuantity(orderMode);
    const snapped = Math.round((current + direction * step) * 2) / 2;
    const next = Math.max(min, snapped);
    setQuantity(formatPairQuantity(next));
    setError(null);
  }

  const cartLinesForSelection = useMemo(() => {
    if (!item) {
      return null;
    }

    const cylForLine = effectiveSelectableRange?.cyl ? cyl : item.cyl ?? 0;
    const eyes = showProgressiveEye ? progressiveCartEyes(selectedEye) : [undefined];

    return eyes.map((eye) => {
      const lineId = buildCartLineId({
        id: item.id,
        crossPower: item.crossPower,
        sph,
        cyl: cylForLine,
        add: showAdd ? add : null,
        axis: item.axis,
        eye,
      });

      return cartItems.find((entry) => entry.cartLineId === lineId) ?? null;
    });
  }, [
    add,
    cartItems,
    cyl,
    item,
    selectedEye,
    showAdd,
    showProgressiveEye,
    sph,
    effectiveSelectableRange?.cyl,
  ]);

  const showsAddedState = useMemo(() => {
    if (!cartLinesForSelection || !formQuantityText) {
      return false;
    }
    if (piecesPerEye <= 0) {
      return false;
    }
    return cartLinesForSelection.every(
      (line) => line != null && line.cartQuantity === piecesPerEye
    );
  }, [cartLinesForSelection, piecesPerEye, formQuantityText]);

  const prescriptionHint = effectiveSelectableRange
    ? (() => {
        const sphOpts = effectiveSelectableRange.sph.options;
        const sphStart = sphOpts[0] ?? effectiveSelectableRange.sph.min;
        const sphEnd = sphOpts[sphOpts.length - 1] ?? effectiveSelectableRange.sph.max;
        let hint = `Select SPH (${formatPowerRangeLabel(sphStart, sphEnd)})`;
        if (effectiveSelectableRange.cyl?.options.length) {
          const cylOpts = effectiveSelectableRange.cyl.options;
          const cylStart = cylOpts[0] ?? effectiveSelectableRange.cyl.min;
          const cylEnd = cylOpts[cylOpts.length - 1] ?? effectiveSelectableRange.cyl.max;
          hint += ` and CYL (${formatPowerRangeLabel(cylStart, cylEnd)})`;
        }
        if (showAdd && addOptions.length > 0) {
          const addRange = powerRangeFromOptions(addOptions);
          hint += ` and ADD (${formatPowerRangeLabel(addRange.low, addRange.high)})`;
        }
        return `${hint}.`;
      })()
    : "Select prescription values for this lens.";

  function buildRelatedHref(related: LensItem) {
    if (isStockSelectMode) {
      return `/employee/procurement/lens/${related.id}?payload=${encodeURIComponent(JSON.stringify(related))}`;
    }
    if (isOnBehalfSelectMode) {
      return `/employee/orders/on-behalf/lens/${related.id}?payload=${encodeURIComponent(JSON.stringify(related))}`;
    }
    return `/shop/products/${related.id}?category=${category}&item=${encodeURIComponent(catalogItem)}`;
  }

  function buildSelectedLens(
    currentItem: LensItem,
    parsedCyl: number,
    parsedAdd: number | null,
    eye: string | undefined
  ): LensItem {
    return {
      id: currentItem.id,
      costPrice: currentItem.costPrice,
      price: currentItem.price,
      sph,
      cyl: parsedCyl,
      crossPower: currentItem.crossPower,
      axis: currentItem.axis,
      add: showAdd ? parsedAdd : null,
      eye,
      quantity: currentItem.quantity,
      createdAt: currentItem.createdAt,
      lensType: currentItem.lensType,
      brand: currentItem.brand,
      item: currentItem.item,
      coating: currentItem.coating,
      index: currentItem.index,
      selectableRange: currentItem.selectableRange,
    };
  }

  async function handleSubmit() {
    const currentItem = item;
    if (!currentItem) {
      return;
    }

    if (!effectiveSelectableRange) {
      setError("Unable to resolve prescription range.");
      return;
    }

    const sphError = validatePrescriptionInOptions(
      "SPH",
      String(sph),
      effectiveSelectableRange.sph.options
    );
    if (sphError) {
      setError(sphError);
      return;
    }

    let parsedCyl: number;
    if (effectiveSelectableRange.cyl) {
      const cylError = validatePrescriptionInOptions(
        "CYL",
        String(cyl),
        effectiveSelectableRange.cyl.options
      );
      if (cylError) {
        setError(cylError);
        return;
      }
      parsedCyl = cyl;
    } else {
      parsedCyl = currentItem.cyl ?? 0;
    }

    let parsedAdd: number | null = null;
    if (showAdd && addOptions.length > 0) {
      const addError = validatePrescriptionInOptions(
        "ADD",
        String(add),
        addOptions
      );
      if (addError) {
        setError(addError);
        return;
      }
      parsedAdd = add;
    }

    const parsedDisplayQty = Number(quantity);
    const progressiveQtyError = showProgressiveEye
      ? validateProgressivePairQuantity(selectedEye, parsedDisplayQty)
      : null;
    if (progressiveQtyError) {
      setError(progressiveQtyError);
      return;
    }
    const qtyError = validateDisplayQuantityForMode(
      parsedDisplayQty,
      "pair",
      orderMode,
      {
        wholePairsOnly: bothEyesSelected,
      }
    );
    if (qtyError) {
      setError(qtyError);
      return;
    }
    const parsedQty = piecesPerEyeFromDisplayQuantity(
      parsedDisplayQty,
      "pair",
      showProgressiveEye ? selectedEye : "LEFT"
    );
    const eyesToAdd = showProgressiveEye
      ? progressiveCartEyes(selectedEye)
      : [undefined];

    if (isSelectMode) {
      const eye = eyesToAdd[0];
      const updatedItem = buildSelectedLens(
        currentItem,
        parsedCyl,
        parsedAdd,
        eye
      );
      const selection = { lens: updatedItem, quantity: parsedQty };
      if (onSelected) {
        onSelected(selection);
        return;
      }
      if (isStockSelectMode) {
        setPendingStockLensSelection(selection);
        router.push(backHref ?? "/employee/procurement");
        return;
      }
      setPendingOnBehalfSelection(selection);
      router.push(backHref ?? "/employee/orders/on-behalf");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      for (const eye of eyesToAdd) {
        const updatedItem = buildSelectedLens(
          currentItem,
          parsedCyl,
          parsedAdd,
          eye
        );

        const lineId = buildCartLineId({
          id: updatedItem.id,
          crossPower: updatedItem.crossPower,
          sph,
          cyl: parsedCyl,
          add: parsedAdd,
          axis: currentItem.axis,
          eye,
        });
        const existingLine = cartItems.find((entry) => entry.cartLineId === lineId);

        if (existingLine) {
          await updateQuantity(lineId, parsedQty);
        } else {
          await addToCart(updatedItem, parsedQty);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to cart.");
    } finally {
      setSubmitting(false);
    }
  }

  const resolvedBackHref =
    backHref ?? `/shop/products?category=${category}&item=${encodeURIComponent(catalogItem)}`;

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!item || loadError) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center">
        <p className="text-sm font-medium text-[var(--brand-text-muted)]">
          {loadError ?? "Unable to load product details."}
        </p>
        <Button asChild className="rounded-xl bg-[var(--brand-primary)] font-bold">
          <Link href={resolvedBackHref}>Back to products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            asChild={!onCancel}
            onClick={onCancel}
            className="w-fit rounded-xl px-0 font-semibold text-[var(--brand-link)] hover:bg-[var(--brand-primary)]/10"
          >
            {onCancel ? (
              <>
                <ArrowLeft className="size-4" />
                {isStockSelectMode
                  ? "Back to Add stock"
                  : isOnBehalfSelectMode
                    ? "Back to order"
                    : `Back to ${catalogItem}`}
              </>
            ) : (
              <Link href={resolvedBackHref}>
                <ArrowLeft className="size-4" />
                {isOnBehalfSelectMode
                  ? "Back to order"
                  : isStockSelectMode
                    ? "Back to Add stock"
                    : `Back to ${catalogItem}`}
              </Link>
            )}
          </Button>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-link)]">
              {categoryTitle}
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-3xl">
              Lens details
            </h1>
          </div>
        </div>

        <section className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.35)]">
          {item.imageUrl ? (
            <div className="mb-4 overflow-hidden rounded-xl border border-[var(--brand-card-border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={formatLensProductCardTitle(item)}
                className="h-44 w-full object-cover sm:h-52"
              />
            </div>
          ) : null}
          <h2 className="text-2xl font-extrabold text-[var(--brand-text)]">
            {formatLensProductCardTitle(item)}
          </h2>
          <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
            {formatLensItemCoatingSummary(item)}
          </p>
          <p className="mt-2 text-base font-bold text-[var(--brand-text)]">
            {lensType}
          </p>
          <p className="mt-3 text-2xl font-extrabold text-[var(--brand-primary)]">
            {isWhiteCatalogProduct ? (
              "White catalog product"
            ) : (
              <>
                ₹{item.price}
                <span className="ml-1 text-sm font-bold text-[var(--brand-text-muted)]">
                  {LENS_PRICE_PER_PAIR_LABEL}
                </span>
              </>
            )}
          </p>
          {isWhiteCatalogProduct ? (
            <p className="mt-2 text-sm text-[var(--brand-text-muted)]">
              Select power from the white catalog range below.
            </p>
          ) : item.quantity > 0 ? (
            <p className="mt-2 text-xs font-semibold text-[var(--brand-success)]">
              {item.quantity} in stock
            </p>
          ) : (
            <p className="mt-2 text-xs font-semibold text-[var(--brand-text-muted)]">
              Out of stock
            </p>
          )}
        </section>

        <section>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
            Details
          </h3>
          <div className="overflow-hidden rounded-2xl border border-[var(--brand-card-border)]">
            <div className="grid grid-cols-4 bg-[color-mix(in_srgb,var(--brand-card)_85%,var(--brand-primary)_15%)] px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
              <span>SPH</span>
              <span>CYL</span>
              <span>ADD</span>
              <span>AXIS</span>
            </div>
            <div className="grid grid-cols-4 bg-[var(--brand-card)] px-2 py-4 text-center text-sm font-bold text-[var(--brand-text)]">
              <span>{formatPowerLabel(item.sph ?? 0)}</span>
              <span>
                {item.cyl != null ? formatPowerLabel(item.cyl) : "—"}
              </span>
              <span>{formatAddValue(item.add)}</span>
              <span>{formatAxisValue(item.axis)}</span>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
            Prescription
          </h3>
          {isWholesale ? (
            <p className="mb-1 text-sm font-bold text-[var(--brand-primary)]">
              You are able to order in pairs only.
            </p>
          ) : null}

          {showProgressiveEye ? (
            <div className="mb-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                Eye
              </p>
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-1.5">
                {PROGRESSIVE_EYE_OPTIONS.map((option) => {
                  const active = selectedEye === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSelectedEye(option.id);
                        setError(null);
                      }}
                      className={cn(
                        "rounded-xl px-2 py-2.5 text-center text-xs font-extrabold transition-colors sm:text-sm",
                        active
                          ? "bg-[var(--brand-primary)] text-[var(--brand-primary-text)] shadow-sm"
                          : "text-[var(--brand-text-muted)] hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-text)]"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {selectedEye === "BOTH" ? (
                <p className="text-sm font-medium text-[var(--brand-text-muted)]">
                  Adds one cart line for both eyes. Order in pairs only.
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="mb-4 text-sm leading-relaxed text-[var(--brand-text-muted)]">
            {prescriptionHint}
          </p>

          <div className="overflow-hidden rounded-2xl border border-[var(--brand-card-border)]">
            <div
              className={cn(
                "grid bg-[color-mix(in_srgb,var(--brand-card)_85%,var(--brand-primary)_15%)] px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]",
                showAdd ? "grid-cols-3" : "grid-cols-2"
              )}
            >
              <span>SPH</span>
              <span>CYL</span>
              {showAdd ? <span>ADD</span> : null}
            </div>
            <div
              className={cn(
                "grid items-center bg-[var(--brand-card)] px-2 py-2",
                showAdd ? "grid-cols-3" : "grid-cols-2"
              )}
            >
              <PrescriptionWheelPicker
                options={effectiveSelectableRange?.sph.options ?? []}
                value={sph}
                onChange={handleSphChange}
              />
              {effectiveSelectableRange?.cyl ? (
                <PrescriptionWheelPicker
                  options={effectiveSelectableRange.cyl.options}
                  value={cyl}
                  onChange={handleCylChange}
                />
              ) : (
                <div className="flex h-[132px] items-center justify-center text-[var(--brand-text-muted)]">
                  —
                </div>
              )}
              {showAdd && addOptions.length > 0 ? (
                <PrescriptionWheelPicker
                  options={addOptions}
                  value={add}
                  onChange={(value) => {
                    setAdd(value);
                    setError(null);
                  }}
                />
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                Qty
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustQuantity(-1)}
                  className="flex size-10 items-center justify-center rounded-xl border border-[var(--brand-primary)]/60 text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary)]/10 active:scale-95"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-4" />
                </button>
                <Input
                  value={quantity}
                  onChange={(e) => {
                    const sanitized = sanitizePairQuantityInput(
                      e.target.value
                    );
                    if (sanitized === "") {
                      setQuantity("");
                      setError(null);
                      return;
                    }
                    setQuantity(coerceDisplayQuantity(sanitized));
                    setError(null);
                  }}
                  onBlur={() => {
                    const parsed = Number.parseFloat(quantity);
                    if (!Number.isFinite(parsed) || parsed <= 0) {
                      return;
                    }
                    const min = bothEyesSelected ? 1 : MIN_PAIR_QUANTITY;
                    const snapped = Math.round(parsed * 2) / 2;
                    setQuantity(formatPairQuantity(Math.max(min, snapped)));
                  }}
                  inputMode="decimal"
                  className="h-10 w-[72px] rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] px-2 text-center text-base font-bold tabular-nums"
                  placeholder={String(getDefaultDisplayQuantity(orderMode))}
                />
                <button
                  type="button"
                  onClick={() => adjustQuantity(1)}
                  className="flex size-10 items-center justify-center rounded-xl border border-[var(--brand-primary)]/60 text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary)]/10 active:scale-95"
                  aria-label="Increase quantity"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <p className="text-center text-sm font-medium text-[var(--brand-danger)]">
            {error}
          </p>
        ) : null}

        <Button
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className={cn(
            "h-14 w-full rounded-2xl text-base font-extrabold shadow-[0_8px_24px_-8px_rgba(240,161,50,0.55)]",
            !isSelectMode && showsAddedState
              ? "bg-[color-mix(in_srgb,var(--brand-primary)_75%,#2d8a4e_25%)] text-[var(--brand-primary-text)]"
              : "bg-gradient-to-r from-[#f5ad42] to-[#e8941f] text-[var(--brand-primary-text)] hover:opacity-95",
            submitting && "opacity-70"
          )}
        >
          {submitting ? (
            <Loader2 className="size-5 animate-spin" />
          ) : !isSelectMode && showsAddedState ? (
            <CheckCircle2 className="size-5" />
          ) : isSelectMode ? (
            <ShoppingBag className="size-5" />
          ) : (
            <ShoppingCart className="size-5" />
          )}
          {submitting
            ? isSelectMode
              ? "Selecting…"
              : "Adding…"
            : isStockSelectMode
              ? "Select for stock"
              : isOnBehalfSelectMode
                ? "Select product"
                : showsAddedState
                  ? "Added to cart"
                  : "Add to cart"}
          {!submitting && (isSelectMode || !showsAddedState) ? (
            <ArrowRight className="size-5" />
          ) : null}
        </Button>

        {(mode === "default" || (isStockSelectMode && !onSelected)) &&
        !isWhiteCatalogProduct ? (
        <section className="border-t border-[var(--brand-card-border)] pt-8">
          <h3 className="mb-4 text-center text-lg font-extrabold text-[var(--brand-text)]">
            Related Products
          </h3>
          {relatedLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : relatedLenses.length > 0 ? (
            <div className="space-y-3">
              {relatedLenses.map((related) => (
                <RelatedLensCard
                  key={related.id}
                  item={related}
                  href={buildRelatedHref(related)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-[var(--brand-text-muted)]">
              No related lenses found for this product.
            </p>
          )}
        </section>
        ) : null}
      </div>
    </div>
  );
}
