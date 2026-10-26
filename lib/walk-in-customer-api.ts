import { authFetchJson } from "@/lib/auth-fetch";
import type { CustomerCompany } from "@/lib/customers-api";

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
};

export type CreateWalkInPayload = {
  mobileNumber: string;
  challengeId: string;
  name?: string;
  shopName?: string;
  businessName?: string;
  email?: string;
};

export async function sendWalkInMobileOtp(
  mobileNumber: string
): Promise<WalkInOtpSendResult> {
  return authFetchJson<WalkInOtpSendResult>("/api/auth/otp/mobile/send", {
    method: "POST",
    body: JSON.stringify({ mobileNumber, purpose: "WALK_IN" }),
  });
}

export async function verifyWalkInMobileOtp(input: {
  mobileNumber: string;
  code: string;
  providerSessionId?: string | null;
}): Promise<WalkInOtpVerifyResult> {
  return authFetchJson<WalkInOtpVerifyResult>("/api/auth/otp/mobile/verify", {
    method: "POST",
    body: JSON.stringify({
      mobileNumber: input.mobileNumber,
      code: input.code,
      purpose: "WALK_IN",
      providerSessionId: input.providerSessionId ?? undefined,
    }),
  });
}

export async function createWalkInCustomer(
  payload: CreateWalkInPayload
): Promise<CustomerCompany> {
  const data = await authFetchJson<{ customer: CustomerCompany }>(
    "/api/users/customers/walk-in",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  return data.customer;
}
