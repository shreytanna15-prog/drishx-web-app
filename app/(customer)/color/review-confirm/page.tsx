import { Suspense } from "react";
import { ColorReviewConfirmScreen } from "@/components/color/color-review-confirm-screen";
import { Skeleton } from "@/components/ui/skeleton";

function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  );
}

export default function ColorReviewConfirmPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ColorReviewConfirmScreen />
    </Suspense>
  );
}
