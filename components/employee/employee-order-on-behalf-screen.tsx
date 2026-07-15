"use client";

import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  Search,
  SearchX,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCustomerCompanies, type CustomerCompany } from "@/lib/customers-api";
import { getStoredToken } from "@/lib/auth-storage";
import {
  formatLensProductDetail,
  LENS_PRICE_PER_PAIR_LABEL,
} from "@/lib/lens-display";
import { fetchLensesPage, mapApiLens } from "@/lib/lenses-api";
import { lineTotalForPieceQuantity } from "@/lib/lens-pricing";
import { consumePendingOnBehalfSelection } from "@/lib/on-behalf-selection";
import {
  createOrderFromLens,
  ORDER_NOTES_MAX_LENGTH,
} from "@/lib/orders-api";
import type { FilterOption, LensItem } from "@/lib/types/lens";
import { cn } from "@/lib/utils";
import {
  EMPLOYEE_ON_BEHALF_COLOR_PATH,
  EMPLOYEE_ON_BEHALF_RX_PATH,
  EMPLOYEE_ON_BEHALF_WHITE_PATH,
  setOnBehalfCustomOrderContext,
} from "@/lib/on-behalf-custom-order";

type Step = "customer" | "shop";
type SelectedLine = { lens: LensItem; quantity: number };

const FILTER_OPTIONS: FilterOption[] = [
  "All",
  "Kryptok",
  "Progressive",
  "Single Vision",
];

const CUSTOM_ORDER_OPTIONS = [
  {
    id: "rx",
    label: "Rx",
    description: "Custom prescription order",
    path: EMPLOYEE_ON_BEHALF_RX_PATH,
  },
  {
    id: "white",
    label: "White",
    description: "White lens catalog order",
    path: EMPLOYEE_ON_BEHALF_WHITE_PATH,
  },
  {
    id: "color",
    label: "Color orders",
    description: "Tinted / fashion color lens",
    path: EMPLOYEE_ON_BEHALF_COLOR_PATH,
  },
] as const;

const ON_BEHALF_STORAGE_KEY = "drishx-employee-on-behalf-state";

type PersistedOnBehalfState = {
  step: Step;
  selectedCustomerId: string | null;
  selectedLines: SelectedLine[];
  orderNotes: string;
  activeFilter: FilterOption;
  productSearch: string;
};

function readPersistedState(): PersistedOnBehalfState | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(ON_BEHALF_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PersistedOnBehalfState;
  } catch {
    return null;
  }
}

function writePersistedState(state: PersistedOnBehalfState) {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(ON_BEHALF_STORAGE_KEY, JSON.stringify(state));
}

function clearPersistedState() {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(ON_BEHALF_STORAGE_KEY);
}

function formatLensLabel(lens: LensItem): string {
  const brand = lens.brand?.trim() || "Lens";
  return `${brand} · ${formatLensProductDetail(lens)}`;
}

function getLensStableKey(lens: LensItem): string {
  return [
    lens.id,
    lens.lensType ?? "",
    lens.sph,
    lens.cyl ?? "",
    lens.axis ?? "",
    lens.add ?? "",
    lens.eye ?? "",
  ].join("::");
}

function customerLabel(customer: CustomerCompany): string {
  return customer.businessName || customer.name || customer.email;
}

export function EmployeeOrderOnBehalfScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const restoredRef = useRef(false);

  const [step, setStep] = useState<Step>("customer");
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<CustomerCompany[]>([]);
  const [products, setProducts] = useState<LensItem[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [selectedLines, setSelectedLines] = useState<SelectedLine[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const productsPageRef = useRef(1);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (restoredRef.current) {
      return;
    }
    restoredRef.current = true;
    const persisted = readPersistedState();
    if (!persisted) {
      return;
    }
    setStep(persisted.step);
    setSelectedCustomerId(persisted.selectedCustomerId);
    setSelectedLines(persisted.selectedLines);
    setOrderNotes(persisted.orderNotes);
    setActiveFilter(persisted.activeFilter);
    setProductSearch(persisted.productSearch);
  }, []);

  useEffect(() => {
    if (!restoredRef.current) {
      return;
    }
    writePersistedState({
      step,
      selectedCustomerId,
      selectedLines,
      orderNotes,
      activeFilter,
      productSearch,
    });
  }, [
    step,
    selectedCustomerId,
    selectedLines,
    orderNotes,
    activeFilter,
    productSearch,
  ]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const customerRows = await fetchCustomerCompanies();
      setCustomers(customerRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      `${c.businessName ?? ""} ${c.name ?? ""} ${c.email}`
        .toLowerCase()
        .includes(q)
    );
  }, [customers, customerSearch]);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedProductSearch(productSearch.trim()),
      400
    );
    return () => clearTimeout(timer);
  }, [productSearch]);

  const loadProducts = useCallback(
    async (page: number, replace: boolean) => {
      if (replace) {
        setLoadingProducts(true);
      } else {
        if (loadingMoreProducts || !hasMoreProducts) return;
        setLoadingMoreProducts(true);
      }
      try {
        const data = await fetchLensesPage({
          page,
          type: activeFilter,
          search: debouncedProductSearch,
        });
        const mapped = data.items.map(mapApiLens);
        setProducts((current) => {
          const merged = replace ? mapped : [...current, ...mapped];
          const deduped = new Map<string, LensItem>();
          for (const lens of merged) {
            deduped.set(getLensStableKey(lens), lens);
          }
          return [...deduped.values()];
        });
        setTotalProducts(data.total);
        setHasMoreProducts(data.hasMore);
        productsPageRef.current = data.page;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load products.");
      } finally {
        setLoadingProducts(false);
        setLoadingMoreProducts(false);
      }
    },
    [activeFilter, debouncedProductSearch, hasMoreProducts, loadingMoreProducts]
  );

  useEffect(() => {
    if (step !== "shop") return;
    productsPageRef.current = 1;
    setHasMoreProducts(true);
    void loadProducts(1, true);
  }, [step, activeFilter, debouncedProductSearch, loadProducts]);

  useEffect(() => {
    if (step !== "shop") return;
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMoreProducts &&
          !loadingProducts &&
          !loadingMoreProducts
        ) {
          void loadProducts(productsPageRef.current + 1, false);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    step,
    hasMoreProducts,
    loadingProducts,
    loadingMoreProducts,
    loadProducts,
    products.length,
  ]);

  const totalAmount = useMemo(
    () =>
      selectedLines.reduce(
        (sum, line) =>
          sum + lineTotalForPieceQuantity(line.lens.price, line.quantity),
        0
      ),
    [selectedLines]
  );

  useEffect(() => {
    const selection = consumePendingOnBehalfSelection();
    if (!selection) return;
    setSelectedLines((current) => {
      const existing = current.find((line) => line.lens.id === selection.lens.id);
      if (existing) {
        return current.map((line) =>
          line.lens.id === selection.lens.id
            ? {
                ...line,
                lens: selection.lens,
                quantity: line.quantity + selection.quantity,
              }
            : line
        );
      }
      return [...current, selection];
    });
    setStep("shop");
  }, [pathname]);

  function updateLineQuantity(lensId: string, nextQuantity: number) {
    if (nextQuantity <= 0) {
      setSelectedLines((current) =>
        current.filter((line) => line.lens.id !== lensId)
      );
      return;
    }
    setSelectedLines((current) =>
      current.map((line) =>
        line.lens.id === lensId
          ? { ...line, quantity: Math.max(1, Math.floor(nextQuantity)) }
          : line
      )
    );
  }

  async function placeOrderOnBehalf() {
    if (!selectedCustomerId) {
      window.alert("Please select a customer first.");
      return;
    }
    if (selectedLines.length === 0) {
      window.alert("Please add at least one product.");
      return;
    }
    if (orderNotes.trim().length > ORDER_NOTES_MAX_LENGTH) {
      window.alert(
        `Notes must be at most ${ORDER_NOTES_MAX_LENGTH} characters.`
      );
      return;
    }

    const token = getStoredToken();
    if (!token) {
      window.alert("You are not signed in.");
      return;
    }

    setPlacingOrder(true);
    const failures: string[] = [];
    let successCount = 0;
    const checkoutBatchId = `staff_batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    for (const line of selectedLines) {
      const result = await createOrderFromLens(
        line.lens,
        line.quantity,
        token,
        {
          userId: selectedCustomerId,
          notes: orderNotes.trim() || undefined,
          checkoutBatchId,
        }
      );
      if (result.success) {
        successCount += 1;
      } else {
        failures.push(`${formatLensLabel(line.lens)}: ${result.error}`);
      }
    }

    setPlacingOrder(false);

    if (failures.length > 0 && successCount === 0) {
      window.alert(`Order failed\n\n${failures.join("\n\n")}`);
      return;
    }
    if (failures.length > 0) {
      window.alert(
        `Partial success: ${successCount} order(s) placed.\n\n${failures.join("\n\n")}`
      );
      return;
    }

    window.alert(`Successfully placed ${successCount} order(s).`);
    setSelectedLines([]);
    setOrderNotes("");
    clearPersistedState();
  }

  function handleBack() {
    if (step === "shop") {
      setStep("customer");
      return;
    }
    clearPersistedState();
    router.push("/employee/orders");
  }

  if (loading) {
    return (
      <div className="relative mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Skeleton className="mb-6 h-10 w-56" />
        <Skeleton className="mb-4 h-12 rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error && step === "customer" && customers.length === 0) {
    return (
      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <p className="text-sm font-medium text-[var(--brand-danger)]">{error}</p>
        <Button className="rounded-xl" onClick={() => void loadData()}>
          Retry
        </Button>
      </div>
    );
  }

  const selectedCustomerLabel = selectedCustomer
    ? customerLabel(selectedCustomer)
    : "";

  return (
    <div className="relative mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(100%,36rem)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative space-y-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 rounded-xl text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-2xl font-extrabold text-[var(--brand-text)] sm:text-3xl">
            Order on Behalf
          </h1>
        </div>

        {step === "customer" ? (
          <div className="space-y-5">
            <div>
              <h2 className="mb-3 text-base font-bold text-[var(--brand-text)]">
                1) Choose company
              </h2>
              <Input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search company or email"
                className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-card)]"
              />
            </div>

            <div className="space-y-2.5">
              {filteredCustomers.length === 0 ? (
                <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-10 text-center">
                  <p className="text-sm text-[var(--brand-text-muted)]">
                    No companies match your search.
                  </p>
                </div>
              ) : (
                filteredCustomers.map((customer) => {
                  const active = customer.id === selectedCustomerId;
                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={cn(
                        "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                        active
                          ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/12"
                          : "border-[var(--brand-card-border)] bg-[var(--brand-card)] hover:border-[var(--brand-primary)]/35"
                      )}
                    >
                      <p className="text-sm font-bold text-[var(--brand-text)]">
                        {customerLabel(customer)}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--brand-text-muted)]">
                        {customer.email}
                      </p>
                    </button>
                  );
                })
              )}
            </div>

            <Button
              type="button"
              disabled={!selectedCustomerId}
              onClick={() => setStep("shop")}
              className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-base font-extrabold text-[var(--brand-primary-text)] hover:opacity-95 disabled:opacity-60"
            >
              Continue to shop
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-3">
              <p className="text-sm font-bold text-[var(--brand-text)]">
                Customer: {selectedCustomerLabel}
              </p>
              <button
                type="button"
                onClick={() => setStep("customer")}
                className="text-sm font-bold text-[var(--brand-primary)] hover:underline"
              >
                Change
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-[var(--brand-text)] sm:text-3xl">
                Shop
              </h2>
              <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
                {totalProducts} products available
              </p>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--brand-text-muted)]" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search SPH, CYL, price, brand, item..."
                className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-card)] pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((filter) => {
                const active = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-primary-text)]"
                        : "border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
                    )}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {CUSTOM_ORDER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (!selectedCustomerId) return;
                    setOnBehalfCustomOrderContext({
                      userId: selectedCustomerId,
                      customerLabel: selectedCustomerLabel,
                      returnTo: "/employee/orders/on-behalf",
                    });
                    router.push(option.path);
                  }}
                  className={cn(
                    "rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-4 text-left transition-all",
                    "hover:border-[var(--brand-primary)]/45 hover:bg-[var(--brand-primary)]/8"
                  )}
                >
                  <p className="text-base font-extrabold text-[var(--brand-text)]">
                    {option.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-bold text-[var(--brand-text)]">
                Selected products
              </h3>
              {selectedLines.length === 0 ? (
                <p className="text-sm text-[var(--brand-text-muted)]">
                  Tap a product card below to add it.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {selectedLines.map((line) => (
                    <div
                      key={line.lens.id}
                      className="rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4"
                    >
                      <p className="text-sm font-bold text-[var(--brand-text)]">
                        {formatLensLabel(line.lens)}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--brand-text-muted)]">
                        {line.lens.lensType ?? "Lens"} · ₹{line.lens.price}
                        {LENS_PRICE_PER_PAIR_LABEL}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8 rounded-lg border-[var(--brand-primary)] text-[var(--brand-primary)]"
                          onClick={() =>
                            updateLineQuantity(line.lens.id, line.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-4" />
                        </Button>
                        <span className="min-w-6 text-center text-sm font-bold text-[var(--brand-text)]">
                          {line.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8 rounded-lg border-[var(--brand-primary)] text-[var(--brand-primary)]"
                          onClick={() =>
                            updateLineQuantity(line.lens.id, line.quantity + 1)
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-4" />
                        </Button>
                        <span className="ml-auto text-base font-extrabold text-[var(--brand-primary)]">
                          ₹
                          {lineTotalForPieceQuantity(
                            line.lens.price,
                            line.quantity
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-[var(--brand-text)]">
                3) Notes (optional)
              </h3>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Special instructions..."
                maxLength={ORDER_NOTES_MAX_LENGTH}
                rows={4}
                className="w-full resize-y rounded-xl border border-[var(--brand-input-border)] bg-[var(--brand-card)] px-3 py-2.5 text-sm text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-text-muted)] focus-visible:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/25"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--brand-text-muted)]">
                {selectedLines.length} product line(s)
              </p>
              <p className="text-xl font-extrabold text-[var(--brand-text)]">
                ₹{totalAmount}
              </p>
            </div>

            <Button
              type="button"
              disabled={placingOrder || selectedLines.length === 0}
              onClick={() => void placeOrderOnBehalf()}
              className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-base font-extrabold text-[var(--brand-primary-text)] hover:opacity-95 disabled:opacity-60"
            >
              {placingOrder ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ShoppingBag className="size-5" />
              )}
              Place order for customer
            </Button>

            <div className="space-y-3 border-t border-[var(--brand-card-border)] pt-6">
              <h3 className="text-base font-bold text-[var(--brand-text)]">
                2) Choose products
              </h3>

              {loadingProducts ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 rounded-2xl" />
                  <Skeleton className="h-24 rounded-2xl" />
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-12 text-center">
                  <SearchX className="mx-auto mb-3 size-9 text-[var(--brand-text-muted)]" />
                  <p className="text-sm text-[var(--brand-text-muted)]">
                    No products found for this filter or search.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {products.map((lens) => (
                    <Link
                      key={getLensStableKey(lens)}
                      href={`/employee/orders/on-behalf/lens/${lens.id}?payload=${encodeURIComponent(JSON.stringify(lens))}`}
                      className="block rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 transition-all hover:border-[var(--brand-primary)]/45 hover:shadow-[0_8px_24px_-10px_rgba(240,161,50,0.28)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-[var(--brand-text)]">
                          {(lens.brand?.trim() || "Lens").toUpperCase()}{" "}
                          {lens.sph}/{lens.cyl ?? "—"}
                        </p>
                        <p className="text-lg font-extrabold text-[var(--brand-primary)]">
                          ₹{lens.price}
                        </p>
                      </div>
                      <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">
                        {lens.lensType ?? "Lens"}
                      </p>
                      {lens.item?.trim() ? (
                        <p className="mt-0.5 text-xs font-semibold uppercase text-[var(--brand-text-muted)]">
                          {lens.item}
                        </p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              )}

              {loadingMoreProducts ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--brand-text-muted)]">
                  <Loader2 className="size-4 animate-spin" />
                  Loading more lenses...
                </div>
              ) : null}
              <div ref={loadMoreRef} className="h-1" aria-hidden />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
