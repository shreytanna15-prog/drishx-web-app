import {
  ClipboardList,
  Home,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  User,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const DASHBOARD_NAV: DashboardNavItem[] = [
  {
    href: "/home",
    label: "Home",
    icon: Home,
    description: "Dashboard and overview",
  },
  {
    href: "/shop",
    label: "Shop",
    icon: ShoppingBag,
    description: "Browse lens catalog",
  },
  {
    href: "/my-orders",
    label: "My Orders",
    icon: ClipboardList,
    description: "Track your orders",
  },
  {
    href: "/returns",
    label: "Returns",
    icon: RotateCcw,
    description: "Returns and replacements",
  },
  {
    href: "/cart",
    label: "Cart",
    icon: ShoppingCart,
    description: "Review cart items",
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
    description: "Account settings",
  },
];

export function getNavItemByHref(href: string): DashboardNavItem | undefined {
  return DASHBOARD_NAV.find((item) => item.href === href);
}
