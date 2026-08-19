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
import { hasStaffPermission } from "@/lib/staff-permissions";

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

export function getVisibleEmployeeNav(permissions?: readonly string[] | null) {
  return EMPLOYEE_DASHBOARD_NAV.filter((item) => {
    if (item.href === "/employee/home" || item.href === "/employee/profile") {
      return true;
    }
    if (item.href === "/employee/orders") {
      return (
        hasStaffPermission(permissions, "orders.view") ||
        hasStaffPermission(permissions, "orders.fulfill") ||
        hasStaffPermission(permissions, "orders.dispatch")
      );
    }
    if (item.href === "/employee/orders/rx") {
      return hasStaffPermission(permissions, "orders.rx");
    }
    if (item.href === "/employee/tasks") {
      return hasStaffPermission(permissions, "tasks.view");
    }
    if (item.href === "/employee/returns") {
      return hasStaffPermission(permissions, "returns.view");
    }
    if (item.href === "/employee/procurement") {
      return (
        hasStaffPermission(permissions, "procurement.view") ||
        hasStaffPermission(permissions, "procurement.intake")
      );
    }
    if (item.href === "/employee/inventory") {
      return hasStaffPermission(permissions, "inventory.view");
    }
    return true;
  });
}

export function getEmployeeNavItemByHref(
  href: string
): EmployeeNavItem | undefined {
  return EMPLOYEE_DASHBOARD_NAV.find((item) => item.href === href);
}

export function isEmployeeNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  if (href === "/employee/orders" && pathname.startsWith("/employee/orders/rx")) {
    return false;
  }
  return true;
}
