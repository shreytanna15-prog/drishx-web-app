"use client";

import {
  Building2,
  ChevronLeft,
  FileText,
  Headphones,
  History,
  LogOut,
  MapPin,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileMenuRow } from "@/components/profile/profile-menu-row";
import { ThemeSelector } from "@/components/profile/theme-selector";
import { BrandConfirmDialog } from "@/components/shared/brand-confirm-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useBrandConfirm } from "@/hooks/use-brand-confirm";
import { getDisplayName, getInitials } from "@/lib/user-display";

export function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    confirm,
    open: confirmOpen,
    options: confirmOptions,
    onConfirm: onConfirmDialog,
    onCancel: onCancelDialog,
  } = useBrandConfirm();

  if (!user) {
    return null;
  }

  const displayName = getDisplayName(user.name, user.email);
  const initials = getInitials(user.name, user.email);

  async function handleLogout() {
    const confirmed = await confirm({
      title: "Logout?",
      description: "You will need to sign in again to access your account.",
      confirmLabel: "Logout",
      destructive: true,
    });
    if (confirmed) {
      logout();
      router.replace("/login");
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative space-y-5">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-4xl">
            Profile
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
            Manage your account, appearance, and business details
          </p>
        </header>

        <section className="flex items-center gap-4 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] sm:p-6">
          <Avatar className="size-14 shrink-0 border border-[var(--brand-card-border)] sm:size-16">
            <AvatarFallback className="bg-[var(--brand-primary)]/15 text-lg font-extrabold text-[var(--brand-primary)]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-extrabold text-[var(--brand-text)] sm:text-2xl">
              {displayName}
            </p>
            <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
              Client ID:{" "}
              <span className="font-mono text-xs text-[var(--brand-text)] sm:text-sm">
                {user.id}
              </span>
            </p>
          </div>
        </section>

        <ThemeSelector />

        <section className="overflow-hidden rounded-2xl border border-[var(--brand-card-border)] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.2)]">
          <ProfileMenuRow
            icon={Building2}
            label="Company Profile"
            href="/profile/company"
          />
          <div className="h-px bg-[var(--brand-card-border)]" />
          <ProfileMenuRow
            icon={MapPin}
            label="Billing Address"
            href="/profile/coming-soon?feature=billing-address"
            variant="alt"
          />
          <div className="h-px bg-[var(--brand-card-border)]" />
          <ProfileMenuRow
            icon={FileText}
            label="Invoices"
            href="/profile/invoices"
          />
          <div className="h-px bg-[var(--brand-card-border)]" />
          <ProfileMenuRow
            icon={History}
            label="Recent Orders"
            href="/my-orders"
            variant="alt"
          />
          <div className="h-px bg-[var(--brand-card-border)]" />
          <ProfileMenuRow
            icon={Wallet}
            label="Outstanding / Payments"
            href="/profile/coming-soon?feature=outstanding-payments"
          />
          <div className="h-px bg-[var(--brand-card-border)]" />
          <ProfileMenuRow
            icon={Headphones}
            label="Support"
            href="/profile/coming-soon?feature=support"
            variant="alt"
          />
          <div className="h-px bg-[var(--brand-card-border)]" />
          <ProfileMenuRow
            icon={LogOut}
            label="Logout"
            danger
            onClick={() => void handleLogout()}
          />
        </section>
      </div>

      <BrandConfirmDialog
        open={confirmOpen}
        options={confirmOptions}
        onConfirm={onConfirmDialog}
        onCancel={onCancelDialog}
      />
    </div>
  );
}

type ProfileSubpageHeaderProps = {
  title: string;
  backHref?: string;
};

export function ProfileSubpageHeader({
  title,
  backHref = "/profile",
}: ProfileSubpageHeaderProps) {
  return (
    <header className="mb-6 flex items-center gap-3 border-b border-[var(--brand-card-border)] pb-4">
      <Button
        variant="outline"
        size="icon"
        className="size-9 shrink-0 rounded-xl border-[var(--brand-input-border)]"
        asChild
      >
        <Link href={backHref} aria-label="Back to profile">
          <ChevronLeft className="size-5" />
        </Link>
      </Button>
      <h1 className="text-2xl font-extrabold text-[var(--brand-text)] sm:text-3xl">
        {title}
      </h1>
    </header>
  );
}
