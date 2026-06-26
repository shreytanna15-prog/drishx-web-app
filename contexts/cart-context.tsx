"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  clearServerCart,
  fetchCart,
  removeCartLine,
  upsertCartLine,
} from "@/lib/cart-api";
import { buildCartLineId } from "@/lib/cart-utils";
import { lineTotalForPieceQuantity } from "@/lib/lens-pricing";
import type { CartItem, LensItem } from "@/lib/types/lens";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (item: LensItem, quantity: number) => Promise<void>;
  removeFromCart: (cartLineId: string) => Promise<void>;
  updateQuantity: (cartLineId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const authHeaders = useMemo(() => {
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const useServerCart = Boolean(authHeaders && user?.role === "CUSTOMER");

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

  const addToCart = useCallback(
    async (item: LensItem, quantity: number) => {
      const safeQuantity = Math.max(1, Math.floor(quantity));
      const cartLineId = buildCartLineId(item);
      const existing = items.find((entry) => entry.cartLineId === cartLineId);
      const nextQty = (existing?.cartQuantity ?? 0) + safeQuantity;

      const optimisticItem: CartItem = {
        ...item,
        cartLineId,
        cartLineKey: cartLineId,
        cartQuantity: nextQty,
        reservedQuantity: 0,
        isBackorder: false,
      };

      setItems((current) => {
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
    [authHeaders, items, useServerCart]
  );

  const removeFromCart = useCallback(
    async (cartLineId: string) => {
      const snapshot = items;
      setItems((current) =>
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
    [authHeaders, items, useServerCart]
  );

  const updateQuantity = useCallback(
    async (cartLineId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeFromCart(cartLineId);
        return;
      }

      const existing = items.find((entry) => entry.cartLineId === cartLineId);
      if (!existing) return;

      const snapshot = items;
      setItems((current) =>
        current.map((entry) =>
          entry.cartLineId === cartLineId
            ? { ...entry, cartQuantity: quantity }
            : entry
        )
      );

      if (!useServerCart || !authHeaders) {
        return;
      }

      try {
        const lensItem: LensItem = {
          id: existing.id,
          costPrice: existing.costPrice,
          price: existing.price,
          sph: existing.sph,
          cyl: existing.cyl,
          axis: existing.axis,
          add: existing.add,
          eye: existing.eye,
          quantity: existing.quantity,
          createdAt: existing.createdAt,
          lensType: existing.lensType,
          brand: existing.brand,
          item: existing.item,
          coating: existing.coating,
        };
        const { item: saved } = await upsertCartLine(
          lensItem,
          quantity,
          authHeaders
        );
        setItems((current) =>
          current.map((entry) =>
            entry.cartLineId === cartLineId ? saved : entry
          )
        );
      } catch {
        setItems(snapshot);
      }
    },
    [authHeaders, items, removeFromCart, useServerCart]
  );

  const clearCart = useCallback(async () => {
    if (useServerCart && authHeaders) {
      await clearServerCart(authHeaders);
    }
    setItems([]);
  }, [authHeaders, useServerCart]);

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
      updateQuantity,
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
      updateQuantity,
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
