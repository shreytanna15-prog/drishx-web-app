"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  bulkUpsertCartLines,
  clearServerCart,
  fetchCart,
  removeCartLine,
  upsertCartLine,
  upsertWholesaleCartBatch,
  type UpsertWholesaleCartInput,
} from "@/lib/cart-api";
import { buildCartLineId } from "@/lib/cart-utils";
import { lineTotalForPieceQuantity } from "@/lib/lens-pricing";
import {
  nextQuantityAfterDelta,
  type OrderQuantityMode,
} from "@/lib/order-quantity";
import type { CartItem, LensItem } from "@/lib/types/lens";

const SYNC_DEBOUNCE_MS = 200;

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (item: LensItem, quantity: number) => Promise<void>;
  removeFromCart: (cartLineId: string) => Promise<void>;
  removeLinesFromCart: (cartLineIds: string[]) => Promise<void>;
  updateQuantity: (
    cartLineId: string,
    quantity: number,
    mode?: OrderQuantityMode
  ) => Promise<void>;
  adjustQuantity: (
    cartLineId: string,
    delta: number,
    mode: OrderQuantityMode
  ) => void;
  bulkSetCartQuantities: (
    lines: Array<{ item: LensItem; quantity: number }>
  ) => Promise<{ savedCount: number; message?: string }>;
  addWholesaleBatchToCart: (
    input: UpsertWholesaleCartInput
  ) => Promise<{ expandedLineCount: number; message?: string }>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function toLensItem(entry: CartItem): LensItem {
  return {
    id: entry.id,
    costPrice: entry.costPrice,
    price: entry.price,
    sph: entry.sph,
    cyl: entry.cyl,
    axis: entry.axis,
    add: entry.add,
    eye: entry.eye,
    quantity: entry.quantity,
    createdAt: entry.createdAt,
    lensType: entry.lensType,
    brand: entry.brand,
    item: entry.item,
    coating: entry.coating,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const itemsRef = useRef<CartItem[]>([]);
  const syncTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const syncVersionRef = useRef<Map<string, number>>(new Map());

  const authHeaders = useMemo(() => {
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const useServerCart = Boolean(authHeaders && user?.role === "CUSTOMER");

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const applyItems = useCallback(
    (updater: (current: CartItem[]) => CartItem[]) => {
      setItems((current) => {
        const next = updater(current);
        itemsRef.current = next;
        return next;
      });
    },
    []
  );

  const refreshCart = useCallback(async () => {
    if (!useServerCart || !authHeaders) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const serverItems = await fetchCart(authHeaders);
      setItems(serverItems);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, useServerCart]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const flushLineSync = useCallback(
    async (cartLineId: string, version: number) => {
      if (!useServerCart || !authHeaders) {
        return;
      }

      if (syncVersionRef.current.get(cartLineId) !== version) {
        return;
      }

      const entry = itemsRef.current.find((item) => item.cartLineId === cartLineId);
      if (!entry) {
        try {
          await removeCartLine(cartLineId, authHeaders);
        } catch {
          await refreshCart();
        }
        return;
      }

      try {
        const { item: saved } = await upsertCartLine(
          toLensItem(entry),
          entry.cartQuantity,
          authHeaders
        );
        if (syncVersionRef.current.get(cartLineId) !== version) {
          return;
        }
        setItems((current) =>
          current.map((row) =>
            row.cartLineId === cartLineId ? saved : row
          )
        );
      } catch {
        await refreshCart();
      }
    },
    [authHeaders, refreshCart, useServerCart]
  );

  const scheduleLineSync = useCallback(
    (cartLineId: string) => {
      const nextVersion = (syncVersionRef.current.get(cartLineId) ?? 0) + 1;
      syncVersionRef.current.set(cartLineId, nextVersion);

      const existingTimer = syncTimersRef.current.get(cartLineId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        syncTimersRef.current.delete(cartLineId);
        void flushLineSync(cartLineId, nextVersion);
      }, SYNC_DEBOUNCE_MS);

      syncTimersRef.current.set(cartLineId, timer);
    },
    [flushLineSync]
  );

  const addToCart = useCallback(
    async (item: LensItem, quantity: number) => {
      const safeQuantity = Math.max(1, Math.floor(quantity));
      const cartLineId = buildCartLineId(item);
      const existing = itemsRef.current.find(
        (entry) => entry.cartLineId === cartLineId
      );
      const nextQty = (existing?.cartQuantity ?? 0) + safeQuantity;

      const optimisticItem: CartItem = {
        ...item,
        cartLineId,
        cartLineKey: cartLineId,
        cartQuantity: nextQty,
        reservedQuantity: 0,
        isBackorder: false,
      };

      applyItems((current) => {
        const without = current.filter((entry) => entry.cartLineId !== cartLineId);
        return [...without, optimisticItem];
      });

      if (!useServerCart || !authHeaders) {
        return;
      }

      try {
        const { item: saved } = await upsertCartLine(item, nextQty, authHeaders);
        setItems((current) => {
          const without = current.filter(
            (entry) => entry.cartLineId !== cartLineId
          );
          return [...without, saved];
        });
      } catch (err) {
        setItems((current) => {
          if (existing) {
            return current.map((entry) =>
              entry.cartLineId === cartLineId ? existing : entry
            );
          }
          return current.filter((entry) => entry.cartLineId !== cartLineId);
        });
        throw err;
      }
    },
    [applyItems, authHeaders, useServerCart]
  );

  const removeFromCart = useCallback(
    async (cartLineId: string) => {
      const snapshot = itemsRef.current;
      const existingTimer = syncTimersRef.current.get(cartLineId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        syncTimersRef.current.delete(cartLineId);
      }

      applyItems((current) =>
        current.filter((entry) => entry.cartLineId !== cartLineId)
      );

      if (!useServerCart || !authHeaders) {
        return;
      }

      try {
        await removeCartLine(cartLineId, authHeaders);
      } catch {
        setItems(snapshot);
      }
    },
    [applyItems, authHeaders, useServerCart]
  );

  const removeLinesFromCart = useCallback(
    async (cartLineIds: string[]) => {
      const uniqueIds = [...new Set(cartLineIds.filter(Boolean))];
      if (uniqueIds.length === 0) {
        return;
      }

      const idSet = new Set(uniqueIds);
      const snapshot = itemsRef.current;

      for (const cartLineId of uniqueIds) {
        const existingTimer = syncTimersRef.current.get(cartLineId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          syncTimersRef.current.delete(cartLineId);
        }
      }

      applyItems((current) =>
        current.filter((entry) => !idSet.has(entry.cartLineId))
      );

      if (!useServerCart || !authHeaders) {
        return;
      }

      try {
        await Promise.all(
          uniqueIds.map((cartLineId) =>
            removeCartLine(cartLineId, authHeaders)
          )
        );
      } catch {
        setItems(snapshot);
      }
    },
    [applyItems, authHeaders, useServerCart]
  );

  const updateQuantity = useCallback(
    async (cartLineId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeFromCart(cartLineId);
        return;
      }

      const existing = itemsRef.current.find(
        (entry) => entry.cartLineId === cartLineId
      );
      if (!existing) return;

      applyItems((current) =>
        current.map((entry) =>
          entry.cartLineId === cartLineId
            ? { ...entry, cartQuantity: quantity }
            : entry
        )
      );

      scheduleLineSync(cartLineId);
    },
    [applyItems, removeFromCart, scheduleLineSync]
  );

  const adjustQuantity = useCallback(
    (cartLineId: string, delta: number, mode: OrderQuantityMode) => {
      if (!delta) return;

      let shouldRemove = false;

      applyItems((current) => {
        const entry = current.find((row) => row.cartLineId === cartLineId);
        if (!entry) return current;

        const nextQty = nextQuantityAfterDelta(
          entry.cartQuantity,
          delta,
          mode
        );

        if (nextQty <= 0) {
          shouldRemove = true;
          return current.filter((row) => row.cartLineId !== cartLineId);
        }

        return current.map((row) =>
          row.cartLineId === cartLineId
            ? { ...row, cartQuantity: nextQty }
            : row
        );
      });

      if (shouldRemove) {
        const existingTimer = syncTimersRef.current.get(cartLineId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          syncTimersRef.current.delete(cartLineId);
        }
        if (useServerCart && authHeaders) {
          void removeCartLine(cartLineId, authHeaders).catch(() => {
            void refreshCart();
          });
        }
        return;
      }

      scheduleLineSync(cartLineId);
    },
    [applyItems, authHeaders, refreshCart, scheduleLineSync, useServerCart]
  );

  const clearCart = useCallback(async () => {
    for (const timer of syncTimersRef.current.values()) {
      clearTimeout(timer);
    }
    syncTimersRef.current.clear();
    syncVersionRef.current.clear();

    if (useServerCart && authHeaders) {
      await clearServerCart(authHeaders);
    }
    applyItems(() => []);
  }, [applyItems, authHeaders, useServerCart]);

  const bulkSetCartQuantities = useCallback(
    async (lines: Array<{ item: LensItem; quantity: number }>) => {
      if (lines.length === 0) {
        return { savedCount: 0 };
      }

      const optimisticItems: CartItem[] = lines.map(({ item, quantity }) => {
        const cartLineId = buildCartLineId(item);
        const safeQuantity = Math.max(1, Math.floor(quantity));
        return {
          ...item,
          cartLineId,
          cartLineKey: cartLineId,
          cartQuantity: safeQuantity,
          reservedQuantity: 0,
          isBackorder: false,
        };
      });

      const optimisticIds = new Set(
        optimisticItems.map((entry) => entry.cartLineId)
      );
      let mergedSnapshot: CartItem[] = [];

      applyItems((current) => {
        const kept = current.filter((entry) => !optimisticIds.has(entry.cartLineId));
        mergedSnapshot = [...kept, ...optimisticItems];
        return mergedSnapshot;
      });

      if (!useServerCart || !authHeaders) {
        return { savedCount: optimisticItems.length };
      }

      try {
        const { count, message } = await bulkUpsertCartLines(lines, authHeaders);
        return { savedCount: count, message };
      } catch (err) {
        applyItems(() =>
          itemsRef.current.filter((entry) => !optimisticIds.has(entry.cartLineId))
        );
        throw err;
      }
    },
    [applyItems, authHeaders, useServerCart]
  );

  const addWholesaleBatchToCart = useCallback(
    async (input: UpsertWholesaleCartInput) => {
      if (!useServerCart || !authHeaders) {
        throw new Error("Sign in to add wholesale batches to your cart.");
      }

      const { item, expandedLineCount, message } = await upsertWholesaleCartBatch(
        input,
        authHeaders
      );

      applyItems((current) => {
        const kept = current.filter((entry) => entry.cartLineId !== item.cartLineId);
        return [...kept, item];
      });

      return { expandedLineCount, message };
    },
    [applyItems, authHeaders, useServerCart]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, entry) => sum + entry.cartQuantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () =>
      items.reduce(
        (sum, entry) =>
          sum + lineTotalForPieceQuantity(entry.price, entry.cartQuantity),
        0
      ),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      totalPrice,
      loading,
      refreshCart,
      addToCart,
      removeFromCart,
      removeLinesFromCart,
      updateQuantity,
      adjustQuantity,
      bulkSetCartQuantities,
      addWholesaleBatchToCart,
      clearCart,
    }),
    [
      items,
      itemCount,
      totalPrice,
      loading,
      refreshCart,
      addToCart,
      removeFromCart,
      removeLinesFromCart,
      updateQuantity,
      adjustQuantity,
      bulkSetCartQuantities,
      addWholesaleBatchToCart,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
