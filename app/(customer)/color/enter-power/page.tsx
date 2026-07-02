import { Suspense } from "react";
import { ColorEnterPowerScreen } from "@/components/color/color-enter-power-screen";
import { Skeleton } from "@/components/ui/skeleton";

function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-14 w-full rounded-2xl" />
    </div>
  );
}

export default function ColorEnterPowerPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ColorEnterPowerScreen />
    </Suspense>
  );
}
