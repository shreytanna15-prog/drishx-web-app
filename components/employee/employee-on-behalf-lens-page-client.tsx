"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { EmployeeOnBehalfLensClient } from "@/components/employee/employee-on-behalf-lens-client";
import { Skeleton } from "@/components/ui/skeleton";

function LensLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}

export function EmployeeOnBehalfLensPageClient() {
  const params = useParams<{ id: string }>();
  const lensId = params.id;

  if (!lensId) {
    return null;
  }

  return (
    <Suspense fallback={<LensLoading />}>
      <EmployeeOnBehalfLensClient lensId={lensId} />
    </Suspense>
  );
}
