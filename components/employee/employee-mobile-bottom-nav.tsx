"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EMPLOYEE_DASHBOARD_NAV } from "@/lib/employee-dashboard-nav";
import { cn } from "@/lib/utils";

function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const MOBILE_NAV = EMPLOYEE_DASHBOARD_NAV.filter((item) =>
  ["/employee/home", "/employee/orders", "/employee/procurement", "/employee/profile"].includes(
    item.href
  )
);

export function EmployeeMobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t md:hidden",
        "border-[var(--brand-card-border)] bg-[var(--brand-header-bg)] backdrop-blur-md",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="flex items-stretch justify-around px-1 pt-1">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = isNavActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 transition-colors",
                isActive
                  ? "text-[var(--brand-primary)]"
                  : "text-[var(--brand-text-muted)]"
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="w-full truncate text-center text-[10px] font-semibold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
