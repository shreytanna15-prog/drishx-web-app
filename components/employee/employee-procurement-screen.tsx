"use client";

import {
  ChevronsUpDown,
  ClipboardList,
  Loader2,
  PackagePlus,
  Plus,
  Receipt,
  RefreshCw,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmployeeProcurementOrderCard } from "@/components/employee/employee-procurement-order-card";
import { EmployeeProcurementProductSheet } from "@/components/employee/employee-procurement-product-sheet";
import { InventoryProductCard } from "@/components/employee/inventory-product-card";
import { BrandConfirmDialog } from "@/components/shared/brand-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useBrandConfirm } from "@/hooks/use-brand-confirm";
import {
  formatMoneyInput,
  parseNumericInput,
  roundMoney,
  sanitizePositiveDecimalInput,
  sanitizePositiveIntegerInput,
} from "@/lib/cart-utils";
import { fetchLensesPage, mapApiLens } from "@/lib/lenses-api";
import {
  enrichOrdersWithCatalogStock,
  filterProcurementOrderGroups,
  groupOrdersForList,
} from "@/lib/order-list-display";
import { fetchOrders } from "@/lib/orders-api";
import {
  fetchManualExpenses,
  fetchProcurementHistory,
  recordManualExpense,
  recordStockIntakeBatch,
  type ProcurementRecord,
} from "@/lib/procurement-api";
import type { FilterOption, LensItem } from "@/lib/types/lens";
import { toApiLensType } from "@/lib/types/lens";
import type { OrderRecord } from "@/lib/types/orders";
import { cn } from "@/lib/utils";

type ScreenMode = "orders" | "stock" | "history" | "manual";

type StockIntakeLine = {
  lineId: string;
  lens: LensItem;
  quantityAdded: number;
  amount: number;
  costPrice: number;
  sellingPrice: number;
};

const LENS_FILTERS: FilterOption[] = [
  "All",
  "Kryptok",
  "Progressive",
  "Single Vision",
];

function createLineId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pricesMatch(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.01;
}

function formatLensSummary(item: LensItem): string {
  return [
    item.lensType,
    item.brand,
    item.coating,
    `SPH ${item.sph}`,
    item.cyl !== null ? `CYL ${item.cyl}` : null,
    item.eye ? item.eye : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function formatHistoryDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HistoryCard({ item }: { item: ProcurementRecord }) {
  const amount = Number(item.amount);
  const by = item.user?.name?.trim() || item.user?.email || "Staff";

  return (
    <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-extrabold text-[var(--brand-text)]">
          ₹{amount.toLocaleString("en-IN")}
        </p>
        <span className="rounded-lg border border-[var(--brand-primary)]/35 bg-[var(--brand-primary)]/12 px-2.5 py-1 text-xs font-bold text-[var(--brand-primary)]">
          {item.reference}
        </span>
      </div>
      <p className="mt-2 text-sm text-[var(--brand-text-muted)]">
        {item.description || "Procurement"}
      </p>
      <p className="mt-2 text-xs font-semibold text-[var(--brand-text-muted)]">
        {by} · {formatHistoryDate(item.createdAt)}
      </p>
    </div>
  );
}

export function EmployeeProcurementScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [mode, setMode] = useState<ScreenMode>("orders");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [history, setHistory] = useState<ProcurementRecord[]>([]);
  const [manualHistory, setManualHistory] = useState<ProcurementRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [lensSearch, setLensSearch] = useState("");
  const [lensFilter, setLensFilter] = useState<FilterOption>("All");
  const [lenses, setLenses] = useState<LensItem[]>([]);
  const [loadingLenses, setLoadingLenses] = useState(false);
  const [selectedLens, setSelectedLens] = useState<LensItem | null>(null);
  const [pendingLines, setPendingLines] = useState<StockIntakeLine[]>([]);

  const [quantity, setQuantity] = useState("1");
  const [costPrice, setCostPrice] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockSuccess, setStockSuccess] = useState<string | null>(null);

  const [manualAmount, setManualAmount] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);
  const {
    confirm,
    open: confirmOpen,
    options: confirmOptions,
    onConfirm: onConfirmDialog,
    onCancel: onCancelDialog,
  } = useBrandConfirm();

  const loadOrders = useCallback(async () => {
    try {
      setOrdersError(null);
      const data = await fetchOrders();
      const withStock = await enrichOrdersWithCatalogStock(data);
      setOrders(withStock);
    } catch (err) {
      setOrdersError(
        err instanceof Error ? err.message : "Failed to load procurement orders."
      );
    } finally {
      setLoadingOrders(false);
      setRefreshing(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryError(null);
      const [procurement, manual] = await Promise.all([
        fetchProcurementHistory(),
        isAdmin ? fetchManualExpenses() : Promise.resolve([]),
      ]);
      setHistory(procurement);
      setManualHistory(manual);
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : "Failed to load history."
      );
    } finally {
      setLoadingHistory(false);
    }
  }, [isAdmin]);

  const loadLenses = useCallback(async () => {
    setLoadingLenses(true);
    try {
      const data = await fetchLensesPage({
        page: 1,
        limit: 50,
        type: lensFilter,
        search: lensSearch,
      });
      setLenses(data.items.map(mapApiLens));
    } catch {
      setLenses([]);
    } finally {
      setLoadingLenses(false);
    }
  }, [lensFilter, lensSearch]);

  useEffect(() => {
    if (mode === "orders") {
      setLoadingOrders(true);
      void loadOrders();
    }
  }, [mode, loadOrders]);

  useEffect(() => {
    if (mode === "history") {
      setLoadingHistory(true);
      void loadHistory();
    }
  }, [mode, loadHistory]);

  useEffect(() => {
    if (!pickerOpen) return;
    const timeout = setTimeout(() => void loadLenses(), 300);
    return () => clearTimeout(timeout);
  }, [pickerOpen, loadLenses]);

  const procurementGroups = useMemo(
    () => filterProcurementOrderGroups(groupOrdersForList(orders)),
    [orders]
  );

  const batchTotal = useMemo(
    () => pendingLines.reduce((sum, line) => sum + line.amount, 0),
    [pendingLines]
  );

  const batchUnits = useMemo(
    () => pendingLines.reduce((sum, line) => sum + line.quantityAdded, 0),
    [pendingLines]
  );

  const modeTabs: { key: ScreenMode; label: string }[] = [
    { key: "orders", label: "Orders" },
    { key: "stock", label: "Add stock" },
    { key: "history", label: "History" },
    ...(isAdmin ? [{ key: "manual" as const, label: "Manual" }] : []),
  ];

  function syncTotalFromPerUnit(qty: number, perUnit: string) {
    const per = parseNumericInput(perUnit);
    if (per !== null && per >= 0 && qty > 0) {
      setTotalPrice(formatMoneyInput(per * qty));
    }
  }

  function syncPerUnitFromTotal(qty: number, total: string) {
    const lineTotal = parseNumericInput(total);
    if (lineTotal !== null && lineTotal >= 0 && qty > 0) {
      setCostPrice(formatMoneyInput(lineTotal / qty));
    }
  }

  function applyLensDefaults(item: LensItem) {
    const qty = Math.max(1, Number(quantity) || 1);
    const storedCost =
      item.costPrice !== null && item.costPrice >= 0
        ? formatMoneyInput(item.costPrice)
        : "";
    setCostPrice(storedCost);
    if (storedCost) {
      syncTotalFromPerUnit(qty, storedCost);
    } else {
      setTotalPrice("");
    }
    setSellingPrice(item.price > 0 ? formatMoneyInput(item.price) : "");
  }

  function resetDraftForm() {
    setSelectedLens(null);
    setQuantity("1");
    setCostPrice("");
    setTotalPrice("");
    setSellingPrice("");
  }

  function handleSelectLens(item: LensItem) {
    setSelectedLens(item);
    setPickerOpen(false);
    applyLensDefaults(item);
    setStockError(null);
  }

  function handleQuantityChange(text: string) {
    const sanitized = sanitizePositiveIntegerInput(text) || "";
    setQuantity(sanitized);
    const qty = Number(sanitized);
    if (!Number.isInteger(qty) || qty <= 0) return;
    const perUnit = parseNumericInput(costPrice);
    const total = parseNumericInput(totalPrice);
    if (perUnit !== null && perUnit >= 0) {
      setTotalPrice(formatMoneyInput(perUnit * qty));
    } else if (total !== null && total >= 0) {
      setCostPrice(formatMoneyInput(total / qty));
    }
  }

  function handleAddLineToBatch() {
    setStockSuccess(null);
    if (!selectedLens) {
      setStockError("Choose the product you are adding to inventory.");
      return;
    }

    const qty = Number(quantity);
    const perUnit = parseNumericInput(costPrice);
    const purchaseTotal = parseNumericInput(totalPrice);
    const sellPrice = parseNumericInput(sellingPrice);

    if (!Number.isInteger(qty) || qty <= 0) {
      setStockError("Enter a whole number greater than 0.");
      return;
    }
    if (perUnit === null || perUnit <= 0) {
      setStockError("Enter the purchase price per unit.");
      return;
    }
    if (purchaseTotal === null || purchaseTotal <= 0) {
      setStockError("Enter the total purchase amount for this line.");
      return;
    }
    if (sellPrice === null || sellPrice <= 0) {
      setStockError("Enter the customer selling price for this product.");
      return;
    }

    const expectedTotal = roundMoney(perUnit * qty);
    if (Math.abs(expectedTotal - roundMoney(purchaseTotal)) > 0.05) {
      setStockError(
        `Price per unit × quantity should equal total (expected ₹${expectedTotal}).`
      );
      return;
    }

    const resolvedCost = roundMoney(perUnit);
    const resolvedSell = roundMoney(sellPrice);
    const resolvedTotal = roundMoney(purchaseTotal);

    setPendingLines((current) => {
      const existing = current.find(
        (line) =>
          line.lens.id === selectedLens.id &&
          pricesMatch(line.costPrice, resolvedCost) &&
          pricesMatch(line.sellingPrice, resolvedSell)
      );
      if (existing) {
        return current.map((line) =>
          line.lineId === existing.lineId
            ? {
                ...line,
                quantityAdded: line.quantityAdded + qty,
                amount: roundMoney(line.amount + resolvedTotal),
              }
            : line
        );
      }
      return [
        ...current,
        {
          lineId: createLineId(),
          lens: selectedLens,
          quantityAdded: qty,
          amount: resolvedTotal,
          costPrice: resolvedCost,
          sellingPrice: resolvedSell,
        },
      ];
    });

    setStockError(null);
    resetDraftForm();
  }

  async function handleSubmitBatch() {
    setStockSuccess(null);
    if (pendingLines.length === 0) {
      setStockError("Add at least one product to the list before submitting.");
      return;
    }

    const confirmed = await confirm({
      title: "Add stock for these products?",
      description: `Submit ${pendingLines.length} product${pendingLines.length === 1 ? "" : "s"} · ${batchUnits} units · ₹${batchTotal.toLocaleString("en-IN")} total.`,
      confirmLabel: "Add stock",
    });
    if (!confirmed) return;

    setSubmitting(true);
    setStockError(null);
    try {
      const result = await recordStockIntakeBatch({
        notes: notes.trim() || undefined,
        items: pendingLines.map((line) => ({
          lensType: toApiLensType(line.lens.lensType ?? "Single Vision"),
          lensId: line.lens.id,
          quantityAdded: line.quantityAdded,
          amount: line.amount,
          costPrice: line.costPrice,
          sellingPrice: line.sellingPrice,
        })),
      });
      setPendingLines([]);
      setNotes("");
      resetDraftForm();
      setStockSuccess(
        `Added ${result.itemCount} product(s). Total ₹${result.totalAmount}. Ref: ${result.batchReference}`
      );
    } catch (err) {
      setStockError(
        err instanceof Error ? err.message : "Could not add stock."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitManual() {
    setManualSuccess(null);
    const purchaseAmount = Number(manualAmount);
    if (!Number.isFinite(purchaseAmount) || purchaseAmount <= 0) {
      setManualError("Enter a valid expense amount.");
      return;
    }
    if (!manualDescription.trim()) {
      setManualError("Describe this business expense.");
      return;
    }

    setSubmittingManual(true);
    setManualError(null);
    try {
      await recordManualExpense({
        amount: purchaseAmount,
        description: manualDescription.trim(),
      });
      setManualAmount("");
      setManualDescription("");
      setManualSuccess("Manual expense saved.");
      if (mode === "history") {
        void loadHistory();
      }
    } catch (err) {
      setManualError(
        err instanceof Error ? err.message : "Could not save expense."
      );
    } finally {
      setSubmittingManual(false);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(100%,36rem)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/14 text-[var(--brand-primary)]">
              <ShoppingCart className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[var(--brand-text)] sm:text-3xl">
                Purchase Stock
              </h1>
              <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
                Procurement and stock intake
              </p>
            </div>
          </div>
          {mode === "orders" || mode === "history" ? (
            <Button
              variant="outline"
              size="icon"
              className="size-9 shrink-0 rounded-xl border-[var(--brand-input-border)]"
              onClick={() => {
                if (mode === "orders") {
                  setRefreshing(true);
                  void loadOrders();
                } else {
                  setLoadingHistory(true);
                  void loadHistory();
                }
              }}
              disabled={
                mode === "orders"
                  ? loadingOrders || refreshing
                  : loadingHistory
              }
              aria-label="Refresh"
            >
              {refreshing || (mode === "history" && loadingHistory) ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
            </Button>
          ) : null}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {modeTabs.map((tab) => {
            const active = mode === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMode(tab.key)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                  active
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-primary-text)]"
                    : "border-[var(--brand-primary)]/45 bg-[var(--brand-card)] text-[var(--brand-text-muted)] hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-text)]"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {mode === "orders" ? (
          <div className="space-y-3">
            {loadingOrders ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))
            ) : ordersError ? (
              <div className="rounded-2xl border border-[var(--brand-danger)]/35 bg-[var(--brand-danger)]/10 p-4 text-sm text-[var(--brand-danger)]">
                <p>{ordersError}</p>
                <Button
                  variant="outline"
                  className="mt-3 rounded-xl"
                  onClick={() => {
                    setLoadingOrders(true);
                    void loadOrders();
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : procurementGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-16 text-center">
                <ClipboardList className="mb-3 size-10 text-[var(--brand-text-muted)]" />
                <p className="text-lg font-extrabold text-[var(--brand-text)]">
                  No procurement orders
                </p>
                <p className="mt-1 max-w-sm text-sm text-[var(--brand-text-muted)]">
                  Orders waiting for stock will appear here.
                </p>
              </div>
            ) : (
              procurementGroups.map((group) => (
                <EmployeeProcurementOrderCard
                  key={group.key}
                  group={group}
                  onProductPress={(order) => {
                    setSelectedOrder(order);
                    setSheetOpen(true);
                  }}
                />
              ))
            )}
          </div>
        ) : null}

        {mode === "stock" ? (
          <div className="space-y-4">
            {pendingLines.length > 0 ? (
              <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-extrabold text-[var(--brand-text)]">
                      Purchase list
                    </p>
                    <p className="text-sm text-[var(--brand-text-muted)]">
                      {pendingLines.length} product
                      {pendingLines.length === 1 ? "" : "s"} · {batchUnits}{" "}
                      units · ₹{batchTotal.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-xl border-[var(--brand-danger)]/40 text-[var(--brand-danger)]"
                    onClick={() => {
                      void (async () => {
                        const confirmed = await confirm({
                          title: "Clear purchase list?",
                          description:
                            "All products in this batch will be removed. You can add them again before submitting.",
                          confirmLabel: "Clear all",
                          destructive: true,
                        });
                        if (confirmed) {
                          setPendingLines([]);
                        }
                      })();
                    }}
                  >
                    Clear all
                  </Button>
                </div>
                <div className="space-y-2">
                  {pendingLines.map((line) => (
                    <div
                      key={line.lineId}
                      className="flex items-start gap-3 rounded-xl border border-[var(--brand-card-border)] bg-[color-mix(in_srgb,var(--brand-card)_94%,var(--brand-primary)_6%)] p-3"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)]/14 text-[var(--brand-primary)]">
                        <PackagePlus className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[var(--brand-text)]">
                          {formatLensSummary(line.lens)}
                        </p>
                        <p className="mt-1 text-xs text-[var(--brand-text-muted)]">
                          +{line.quantityAdded} units · ₹{line.amount} paid ·
                          cost ₹{line.costPrice}/unit · sell ₹
                          {line.sellingPrice}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingLines((current) =>
                            current.filter((l) => l.lineId !== line.lineId)
                          )
                        }
                        className="rounded-lg p-1.5 text-[var(--brand-danger)] hover:bg-[var(--brand-danger)]/10"
                        aria-label="Remove line"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 sm:p-5">
              <p className="mb-4 text-base font-extrabold text-[var(--brand-text)]">
                {pendingLines.length > 0 ? "Add another product" : "Add product"}
              </p>

              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                    Lens product
                  </span>
                  <button
                    type="button"
                    onClick={() => setPickerOpen((open) => !open)}
                    className="flex h-11 w-full items-center justify-between rounded-xl border border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] px-3 text-left text-sm font-semibold text-[var(--brand-text)]"
                  >
                    <span
                      className={cn(
                        !selectedLens && "text-[var(--brand-text-muted)]"
                      )}
                    >
                      {selectedLens
                        ? formatLensSummary(selectedLens)
                        : "Tap to select a lens product"}
                    </span>
                    <ChevronsUpDown className="size-4 text-[var(--brand-primary)]" />
                  </button>
                </label>

                {pickerOpen ? (
                  <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-background)] p-3">
                    <Input
                      value={lensSearch}
                      onChange={(e) => setLensSearch(e.target.value)}
                      placeholder="Search lenses…"
                      className="mb-3 h-10 rounded-xl border-[var(--brand-input-border)]"
                    />
                    <div className="mb-3 flex flex-wrap gap-2">
                      {LENS_FILTERS.map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setLensFilter(filter)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-bold",
                            lensFilter === filter
                              ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-primary-text)]"
                              : "border-[var(--brand-card-border)] text-[var(--brand-text-muted)]"
                          )}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                    <div className="max-h-72 space-y-2 overflow-y-auto">
                      {loadingLenses ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="size-5 animate-spin text-[var(--brand-primary)]" />
                        </div>
                      ) : lenses.length === 0 ? (
                        <p className="py-6 text-center text-sm text-[var(--brand-text-muted)]">
                          No lenses found.
                        </p>
                      ) : (
                        lenses.map((lens) => (
                          <button
                            key={lens.id}
                            type="button"
                            onClick={() => handleSelectLens(lens)}
                            className="block w-full text-left"
                          >
                            <InventoryProductCard item={lens} />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                    Quantity to add
                  </span>
                  <Input
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    inputMode="numeric"
                    className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-input-bg)]"
                  />
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                      Cost / unit (₹)
                    </span>
                    <Input
                      value={costPrice}
                      onChange={(e) => {
                        const sanitized = sanitizePositiveDecimalInput(
                          e.target.value
                        );
                        setCostPrice(sanitized);
                        const qty = Number(quantity);
                        if (Number.isInteger(qty) && qty > 0) {
                          syncTotalFromPerUnit(qty, sanitized);
                        }
                      }}
                      inputMode="decimal"
                      placeholder="Per unit"
                      className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-input-bg)]"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                      Total cost (₹)
                    </span>
                    <Input
                      value={totalPrice}
                      onChange={(e) => {
                        const sanitized = sanitizePositiveDecimalInput(
                          e.target.value
                        );
                        setTotalPrice(sanitized);
                        const qty = Number(quantity);
                        if (Number.isInteger(qty) && qty > 0) {
                          syncPerUnitFromTotal(qty, sanitized);
                        }
                      }}
                      inputMode="decimal"
                      placeholder="Line total"
                      className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-input-bg)]"
                    />
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                    Selling price (₹)
                  </span>
                  <Input
                    value={sellingPrice}
                    onChange={(e) =>
                      setSellingPrice(
                        sanitizePositiveDecimalInput(e.target.value)
                      )
                    }
                    inputMode="decimal"
                    placeholder="Customer price in shop"
                    className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-input-bg)]"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                    Notes (optional)
                  </span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Supplier, invoice no., etc."
                    rows={3}
                    className="w-full rounded-xl border border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] px-3 py-2.5 text-sm text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-text-muted)] focus:border-[var(--brand-primary)]"
                  />
                </label>

                {stockError ? (
                  <p className="text-sm font-medium text-[var(--brand-danger)]">
                    {stockError}
                  </p>
                ) : null}
                {stockSuccess ? (
                  <p className="text-sm font-medium text-[var(--brand-success)]">
                    {stockSuccess}
                  </p>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddLineToBatch}
                  className="h-12 w-full rounded-xl border-[var(--brand-primary)]/50 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10"
                >
                  <Plus className="size-4" />
                  Add to purchase list
                </Button>

                {pendingLines.length > 0 ? (
                  <Button
                    type="button"
                    onClick={() => void handleSubmitBatch()}
                    disabled={submitting}
                    className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-base font-extrabold text-[var(--brand-primary-text)] hover:opacity-95"
                  >
                    {submitting ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      `Submit ${pendingLines.length} product${pendingLines.length === 1 ? "" : "s"} · ₹${batchTotal.toLocaleString("en-IN")}`
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {mode === "history" ? (
          <div className="space-y-4">
            {loadingHistory ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))
            ) : historyError ? (
              <div className="rounded-2xl border border-[var(--brand-danger)]/35 bg-[var(--brand-danger)]/10 p-4 text-sm text-[var(--brand-danger)]">
                {historyError}
              </div>
            ) : (
              <>
                {isAdmin && manualHistory.length > 0 ? (
                  <div>
                    <p className="mb-2 text-sm font-extrabold text-[var(--brand-text)]">
                      Recent manual expenses
                    </p>
                    <div className="space-y-2">
                      {manualHistory.slice(0, 3).map((item) => (
                        <HistoryCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <p className="mb-2 text-sm font-extrabold text-[var(--brand-text)]">
                    Procurement / stock
                  </p>
                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-16 text-center">
                      <Receipt className="mb-3 size-10 text-[var(--brand-text-muted)]" />
                      <p className="text-lg font-extrabold text-[var(--brand-text)]">
                        No purchases yet
                      </p>
                      <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
                        Stock intake records will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {history.map((item) => (
                        <HistoryCard key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : null}

        {mode === "manual" && isAdmin ? (
          <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 sm:p-5">
            <p className="mb-1 text-base font-extrabold text-[var(--brand-text)]">
              Manual expense
            </p>
            <p className="mb-4 text-sm text-[var(--brand-text-muted)]">
              Record a non-inventory business expense. This does not add lens
              stock.
            </p>
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                  Amount (₹)
                </span>
                <Input
                  value={manualAmount}
                  onChange={(e) =>
                    setManualAmount(
                      sanitizePositiveDecimalInput(e.target.value)
                    )
                  }
                  inputMode="decimal"
                  placeholder="0.00"
                  className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-input-bg)]"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
                  Description
                </span>
                <textarea
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="What was this expense for?"
                  rows={3}
                  className="w-full rounded-xl border border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] px-3 py-2.5 text-sm text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-text-muted)] focus:border-[var(--brand-primary)]"
                />
              </label>
              {manualError ? (
                <p className="text-sm font-medium text-[var(--brand-danger)]">
                  {manualError}
                </p>
              ) : null}
              {manualSuccess ? (
                <p className="text-sm font-medium text-[var(--brand-success)]">
                  {manualSuccess}
                </p>
              ) : null}
              <Button
                onClick={() => void handleSubmitManual()}
                disabled={submittingManual}
                className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-base font-extrabold text-[var(--brand-primary-text)] hover:opacity-95"
              >
                {submittingManual ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  "Record manual expense"
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <EmployeeProcurementProductSheet
        open={sheetOpen}
        order={selectedOrder}
        onClose={() => {
          setSheetOpen(false);
          setSelectedOrder(null);
        }}
        onSuccess={() => {
          void loadOrders();
        }}
      />

      <BrandConfirmDialog
        open={confirmOpen}
        options={confirmOptions}
        onConfirm={onConfirmDialog}
        onCancel={onCancelDialog}
      />
    </div>
  );
}
