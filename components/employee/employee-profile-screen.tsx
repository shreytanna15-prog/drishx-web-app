"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProfileMenuRow } from "@/components/profile/profile-menu-row";
import { ThemeSelector } from "@/components/profile/theme-selector";
import { BrandConfirmDialog } from "@/components/shared/brand-confirm-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { useBrandConfirm } from "@/hooks/use-brand-confirm";
import { getStaffRoleLabel } from "@/lib/auth-routing";
import { getInitials } from "@/lib/user-display";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5 sm:py-4">
      <span className="shrink-0 text-sm text-[var(--brand-text-muted)]">
        {label}
      </span>
      <span className="text-right text-sm font-bold text-[var(--brand-text)]">
        {value}
      </span>
    </div>
  );
}

export function EmployeeProfileScreen() {
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

  const displayName = user.name?.trim() || "Employee";
  const initials = getInitials(user.name, user.email);
  const roleLabel = getStaffRoleLabel(user.role);
  const accountStatus = user.isActive === false ? "Inactive" : "Active";

  async function handleLogout() {
    const confirmed = await confirm({
      title: "Logout",
      description: "Are you sure you want to logout?",
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
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(100%,36rem)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative space-y-5">
        <header className="text-center sm:text-left">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-3xl">
            Profile
          </h1>
        </header>

        <section className="flex flex-col items-center rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-5 py-8 text-center shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] sm:px-6">
          <Avatar className="size-[88px] border-2 border-[var(--brand-primary)]">
            <AvatarFallback className="bg-[var(--brand-primary)]/12 text-2xl font-extrabold text-[var(--brand-primary)]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <p className="mt-4 text-xl font-extrabold text-[var(--brand-text)] sm:text-2xl">
            {displayName}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
            {roleLabel}
          </p>
          <p className="mt-3 select-all font-mono text-xs font-semibold text-[var(--brand-primary)] sm:text-sm">
            EMP ID: {user.id}
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.2)]">
          <DetailRow label="Email" value={user.email} />
          <div className="h-px bg-[var(--brand-card-border)]" />
          <DetailRow label="Role" value={roleLabel} />
          <div className="h-px bg-[var(--brand-card-border)]" />
          <DetailRow label="Account status" value={accountStatus} />
        </section>

        <ThemeSelector />

        <section className="overflow-hidden rounded-2xl border border-[var(--brand-card-border)] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.2)]">
          <ProfileMenuRow
            icon={LogOut}
            label="Logout"
            variant="alt"
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
