"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { canAccessEmployeePath } from "@/lib/staff-permissions";

export function EmployeePermissionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!canAccessEmployeePath(pathname, user?.permissions)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-extrabold text-[var(--brand-text)]">
          You don&apos;t have access to this module
        </p>
        <p className="mt-2 text-sm text-[var(--brand-text-muted)]">
          Ask an admin to update your job role under Roles & Permissions.
        </p>
        <Link
          href="/employee/home"
          className="mt-4 inline-flex font-semibold text-[var(--brand-primary)] hover:underline"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return children;
}
