"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { LensProductDetailScreen } from "@/components/shop/lens-product-detail-screen";
import { CartProvider } from "@/contexts/cart-context";
import { OrderModeProvider } from "@/contexts/order-mode-context";
import type { LensItem } from "@/lib/types/lens";
import {
  lensTypeToShopCategory,
  type ShopCategoryId,
} from "@/lib/shop-navigation";

export function EmployeeOnBehalfLensClient({ lensId }: { lensId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const payload = searchParams.get("payload");

  const initialItem = useMemo(() => {
    if (!payload) {
      return null;
    }
    try {
      return JSON.parse(decodeURIComponent(payload)) as LensItem;
    } catch {
      return null;
    }
  }, [payload]);

  const category: ShopCategoryId = lensTypeToShopCategory(initialItem?.lensType);
  const catalogItem = initialItem?.item?.trim() || "Lens";
  const backHref = "/employee/orders/on-behalf";

  useEffect(() => {
    if (!initialItem) {
      router.replace(backHref);
    }
  }, [initialItem, router]);

  if (!initialItem) {
    return null;
  }

  return (
    <OrderModeProvider>
      <CartProvider>
        <LensProductDetailScreen
          lensId={lensId}
          category={category}
          catalogItem={catalogItem}
          initialItem={initialItem}
          mode="on-behalf-select"
          backHref={backHref}
        />
      </CartProvider>
    </OrderModeProvider>
  );
}
