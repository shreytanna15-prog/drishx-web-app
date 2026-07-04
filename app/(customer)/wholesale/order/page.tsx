import { Suspense } from "react";
import { WholesaleOrderScreen } from "@/components/wholesale/wholesale-order-screen";
import { Skeleton } from "@/components/ui/skeleton";

export default function WholesaleOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      }
    >
      <WholesaleOrderScreen />
    </Suspense>
  );
}
