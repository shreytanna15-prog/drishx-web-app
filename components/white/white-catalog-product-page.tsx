"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { LensProductDetailScreen } from "@/components/shop/lens-product-detail-screen";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildWhiteCatalogLensItem,
  getWhiteProductLine,
  parseWhiteProductLine,
  parseWhiteVariant,
} from "@/lib/white-catalog";
import { useWhiteLensBasePath } from "@/lib/on-behalf-order-hooks";

type WhiteCatalogProductPageProps = {
  line?: string;
  variant?: string;
};

function WhiteCatalogProductContent({
  line,
  variant,
}: WhiteCatalogProductPageProps) {
  const searchParams = useSearchParams();
  const basePath = useWhiteLensBasePath();
  const isOnBehalf = basePath.startsWith("/employee");
  const lineParam = line ?? searchParams.get("line") ?? undefined;
  const variantParam = variant ?? searchParams.get("variant") ?? undefined;
  const lineId = parseWhiteProductLine(lineParam);
  const variantId = parseWhiteVariant(variantParam);

  if (!lineId || !variantId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-[var(--brand-danger)]">Invalid white catalog product.</p>
        <Button asChild className="mt-4">
          <Link href={basePath}>Back to White</Link>
        </Button>
      </div>
    );
  }

  const catalogItem = buildWhiteCatalogLensItem(lineId, variantId);
  const productLine = getWhiteProductLine(lineId);
  const lensTypeSlug =
    catalogItem.lensType === "Kryptok" ? "kryptok" : "single-vision";

  return (
    <div>
      <div className="mx-auto w-full max-w-3xl px-4 pt-6">
        <Button variant="ghost" asChild className="mb-2 px-0">
          <Link href={`${basePath}/${lensTypeSlug}/${lineId}`}>
            <ArrowLeft className="size-4" />
            Back to {productLine.title}
          </Link>
        </Button>
      </div>
      <LensProductDetailScreen
        lensId={catalogItem.id}
        category={catalogItem.lensType === "Kryptok" ? "kt" : "sv"}
        catalogItem={productLine.title}
        initialItem={catalogItem}
        mode={isOnBehalf ? "on-behalf-select" : "default"}
        backHref="/employee/orders/on-behalf"
      />
    </div>
  );
}

export function WhiteCatalogProductPage(props: WhiteCatalogProductPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      }
    >
      <WhiteCatalogProductContent {...props} />
    </Suspense>
  );
}
