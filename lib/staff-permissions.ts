export const STAFF_PERMISSIONS = [
  "orders.view",
  "orders.fulfill",
  "orders.create_on_behalf",
  "orders.rx",
  "orders.dispatch",
  "procurement.view",
  "procurement.intake",
  "returns.view",
  "inventory.view",
  "tasks.view",
] as const;

export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];

export function hasStaffPermission(
  permissions: readonly string[] | null | undefined,
  key: StaffPermission
) {
  if (!permissions) return true;
  return permissions.includes(key);
}

export const EMPLOYEE_NAV_PERMISSIONS: Record<string, StaffPermission[] | null> = {
  "/employee/home": null,
  "/employee/orders": ["orders.view", "orders.fulfill", "orders.dispatch"],
  "/employee/orders/rx": ["orders.rx"],
  "/employee/orders/on-behalf": ["orders.create_on_behalf"],
  "/employee/tasks": ["tasks.view"],
  "/employee/returns": ["returns.view"],
  "/employee/procurement": ["procurement.view", "procurement.intake"],
  "/employee/inventory": ["inventory.view"],
  "/employee/profile": null,
};

export function canAccessEmployeePath(
  pathname: string,
  permissions: readonly string[] | null | undefined
) {
  if (!permissions) return true;
  const match = Object.keys(EMPLOYEE_NAV_PERMISSIONS)
    .sort((a, b) => b.length - a.length)
    .find((href) => pathname === href || pathname.startsWith(`${href}/`));
  if (!match) return true;
  const needed = EMPLOYEE_NAV_PERMISSIONS[match];
  if (!needed) return true;
  return needed.some((key) => permissions.includes(key));
}
