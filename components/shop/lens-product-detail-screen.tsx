"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PrescriptionWheelPicker } from "@/components/shop/prescription-wheel-picker";
import { RelatedLensCard } from "@/components/shop/related-lens-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/contexts/cart-context";
import {
  buildCartLineId,
  formatPowerLabel,
  powerRangeFromOptions,
  sanitizePositiveIntegerInput,
  validatePrescriptionInOptions,
} from "@/lib/cart-utils";
import {
  formatAddValue,
  formatAxisValue,
  formatLensItemCoatingSummary,
  isSameLensPower,
  LENS_PRICE_PER_PAIR_LABEL,
} from "@/lib/lens-display";
import {
  fetchLensById,
  fetchProductSiblings,
  fetchRelatedLenses,
} from "@/lib/lenses-api";
import {
  coerceDisplayQuantity,
  getDefaultDisplayQuantity,
  getDefaultQuantityUnit,
  piecesFromDisplayQuantity,
  validateDisplayQuantityForMode,
  type QuantityUnit,
} from "@/lib/order-quantity";
import {
  resolveAddOptions,
  resolveSelectableRange,
  restrictSelectableRangeForCheaperSiblings,
} from "@/lib/prescription-range";
import {
  shopCategoryDisplayTitle,
  shopCategoryToFilter,
  type ShopCategoryId,
} from "@/lib/shop-navigation";
import type { LensItem } from "@/lib/types/lens";
import { cn } from "@/lib/utils";

const ORDER_MODE = "wholesale" as const;

type LensProductDetailScreenProps = {
  lensId: string;
  category: ShopCategoryId;
  catalogItem: string;
};

export function LensProductDetailScreen({
  lensId,
  category,
  catalogItem,
}: LensProductDetailScreenProps) {
  const { addToCart, updateQuantity, items: cartItems } = useCart();
  const filter = shopCategoryToFilter(category);
  const categoryTitle = shopCategoryDisplayTitle(category);

  const [item, setItem] = useState<LensItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [relatedLenses, setRelatedLenses] = useState<LensItem[]>([]);
  const [productSiblings, setProductSiblings] = useState<LensItem[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const lensType = item?.lensType ?? filter;
  const showAdd = lensType !== "Single Vision";

  const selectableRange = useMemo(() => {
    if (!item) {
      return null;
    }
    const base = resolveSelectableRange(item);
    return restrictSelectableRangeForCheaperSiblings(base, item, productSiblings);
  }, [item, productSiblings]);

  const addOptions = useMemo(
    () => (item && showAdd ? resolveAddOptions(item) : []),
    [item, showAdd]
  );

  const initialSph = selectableRange?.sph.options[0] ?? item?.sph ?? 0;
  const initialCyl = selectableRange?.cyl?.options[0] ?? item?.cyl ?? 0;
  const initialAdd = addOptions[0] ?? 1;

  const [sph, setSph] = useState<number>(initialSph);
  const [cyl, setCyl] = useState<number>(initialCyl);
  const [add, setAdd] = useState<number>(initialAdd);
  const [qtyUnit, setQtyUnit] = useState<QuantityUnit>(() =>
    getDefaultQuantityUnit(ORDER_MODE)
  );
  const [quantity, setQuantity] = useState(() =>
    String(getDefaultDisplayQuantity(ORDER_MODE, getDefaultQuantityUnit(ORDER_MODE)))
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const formQuantityText = quantity.trim();
  const displayQtyNumber = formQuantityText ? Number(formQuantityText) : 0;
  const totalPieces =
    displayQtyNumber > 0
      ? piecesFromDisplayQuantity(displayQtyNumber, qtyUnit)
      : 0;

  useEffect(() => {
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
  }, [lensId, filter]);

  useEffect(() => {
    if (!item) {
      return;
    }

    const range = restrictSelectableRangeForCheaperSiblings(
      resolveSelectableRange(item),
      item,
      productSiblings
    );
    setSph(range.sph.options[0] ?? item.sph ?? 0);
    setCyl(range.cyl?.options[0] ?? item.cyl ?? 0);
    setAdd(resolveAddOptions(item)[0] ?? 1);
    const unit = getDefaultQuantityUnit(ORDER_MODE);
    setQtyUnit(unit);
    setQuantity(String(getDefaultDisplayQuantity(ORDER_MODE, unit)));
    setError(null);
  }, [item, productSiblings]);

  useEffect(() => {
    if (!selectableRange) {
      return;
    }

    const sphOpts = selectableRange.sph.options;
    if (sphOpts.length > 0 && !sphOpts.some((opt) => Math.abs(opt - sph) < 0.001)) {
      setSph(sphOpts[0]!);
    }

    const cylOpts = selectableRange.cyl?.options ?? [];
    if (cylOpts.length > 0 && !cylOpts.some((opt) => Math.abs(opt - cyl) < 0.001)) {
      setCyl(cylOpts[0]!);
    }

    if (showAdd && addOptions.length > 0 && !addOptions.some((opt) => Math.abs(opt - add) < 0.001)) {
      setAdd(addOptions[0]!);
    }
  }, [selectableRange, addOptions, showAdd, sph, cyl, add]);

  useEffect(() => {
    if (!item?.id || !item.lensType) {
      setRelatedLenses([]);
      setProductSiblings([]);
      return;
    }

    const currentLens = item;
    const lensIdForFetch = item.id;
    let cancelled = false;

    async function loadRelated() {
      setRelatedLoading(true);
      try {
        const [relatedItems, siblingItems] = await Promise.all([
          fetchRelatedLenses(lensIdForFetch, filter),
          fetchProductSiblings(lensIdForFetch, filter),
        ]);
        const filtered = relatedItems.filter(
          (related) => !isSameLensPower(related, currentLens)
        );
        if (!cancelled) {
          setRelatedLenses(filtered);
          setProductSiblings(siblingItems);
        }
      } catch {
        if (!cancelled) {
          setRelatedLenses([]);
          setProductSiblings([]);
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

  function handleQtyUnitChange(nextUnit: QuantityUnit) {
    if (nextUnit === qtyUnit) {
      return;
    }
    setQtyUnit(nextUnit);
    setQuantity(String(getDefaultDisplayQuantity(ORDER_MODE, nextUnit)));
    setError(null);
  }

  const cartLineForSelection = useMemo(() => {
    if (!item) {
      return null;
    }

    const cylForLine = selectableRange?.cyl ? cyl : item.cyl ?? 0;
    const lineId = buildCartLineId({
      id: item.id,
      sph,
      cyl: cylForLine,
      add: showAdd ? add : null,
    });

    return cartItems.find((entry) => entry.cartLineId === lineId) ?? null;
  }, [add, cartItems, cyl, item, showAdd, sph, selectableRange?.cyl]);

  const showsAddedState = useMemo(() => {
    if (!cartLineForSelection || !formQuantityText) {
      return false;
    }
    return (
      totalPieces > 0 && cartLineForSelection.cartQuantity === totalPieces
    );
  }, [cartLineForSelection, totalPieces, formQuantityText]);

  const prescriptionHint = selectableRange
    ? (() => {
        const sphRange = powerRangeFromOptions(selectableRange.sph.options);
        let hint = `Select SPH (${formatPowerLabel(sphRange.low)} to ${formatPowerLabel(sphRange.high)})`;
        if (selectableRange.cyl?.options.length) {
          const cylRange = powerRangeFromOptions(selectableRange.cyl.options);
          hint += ` and CYL (${formatPowerLabel(cylRange.low)} to ${formatPowerLabel(cylRange.high)})`;
        }
        if (showAdd && addOptions.length > 0) {
          const addRange = powerRangeFromOptions(addOptions);
          hint += ` and ADD (${formatPowerLabel(addRange.low)} to ${formatPowerLabel(addRange.high)})`;
        }
        return `${hint}.`;
      })()
    : "Select prescription values for this lens.";

  function buildRelatedHref(related: LensItem) {
    return `/shop/products/${related.id}?category=${category}&item=${encodeURIComponent(catalogItem)}`;
  }

  async function handleSubmit() {
    const currentItem = item;
    if (!currentItem) {
      return;
    }

    if (!selectableRange) {
      setError("Unable to resolve prescription range.");
      return;
    }

    const sphError = validatePrescriptionInOptions(
      "SPH",
      String(sph),
      selectableRange.sph.options
    );
    if (sphError) {
      setError(sphError);
      return;
    }

    let parsedCyl: number;
    if (selectableRange.cyl) {
      const cylError = validatePrescriptionInOptions(
        "CYL",
        String(cyl),
        selectableRange.cyl.options
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
    const qtyError = validateDisplayQuantityForMode(
      parsedDisplayQty,
      qtyUnit,
      ORDER_MODE
    );
    if (qtyError) {
      setError(qtyError);
      return;
    }
    const parsedQty = piecesFromDisplayQuantity(parsedDisplayQty, qtyUnit);

    const updatedItem: LensItem = {
      id: currentItem.id,
      costPrice: currentItem.costPrice,
      price: currentItem.price,
      sph,
      cyl: parsedCyl,
      axis: currentItem.axis,
      add: showAdd ? parsedAdd : null,
      eye: currentItem.eye,
      quantity: currentItem.quantity,
      createdAt: currentItem.createdAt,
      lensType: currentItem.lensType,
      brand: currentItem.brand,
      item: currentItem.item,
      coating: currentItem.coating,
      index: currentItem.index,
      selectableRange: currentItem.selectableRange,
    };

    const lineId = buildCartLineId({
      id: updatedItem.id,
      sph,
      cyl: parsedCyl,
      add: parsedAdd,
    });
    const existingLine = cartItems.find((entry) => entry.cartLineId === lineId);

    setSubmitting(true);
    setError(null);
    try {
      if (existingLine) {
        await updateQuantity(lineId, parsedQty);
      } else {
        await addToCart(updatedItem, parsedQty);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to cart.");
    } finally {
      setSubmitting(false);
    }
  }

  const backHref = `/shop/products?category=${category}&item=${encodeURIComponent(catalogItem)}`;

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
          <Link href={backHref}>Back to products</Link>
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
            asChild
            className="w-fit rounded-xl px-0 font-semibold text-[var(--brand-link)] hover:bg-[var(--brand-primary)]/10"
          >
            <Link href={backHref}>
              <ArrowLeft className="size-4" />
              Back to {catalogItem}
            </Link>
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
          <h2 className="text-2xl font-extrabold text-[var(--brand-text)]">
            {item.brand?.trim() || "Lens"}
          </h2>
          <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
            {formatLensItemCoatingSummary(item)}
          </p>
          <p className="mt-2 text-base font-bold text-[var(--brand-text)]">
            {lensType}
          </p>
          <p className="mt-3 text-2xl font-extrabold text-[var(--brand-primary)]">
            ₹{item.price}
            <span className="ml-1 text-sm font-bold text-[var(--brand-text-muted)]">
              {LENS_PRICE_PER_PAIR_LABEL}
            </span>
          </p>
          {item.quantity > 0 ? (
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
          <p className="mb-1 text-sm font-bold text-[var(--brand-primary)]">
            You are able to order in pairs only.
          </p>
          <p className="mb-4 text-sm leading-relaxed text-[var(--brand-text-muted)]">
            {prescriptionHint}
          </p>

          <div className="mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-3">
            <span className="text-sm font-bold text-[var(--brand-text)]">Qty</span>
            {(["piece", "pair"] as const).map((unit) => (
              <label
                key={unit}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="radio"
                  name="qtyUnit"
                  checked={qtyUnit === unit}
                  onChange={() => handleQtyUnitChange(unit)}
                  className="size-4 accent-[var(--brand-primary)]"
                />
                <span
                  className={cn(
                    "text-sm font-semibold capitalize",
                    qtyUnit === unit
                      ? "text-[var(--brand-text)]"
                      : "text-[var(--brand-text-muted)]"
                  )}
                >
                  {unit}
                </span>
              </label>
            ))}
            {totalPieces > 0 ? (
              <span className="ml-auto text-xs font-bold text-[var(--brand-primary)]">
                = {totalPieces} pc{totalPieces === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--brand-card-border)]">
            <div
              className={cn(
                "grid bg-[color-mix(in_srgb,var(--brand-card)_85%,var(--brand-primary)_15%)] px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]",
                showAdd ? "grid-cols-4" : "grid-cols-3"
              )}
            >
              <span>SPH</span>
              <span>CYL</span>
              {showAdd ? <span>ADD</span> : null}
              <span>QTY</span>
            </div>
            <div
              className={cn(
                "grid items-center bg-[var(--brand-card)] px-2 py-2",
                showAdd ? "grid-cols-4" : "grid-cols-3"
              )}
            >
              <PrescriptionWheelPicker
                options={selectableRange?.sph.options ?? []}
                value={sph}
                onChange={(value) => {
                  setSph(value);
                  setError(null);
                }}
              />
              {selectableRange?.cyl ? (
                <PrescriptionWheelPicker
                  options={selectableRange.cyl.options}
                  value={cyl}
                  onChange={(value) => {
                    setCyl(value);
                    setError(null);
                  }}
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
              <div className="flex items-center justify-center px-2">
                <Input
                  value={quantity}
                  onChange={(e) => {
                    const sanitized = sanitizePositiveIntegerInput(
                      e.target.value
                    );
                    if (sanitized === "") {
                      setQuantity("");
                      setError(null);
                      return;
                    }
                    setQuantity(
                      coerceDisplayQuantity(sanitized, qtyUnit, ORDER_MODE)
                    );
                    setError(null);
                  }}
                  inputMode="numeric"
                  className="h-11 max-w-[88px] rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] text-center text-base font-bold"
                  placeholder={String(
                    getDefaultDisplayQuantity(ORDER_MODE, qtyUnit)
                  )}
                />
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
            showsAddedState
              ? "bg-[color-mix(in_srgb,var(--brand-primary)_75%,#2d8a4e_25%)] text-[var(--brand-primary-text)]"
              : "bg-gradient-to-r from-[#f5ad42] to-[#e8941f] text-[var(--brand-primary-text)] hover:opacity-95"
          )}
        >
          {showsAddedState ? (
            <CheckCircle2 className="size-5" />
          ) : (
            <ShoppingCart className="size-5" />
          )}
          {showsAddedState ? "Added to cart" : "Add to cart"}
          {!showsAddedState ? <ArrowRight className="size-5" /> : null}
        </Button>

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
      </div>
    </div>
  );
}
