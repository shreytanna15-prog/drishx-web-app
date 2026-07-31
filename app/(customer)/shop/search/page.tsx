import { Suspense } from "react";
import { CatalogSearchScreen } from "@/components/shop/catalog-search-screen";
import { Skeleton } from "@/components/ui/skeleton";

function SearchLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-full max-w-xl" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
  );
}

export default function ShopSearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <CatalogSearchScreen />
    </Suspense>
  );
}
