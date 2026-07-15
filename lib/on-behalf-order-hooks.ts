"use client";

import { usePathname } from "next/navigation";
import {
  EMPLOYEE_ON_BEHALF_COLOR_PATH,
  EMPLOYEE_ON_BEHALF_WHITE_PATH,
  getOnBehalfCustomOrderContext,
} from "@/lib/on-behalf-custom-order";

export function useColorLensBasePath(): string {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith(EMPLOYEE_ON_BEHALF_COLOR_PATH)) {
    return EMPLOYEE_ON_BEHALF_COLOR_PATH;
  }
  return "/color";
}

export function useWhiteLensBasePath(): string {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith(EMPLOYEE_ON_BEHALF_WHITE_PATH)) {
    return EMPLOYEE_ON_BEHALF_WHITE_PATH;
  }
  return "/white";
}

export function useOnBehalfCustomerUserId(): string | undefined {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/employee/orders/on-behalf/")) {
    return getOnBehalfCustomOrderContext()?.userId;
  }
  return undefined;
}
