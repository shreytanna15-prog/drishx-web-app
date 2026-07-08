"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LensProductDetailScreen } from "@/components/shop/lens-product-detail-screen";
import { Button } from "@/components/ui/button";
import {
  buildWhiteCatalogLensItem,
  getWhiteProductLine,
  parseWhiteProductLine,
  parseWhiteVariant,
} from "@/lib/white-catalog";

type WhiteCatalogProductPageProps = {
  line?: string;
  variant?: string;
};

export function WhiteCatalogProductPage({ line, variant }: WhiteCatalogProductPageProps) {
  const lineId = parseWhiteProductLine(line);
  const variantId = parseWhiteVariant(variant);

  if (!lineId || !variantId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-[var(--brand-danger)]">Invalid white catalog product.</p>
        <Button asChild className="mt-4">
          <Link href="/white">Back to White</Link>
        </Button>
      </div>
    );
  }

  const catalogItem = buildWhiteCatalogLensItem(lineId, variantId);
  const productLine = getWhiteProductLine(lineId);

  return (
    <div>
      <div className="mx-auto w-full max-w-3xl px-4 pt-6">
        <Button variant="ghost" asChild className="mb-2 px-0">
          <Link href={`/white/${catalogItem.lensType === "Kryptok" ? "kryptok" : "single-vision"}/${lineId}`}>
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
      />
    </div>
  );
}
