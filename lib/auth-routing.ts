import type { SafeUser } from "./types";

export type CustomerRoute =
  | "/business-info"
  | "/gst-details"
  | "/registration-addresses"
  | "/pending-approval"
  | "/home"
  | "/";

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
  // RW-04: suspended customers keep APPROVED status with isActive=false.
  return Boolean(
    user.isApproved &&
      user.approvalStatus === "APPROVED" &&
      user.isActive
  );
}

export function getCustomerNextRoute(user: SafeUser): CustomerRoute {
  if (user.role !== "CUSTOMER") {
    return "/";
  }
  if (user.approvalStatus === "REJECTED") {
    return "/pending-approval";
  }
  // RW-07: incomplete profiles (no GST) wait for admin review; optional
  // business/GST steps are no longer forced on every login.
  if (!user.gstNumber) {
    return "/pending-approval";
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

function withUserParams(path: string, userId: string, email: string): string {
  const params = new URLSearchParams({ userId, email });
  return `${path}?${params.toString()}`;
}

export function buildBusinessInfoHref(userId: string, email: string): string {
  return withUserParams("/business-info", userId, email);
}

export function buildGstDetailsHref(userId: string, email: string): string {
  return withUserParams("/gst-details", userId, email);
}

export function buildRegistrationAddressesHref(
  userId: string,
  email: string
): string {
  return withUserParams("/registration-addresses", userId, email);
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
