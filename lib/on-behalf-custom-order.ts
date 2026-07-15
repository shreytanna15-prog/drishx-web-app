const ON_BEHALF_CUSTOM_ORDER_KEY = "drishx-on-behalf-custom-order";

export type OnBehalfCustomOrderContext = {
  userId: string;
  customerLabel: string;
  returnTo: string;
};

export function setOnBehalfCustomOrderContext(
  context: OnBehalfCustomOrderContext
) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ON_BEHALF_CUSTOM_ORDER_KEY, JSON.stringify(context));
}

export function getOnBehalfCustomOrderContext(): OnBehalfCustomOrderContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ON_BEHALF_CUSTOM_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnBehalfCustomOrderContext;
    if (!parsed?.userId?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearOnBehalfCustomOrderContext() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ON_BEHALF_CUSTOM_ORDER_KEY);
}

export const EMPLOYEE_ON_BEHALF_RX_PATH = "/employee/orders/on-behalf/rx";
export const EMPLOYEE_ON_BEHALF_WHITE_PATH = "/employee/orders/on-behalf/white";
export const EMPLOYEE_ON_BEHALF_COLOR_PATH = "/employee/orders/on-behalf/color";
