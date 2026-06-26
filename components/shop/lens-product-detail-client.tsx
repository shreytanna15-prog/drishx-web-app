"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LensProductDetailScreen } from "@/components/shop/lens-product-detail-screen";
import type { ShopCategoryId } from "@/lib/shop-navigation";

export function LensProductDetailClient({
  lensId,
  category,
  catalogItem,
}: {
  lensId: string;
  category: ShopCategoryId;
  catalogItem: string;
}) {
  if (!catalogItem) {
    return <LensProductDetailRedirect category={category} />;
  }

  return (
    <LensProductDetailScreen
      lensId={lensId}
      category={category}
      catalogItem={catalogItem}
    />
  );
}

function LensProductDetailRedirect({
  category,
}: {
  category: ShopCategoryId;
}) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/shop?category=${category}`);
  }, [category, router]);
  return null;
}
