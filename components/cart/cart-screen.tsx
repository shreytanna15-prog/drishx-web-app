"use client";

import {
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CartCheckoutBar } from "@/components/cart/cart-checkout-bar";
import { CartOrderModeToggle } from "@/components/cart/cart-order-mode-toggle";
import { CartProductSectionCard } from "@/components/cart/cart-product-section";
import { BrandConfirmDialog } from "@/components/shared/brand-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useOrderMode, type OrderMode } from "@/contexts/order-mode-context";
import { useBrandConfirm } from "@/hooks/use-brand-confirm";
import {
  buildCartProductSections,
  getCartSummary,
} from "@/lib/cart-display";
import {
  getQuantityStep,
  normalizeQuantityForMode,
} from "@/lib/order-quantity";
import { createOrder, ORDER_NOTES_MAX_LENGTH } from "@/lib/orders-api";
import { cn } from "@/lib/utils";

export function CartScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { mode: orderMode, setMode: setOrderMode, isWholesale } = useOrderMode();
  const {
    items,
    totalPrice,
    loading,
    adjustQuantity,
    updateQuantity,
    removeFromCart,
    removeLinesFromCart,
    clearCart,
    refreshCart,
  } = useCart();

  const [orderNotes, setOrderNotes] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [switchingOrderMode, setSwitchingOrderMode] = useState(false);
  const [orderMessage, setOrderMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const {
    confirm,
    open: confirmOpen,
    options: confirmOptions,
    onConfirm: onConfirmDialog,
    onCancel: onCancelDialog,
  } = useBrandConfirm();

  const quantityStep = getQuantityStep(orderMode);
  const sections = useMemo(
    () => buildCartProductSections(items, orderMode),
    [items, orderMode]
  );
  const summary = useMemo(
    () => getCartSummary(items, orderMode),
    [items, orderMode]
  );

  const qtyLabel = isWholesale ? "Pairs" : "Qty";
  const qtySummaryLabel = isWholesale ? "Pairs" : "Qty";
  const countLabel = isWholesale
    ? `${summary.pairCount} pair${summary.pairCount === 1 ? "" : "s"}`
    : `${summary.pieceCount} pc${summary.pieceCount === 1 ? "" : "s"}`;

  async function handleClearCart() {
    const confirmed = await confirm({
      title: "Clear cart?",
      description:
        "This will remove every product and prescription variant from your cart.",
      confirmLabel: "Clear cart",
      destructive: true,
    });
    if (confirmed) {
      void clearCart();
    }
  }

  async function handleRemoveLine(cartLineId: string) {
    const confirmed = await confirm({
      title: "Remove this item?",
      description:
        "This prescription line will be removed from your cart. You can add it again from the shop.",
      confirmLabel: "Remove item",
      destructive: true,
    });
    if (confirmed) {
      void removeFromCart(cartLineId);
    }
  }

  async function handleRemoveSection(cartLineIds: string[]) {
    const confirmed = await confirm({
      title: "Remove this product?",
      description:
        "This will remove the product and all of its prescription variants from your cart.",
      confirmLabel: "Remove product",
      destructive: true,
    });
    if (confirmed) {
      void removeLinesFromCart(cartLineIds);
    }
  }

  async function handleOrderModeChange(nextMode: OrderMode) {
    if (nextMode === orderMode || switchingOrderMode) {
      return;
    }

    setOrderMode(nextMode);

    if (nextMode !== "wholesale" || items.length === 0) {
      return;
    }

    setSwitchingOrderMode(true);
    try {
      await Promise.all(
        items.map(async (item) => {
          const normalized = normalizeQuantityForMode(
            item.cartQuantity,
            "wholesale"
          );
          if (normalized !== item.cartQuantity) {
            await updateQuantity(item.cartLineId, normalized);
          }
        })
      );
    } finally {
      setSwitchingOrderMode(false);
    }
  }

  async function handlePlaceOrder() {
    if (items.length === 0 || !token) {
      return;
    }

    const trimmedNotes = orderNotes.trim();
    if (trimmedNotes.length > ORDER_NOTES_MAX_LENGTH) {
      setOrderMessage({
        type: "error",
        text: `Order notes must be at most ${ORDER_NOTES_MAX_LENGTH} characters.`,
      });
      return;
    }

    setPlacingOrder(true);
    setOrderMessage(null);

    const failures: string[] = [];
    let successCount = 0;
    let procurementCount = 0;
    const checkoutBatchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    for (const item of items) {
      const result = await createOrder(
        item,
        token,
        trimmedNotes || undefined,
        checkoutBatchId
      );
      if (result.success) {
        successCount += 1;
        if (result.status === "AWAITING_PROCUREMENT") {
          procurementCount += 1;
        }
      } else {
        failures.push(
          `${item.lensType ?? "Lens"} (${item.brand ?? "Product"}): ${result.error}`
        );
      }
    }

    setPlacingOrder(false);

    if (successCount > 0) {
      await clearCart();
      await refreshCart();
      setOrderNotes("");
    }

    if (failures.length === 0) {
      const procurementNote =
        procurementCount > 0
          ? ` ${procurementCount} order(s) are in procurement. Check My Orders for updates.`
          : "";
      setOrderMessage({
        type: "success",
        text: `Successfully placed ${successCount} order(s).${procurementNote}`,
      });
      return;
    }

    if (successCount > 0) {
      setOrderMessage({
        type: "error",
        text: `${successCount} order(s) placed. Some items failed:\n${failures.join("\n")}`,
      });
      return;
    }

    setOrderMessage({
      type: "error",
      text: failures.join("\n"),
    });
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-4 px-4 py-20 text-center sm:px-6">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]">
          <ShoppingCart className="size-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--brand-text)]">
          Your cart is empty
        </h1>
        <p className="max-w-sm text-sm font-medium text-[var(--brand-text-muted)]">
          Add lenses from the Shop to build your order.
        </p>
        <Button
          asChild
          className="mt-2 rounded-xl bg-gradient-to-r from-[#f5ad42] to-[#e8941f] font-bold text-[var(--brand-primary-text)]"
        >
          <Link href="/shop">Browse shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative space-y-6 pb-6">
        <header className="flex flex-col gap-5 border-b border-[var(--brand-card-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-4xl">
              Cart
            </h1>
            <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
              Review your lenses and place your order
            </p>
            {isWholesale ? (
              <p className="mt-3 inline-flex rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
                Wholesale orders use even quantities (pairs only)
              </p>
            ) : null}
          </div>

          <CartOrderModeToggle
            disabled={switchingOrderMode}
            onChange={(mode) => void handleOrderModeChange(mode)}
            className="sm:min-w-[280px]"
          />
        </header>

        {orderMessage ? (
          <div
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm font-medium",
              orderMessage.type === "success"
                ? "border-[var(--brand-success)]/40 bg-[var(--brand-success)]/10 text-[var(--brand-success)]"
                : "border-[var(--brand-danger)]/40 bg-[var(--brand-danger)]/10 text-[var(--brand-danger)] whitespace-pre-line"
            )}
          >
            <p>{orderMessage.text}</p>
            {orderMessage.type === "success" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => router.push("/my-orders")}
                >
                  View orders
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl bg-[var(--brand-primary)] font-bold text-[var(--brand-primary-text)]"
                  onClick={() => router.push("/shop")}
                >
                  Continue shopping
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <section className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]">
          {user?.businessName?.trim() || user?.name ? (
            <p className="mb-3 truncate text-xs font-semibold text-[var(--brand-text-muted)]">
              {user.businessName?.trim() || user.name}
            </p>
          ) : null}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-xl font-extrabold text-[var(--brand-text)]">
                {summary.productCount}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                Products
              </p>
            </div>
            <div className="border-x border-[var(--brand-card-border)] text-center">
              <p className="text-xl font-extrabold text-[var(--brand-text)]">
                {isWholesale ? summary.pairCount : summary.pieceCount}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                {qtySummaryLabel}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-[var(--brand-primary)]">
                ₹{summary.totalAmount.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                Amount
              </p>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-[var(--brand-text)]">
            Products & power
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl font-bold text-[var(--brand-danger)] hover:bg-[var(--brand-danger)]/10 hover:text-[var(--brand-danger)]"
            onClick={() => void handleClearCart()}
          >
            <Trash2 className="size-4" />
            Clear cart
          </Button>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <CartProductSectionCard
              key={section.key}
              section={section}
              isWholesale={isWholesale}
              qtyColumnLabel={qtyLabel}
              onIncrease={(cartLineId) => {
                adjustQuantity(cartLineId, quantityStep, orderMode);
              }}
              onDecrease={(cartLineId) => {
                adjustQuantity(cartLineId, -quantityStep, orderMode);
              }}
              onRemove={(cartLineId) => {
                void handleRemoveLine(cartLineId);
              }}
              onRemoveSection={(cartLineIds) => {
                void handleRemoveSection(cartLineIds);
              }}
            />
          ))}
        </div>

        <Button
          variant="outline"
          asChild
          className="h-11 w-full rounded-2xl border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/8 font-bold text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/12"
        >
          <Link href="/shop">
            <Plus className="size-4" />
            Add more items
          </Link>
        </Button>

        <section className="space-y-3">
          <label
            htmlFor="order-notes"
            className="text-sm font-extrabold text-[var(--brand-text)]"
          >
            Order notes
          </label>
          <textarea
            id="order-notes"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Enter any special instructions..."
            maxLength={ORDER_NOTES_MAX_LENGTH}
            rows={4}
            className={cn(
              "w-full resize-y rounded-2xl border border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] px-4 py-3",
              "text-sm text-[var(--brand-text)] placeholder:text-[var(--brand-text-muted)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40"
            )}
          />
        </section>

        <CartCheckoutBar
          productCount={summary.productCount}
          countLabel={countLabel}
          totalPrice={totalPrice}
          placingOrder={placingOrder}
          disabled={switchingOrderMode}
          onPlaceOrder={() => void handlePlaceOrder()}
          className={cn(
            "sticky z-20",
            "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4"
          )}
        />
      </div>
      <BrandConfirmDialog
        open={confirmOpen}
        options={confirmOptions}
        onConfirm={onConfirmDialog}
        onCancel={onCancelDialog}
      />
    </div>
  );
}
