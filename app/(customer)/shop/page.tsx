import { Suspense } from "react";
import { ShopScreen } from "@/components/shop/shop-screen";
import { Skeleton } from "@/components/ui/skeleton";

function ShopLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-12 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopLoading />}>
      <ShopScreen />
    </Suspense>
  );
}
