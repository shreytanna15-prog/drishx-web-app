"use client";

import { Bell, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EmployeeAppSidebar } from "@/components/employee/employee-app-sidebar";
import { EmployeeMobileBottomNav } from "@/components/employee/employee-mobile-bottom-nav";
import { EmployeePermissionGate } from "@/components/employee/employee-permission-gate";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import {
  NotificationUnreadProvider,
  useNotificationUnread,
} from "@/contexts/notification-unread-context";
import { isStaffUser } from "@/lib/auth-routing";
import { getStoredToken, getStoredUser } from "@/lib/auth-storage";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/user-display";

export function EmployeeDashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const storedUser = getStoredUser();
  const sessionUser = user ?? storedUser;
  const hasStoredSession = Boolean(getStoredToken());

  useEffect(() => {
    if (isLoading) return;

    if (!user && !hasStoredSession) {
      router.replace("/login");
      return;
    }

    if (user && !isStaffUser(user)) {
      router.replace("/");
    }
  }, [user, isLoading, hasStoredSession, router]);

  const initials = sessionUser
    ? getInitials(sessionUser.name, sessionUser.email)
    : "";

  if (
    isLoading ||
    (!user && hasStoredSession) ||
    !sessionUser ||
    !isStaffUser(sessionUser)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--brand-background)]">
        <div className="flex flex-col items-center gap-4 px-6">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-4 w-64" />
          <p className="text-sm text-[var(--brand-text-muted)]">
            Loading operations portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <NotificationUnreadProvider>
      <SidebarProvider defaultOpen className="dashboard-sidebar-provider">
        <EmployeeAppSidebar />
        <SidebarInset className="bg-[var(--brand-background)]">
          <header className="dashboard-topbar sticky top-0 z-30 gap-3 px-4 backdrop-blur-md sm:px-6 bg-[var(--brand-header-bg)]">
            <div className="flex items-center gap-2">
              <SidebarTrigger
                className={cn(
                  "size-9 rounded-xl text-[var(--brand-text)]",
                  "hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)]"
                )}
              />
              <Separator
                orientation="vertical"
                className="mr-1 hidden h-5 md:block"
              />
              <span className="text-sm font-extrabold text-[var(--brand-text)] md:hidden">
                Drishx Ops
              </span>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2 sm:gap-3">
              <EmployeeNotificationBellButton />

              <Button
                variant="outline"
                className="h-10 gap-2 rounded-full border-[var(--brand-input-border)] px-2 hover:bg-[var(--brand-primary)]/10 sm:px-3"
                aria-label="Profile"
                asChild
              >
                <Link href="/employee/profile">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-[var(--brand-primary)]/15 text-xs font-bold text-[var(--brand-link)]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[120px] truncate text-sm font-semibold text-[var(--brand-text)] sm:inline">
                    {sessionUser.name ?? sessionUser.email.split("@")[0]}
                  </span>
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className={cn(
                  "rounded-full border-[var(--brand-input-border)] font-semibold",
                  "text-[var(--brand-text)] hover:bg-[var(--brand-primary)]/10"
                )}
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </header>

          <div className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
            <EmployeePermissionGate>{children}</EmployeePermissionGate>
          </div>

          <EmployeeMobileBottomNav />
        </SidebarInset>
      </SidebarProvider>
    </NotificationUnreadProvider>
  );
}

function EmployeeNotificationBellButton() {
  const { unreadCount } = useNotificationUnread();
  const badgeLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative size-10 rounded-full border-[var(--brand-input-border)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10"
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
      asChild
    >
      <Link href="/employee/notifications">
        <Bell className="size-4" />
        {badgeLabel ? (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-[var(--brand-primary)] px-1 text-[10px] font-bold leading-5 text-[var(--brand-primary-text)]">
            {badgeLabel}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
