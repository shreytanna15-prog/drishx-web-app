import { authFetch } from "@/lib/auth-fetch";
import type { CustomerCompany } from "@/lib/customers-api";
import { fetchCustomerCompanies } from "@/lib/customers-api";

export type WalkInLookupKind = "none" | "path_a" | "staff_created";

export type WalkInLookupResult = {
  kind: WalkInLookupKind;
  mobileNumber: string;
  customer: CustomerCompany | null;
  skipOtp: boolean;
  orderable: boolean;
  message: string | null;
};

export type WalkInOtpSendResult = {
  challengeId: string;
  providerSessionId: string | null;
  mobileNumber: string;
};

export type WalkInOtpVerifyResult = {
  ok: boolean;
  challengeId: string;
  mobileNumber: string;
  user: CustomerCompany | null;
  walkInKind?: WalkInLookupKind;
  code?: string;
  message?: string | null;
};

export type CreateWalkInPayload = {
  mobileNumber: string;
  challengeId: string;
  name?: string;
  shopName?: string;
  businessName?: string;
  email?: string;
};

export class WalkInApiError extends Error {
  status: number;
  code: string | null;
  customer: CustomerCompany | null;

  constructor(
    message: string,
    status: number,
    code: string | null = null,
    customer: CustomerCompany | null = null
  ) {
    super(message);
    this.name = "WalkInApiError";
    this.status = status;
    this.code = code;
    this.customer = customer;
  }
}

async function parseWalkInError(res: Response, fallback: string): Promise<never> {
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
    code?: string;
    customer?: CustomerCompany | null;
  };
  throw new WalkInApiError(
    data.error ?? data.message ?? fallback,
    res.status,
    typeof data.code === "string" ? data.code : null,
    data.customer ?? null
  );
}

export async function lookupWalkInMobile(
  mobile: string
): Promise<WalkInLookupResult> {
  const qs = new URLSearchParams({ mobile: mobile.trim() });
  const res = await authFetch(
    `/api/users/customers/walk-in/lookup?${qs.toString()}`,
    { method: "GET" }
  );
  if (!res.ok) {
    await parseWalkInError(res, "Failed to look up mobile.");
  }
  return res.json() as Promise<WalkInLookupResult>;
}

export async function sendWalkInMobileOtp(
  mobileNumber: string
): Promise<WalkInOtpSendResult> {
  const res = await authFetch("/api/auth/otp/mobile/send", {
    method: "POST",
    body: JSON.stringify({ mobileNumber, purpose: "WALK_IN" }),
  });
  if (!res.ok) {
    await parseWalkInError(res, "Failed to send OTP.");
  }
  return res.json() as Promise<WalkInOtpSendResult>;
}

export async function verifyWalkInMobileOtp(input: {
  mobileNumber: string;
  code: string;
  providerSessionId?: string | null;
}): Promise<WalkInOtpVerifyResult> {
  const res = await authFetch("/api/auth/otp/mobile/verify", {
    method: "POST",
    body: JSON.stringify({
      mobileNumber: input.mobileNumber,
      code: input.code,
      purpose: "WALK_IN",
      providerSessionId: input.providerSessionId ?? undefined,
    }),
  });
  if (!res.ok) {
    await parseWalkInError(res, "Failed to verify OTP.");
  }
  return res.json() as Promise<WalkInOtpVerifyResult>;
}

export async function createWalkInCustomer(
  payload: CreateWalkInPayload
): Promise<CustomerCompany> {
  const res = await authFetch("/api/users/customers/walk-in", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    customer?: CustomerCompany;
    error?: string;
    code?: string;
  };
  if (res.ok && data.customer) {
    return data.customer;
  }
  // Staff-created already exists — select them (no duplicate).
  if (
    res.status === 409 &&
    data.code === "WALK_IN_EXISTS" &&
    data.customer?.id
  ) {
    return data.customer;
  }
  throw new WalkInApiError(
    data.error ?? "Failed to create walk-in customer.",
    res.status,
    typeof data.code === "string" ? data.code : null,
    data.customer ?? null
  );
}

/** Staff-created walk-in history (Path B/C only). */
export async function fetchWalkInHistory(params?: {
  page?: number;
  limit?: number;
  q?: string;
}) {
  return fetchCustomerCompanies({
    status: "staff-created",
    activeOnly: false,
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    q: params?.q,
  });
}
