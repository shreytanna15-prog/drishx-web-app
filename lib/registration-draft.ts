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
