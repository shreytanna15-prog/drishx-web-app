import {
  ClipboardList,
  FlaskConical,
  Home,
  Package,
  RotateCcw,
  ShoppingCart,
  User,
  type LucideIcon,
  Warehouse,
} from "lucide-react";

export type EmployeeNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const EMPLOYEE_DASHBOARD_NAV: EmployeeNavItem[] = [
  {
    href: "/employee/home",
    label: "Home",
    icon: Home,
    description: "Operations overview",
  },
  {
    href: "/employee/orders",
    label: "Orders",
    icon: ClipboardList,
    description: "Manage customer orders",
  },
  {
    href: "/employee/orders/rx",
    label: "Rx Orders",
    icon: FlaskConical,
    description: "Prescription RX orders",
  },
  {
    href: "/employee/tasks",
    label: "Tasks",
    icon: Package,
    description: "Assigned tasks",
  },
  {
    href: "/employee/returns",
    label: "Returns",
    icon: RotateCcw,
    description: "Review return requests",
  },
  {
    href: "/employee/procurement",
    label: "Procurement",
    icon: ShoppingCart,
    description: "Stock intake and procurement",
  },
  {
    href: "/employee/inventory",
    label: "Inventory",
    icon: Warehouse,
    description: "Lens stock levels",
  },
  {
    href: "/employee/profile",
    label: "Profile",
    icon: User,
    description: "Account settings",
  },
];

export function getEmployeeNavItemByHref(
  href: string
): EmployeeNavItem | undefined {
  return EMPLOYEE_DASHBOARD_NAV.find((item) => item.href === href);
}

/** True when this nav href should be highlighted for the current path. */
export function isEmployeeNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  // `/employee/orders` must not steal active state from `/employee/orders/rx`
  if (href === "/employee/orders" && pathname.startsWith("/employee/orders/rx")) {
    return false;
  }
  return true;
}
