"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { DASHBOARD_NAV } from "@/lib/dashboard-nav";
import {
  pairsFromPieces,
} from "@/lib/order-quantity";
import { cn } from "@/lib/utils";

function isNavActive(pathname: string, href: string) {
  const pathOnly = href.split("?")[0] ?? href;
  if (pathOnly === "/home") return pathname === "/home";
  if (pathname === pathOnly) return true;
  return pathname.startsWith(`${pathOnly}/`);
}

/** Bottom tab bar omits secondary items (e.g. Support lives in sidebar/profile). */
const BOTTOM_NAV = DASHBOARD_NAV.filter(
  (item) => !item.href.includes("coming-soon") && !item.href.includes("?")
);

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const cartBadge =
    itemCount > 0 ? pairsFromPieces(itemCount) : 0;

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t md:hidden",
        "border-[var(--brand-card-border)] bg-[var(--brand-header-bg)] backdrop-blur-md",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="flex items-stretch justify-around px-1 pt-1">
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = isNavActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 transition-colors",
                isActive
                  ? "text-[var(--brand-primary)]"
                  : "text-[var(--brand-text-muted)]"
              )}
            >
              <Icon className="size-5 shrink-0" />
              {item.href === "/cart" && cartBadge > 0 ? (
                <span className="absolute top-1 right-[calc(50%-1.25rem)] flex min-w-[1.1rem] items-center justify-center rounded-full bg-[var(--brand-danger)] px-1 text-[9px] font-bold text-white">
                  {cartBadge > 99 ? "99+" : cartBadge}
                </span>
              ) : null}
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
