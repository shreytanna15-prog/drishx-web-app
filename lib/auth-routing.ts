import type { SafeUser } from "./types";

export type CustomerRoute = "/gst-details" | "/pending-approval" | "/home" | "/";

export type StaffRoute = "/employee/home";

export type PostLoginRoute = CustomerRoute | StaffRoute | "/";

export function isStaffUser(user: SafeUser | null | undefined): boolean {
  return user?.role === "EMPLOYEE" || user?.role === "ADMIN";
}

export function getStaffRoleLabel(role: SafeUser["role"]): string {
  if (role === "ADMIN") return "Administrator";
  if (role === "EMPLOYEE") return "Operations Manager";
  return role;
}

export function isCustomerApproved(user: SafeUser | null | undefined): boolean {
  if (!user || user.role !== "CUSTOMER") {
    return true;
  }
  return Boolean(user.isApproved && user.approvalStatus === "APPROVED");
}

export function getCustomerNextRoute(user: SafeUser): CustomerRoute {
  if (user.role !== "CUSTOMER") {
    return "/";
  }
  if (user.approvalStatus === "REJECTED") {
    return "/pending-approval";
  }
  if (!user.gstNumber) {
    return "/gst-details";
  }
  if (!user.isApproved || user.approvalStatus !== "APPROVED") {
    return "/pending-approval";
  }
  return "/home";
}

export function getEmployeeNextRoute(_user: SafeUser): StaffRoute {
  return "/employee/home";
}

export function getPostLoginRoute(user: SafeUser): PostLoginRoute {
  if (user.role === "CUSTOMER") {
    return getCustomerNextRoute(user);
  }
  if (isStaffUser(user)) {
    return getEmployeeNextRoute(user);
  }
  return "/";
}

export function buildGstDetailsHref(userId: string, email: string): string {
  const params = new URLSearchParams({ userId, email });
  return `/gst-details?${params.toString()}`;
}

export function buildPendingApprovalHref(
  email: string,
  options?: { rejected?: boolean; reason?: string }
): string {
  const params = new URLSearchParams({ email });
  if (options?.rejected) params.set("rejected", "1");
  if (options?.reason) params.set("reason", options.reason);
  return `/pending-approval?${params.toString()}`;
}
