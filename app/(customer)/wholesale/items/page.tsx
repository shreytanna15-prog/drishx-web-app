import { Suspense } from "react";
import { WholesaleItemsScreen } from "@/components/wholesale/wholesale-items-screen";
import { Skeleton } from "@/components/ui/skeleton";

export default function WholesaleItemsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      }
    >
      <WholesaleItemsScreen />
    </Suspense>
  );
}
