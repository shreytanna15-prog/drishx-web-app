import { Suspense } from "react";
import { LensProductDetailClient } from "@/components/shop/lens-product-detail-client";
import { Skeleton } from "@/components/ui/skeleton";
import { parseLensDetailSearchParams } from "@/lib/shop-navigation";

function DetailLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}

export default async function LensProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string; item?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const { category, catalogItem } = parseLensDetailSearchParams(resolvedSearch);

  return (
    <Suspense fallback={<DetailLoading />}>
      <LensProductDetailClient
        lensId={resolvedParams.id}
        category={category}
        catalogItem={catalogItem}
      />
    </Suspense>
  );
}
