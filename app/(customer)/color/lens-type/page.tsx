import { Suspense } from "react";
import { ColorLensTypeScreen } from "@/components/color/color-lens-type-screen";
import { Skeleton } from "@/components/ui/skeleton";

function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}

export default function ColorLensTypePage() {
  return (
    <Suspense fallback={<Loading />}>
      <ColorLensTypeScreen />
    </Suspense>
  );
}
