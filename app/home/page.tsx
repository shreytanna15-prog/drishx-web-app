"use client";

import { Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import {
  buildGstDetailsHref,
  getCustomerNextRoute,
  isCustomerApproved,
} from "@/lib/auth-routing";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/user-display";

export default function HomeDashboardPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "CUSTOMER") {
      router.replace("/");
      return;
    }

    const nextRoute = getCustomerNextRoute(user);
    if (nextRoute !== "/home") {
      if (nextRoute === "/gst-details") {
        router.replace(buildGstDetailsHref(user.id, user.email));
      } else if (nextRoute === "/pending-approval") {
        router.replace(
          `/pending-approval?email=${encodeURIComponent(user.email)}`
        );
      } else {
        router.replace("/");
      }
    }
  }, [user, isLoading, router]);

  const initials = user ? getInitials(user.name, user.email) : "";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--brand-background)]">
      <header
        className={cn(
          "sticky top-0 z-50 border-b backdrop-blur-md",
          "border-[var(--brand-card-border)] bg-[var(--brand-header-bg)]"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandLogo size="sm" href="/home" />

          <div className="flex items-center gap-2 sm:gap-3">
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : user ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-10 rounded-full border-[var(--brand-input-border)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10"
                  aria-label="Notifications"
                >
                  <Bell className="size-4" />
                </Button>

                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-full border-[var(--brand-input-border)] px-2 hover:bg-[var(--brand-primary)]/10 sm:px-3"
                  aria-label="Profile"
                >
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-[var(--brand-primary)]/15 text-xs font-bold text-[var(--brand-link)]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[120px] truncate text-sm font-semibold text-[var(--brand-text)] sm:inline">
                    {user.name ?? user.email.split("@")[0]}
                  </span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className={cn(
                    "hidden rounded-full border-[var(--brand-input-border)] font-semibold sm:inline-flex",
                    "text-[var(--brand-text)] hover:bg-[var(--brand-primary)]/10"
                  )}
                >
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {isLoading || !user || !isCustomerApproved(user) ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-4 w-64" />
          <p className="text-sm text-[var(--brand-text-muted)]">
            Loading your dashboard...
          </p>
        </div>
      ) : (
        <CustomerDashboard />
      )}
    </div>
  );
}
