import { Suspense } from "react";
import { ShopProductsScreen } from "@/components/shop/shop-products-screen";
import { Skeleton } from "@/components/ui/skeleton";

function ProductsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-64" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
  );
}

export default function ShopProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ShopProductsScreen />
    </Suspense>
  );
}
