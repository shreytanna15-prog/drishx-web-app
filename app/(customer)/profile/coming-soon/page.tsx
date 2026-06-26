import { Suspense } from "react";
import { ProfileComingSoonScreen } from "@/components/profile/profile-coming-soon-screen";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileComingSoonPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-6 h-64 rounded-2xl" />
        </div>
      }
    >
      <ProfileComingSoonScreen />
    </Suspense>
  );
}
