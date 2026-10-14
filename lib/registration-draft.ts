export type RegistrationBusinessInfo = {
  shopName: string;
  businessType: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  businessEmail: string;
  shopPhoneNumber: string;
};

export type RegistrationGstInfo = {
  gstNumber: string;
  legalBusinessName: string;
  tradeName: string;
  gstRegistrationState: string;
  panNumber: string;
};

export const EMPTY_BUSINESS_INFO: RegistrationBusinessInfo = {
  shopName: "",
  businessType: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  businessEmail: "",
  shopPhoneNumber: "",
};

export const EMPTY_GST_INFO: RegistrationGstInfo = {
  gstNumber: "",
  legalBusinessName: "",
  tradeName: "",
  gstRegistrationState: "",
  panNumber: "",
};

/** Client-side GSTIN/PAN checks — only when a value is entered. */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function validateOptionalGstinPan(input: {
  gstNumber?: string;
  panNumber?: string;
}): string | null {
  const gst = input.gstNumber?.trim().toUpperCase() ?? "";
  const pan = input.panNumber?.trim().toUpperCase() ?? "";
  if (gst && !GSTIN_REGEX.test(gst)) return "Invalid GSTIN format.";
  if (pan && !PAN_REGEX.test(pan)) return "Invalid PAN format.";
  return null;
}

export type RegistrationBillingAddress = {
  billingLegalName: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingPincode: string;
  billingGstState: string;
};

export type RegistrationShippingAddress = {
  shippingLegalName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
};

export type RegistrationDraft = {
  userId: string;
  email: string;
  business?: RegistrationBusinessInfo;
  gst?: RegistrationGstInfo;
};

const DRAFT_KEY = "drishx-registration-draft";

export function saveRegistrationDraft(draft: RegistrationDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadRegistrationDraft(): RegistrationDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RegistrationDraft;
  } catch {
    return null;
  }
}

export function clearRegistrationDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DRAFT_KEY);
}

export function getDraftForUser(
  userId: string,
  email: string
): RegistrationDraft {
  const existing = loadRegistrationDraft();
  if (existing?.userId === userId) {
    return { ...existing, email: email || existing.email };
  }
  return { userId, email };
}
