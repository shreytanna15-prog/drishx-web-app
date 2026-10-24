import type { ApiError, LoginResponse, SafeUser } from "./types";

export type OtpPurpose =
  | "SIGNUP"
  | "LOGIN"
  | "VERIFY_EMAIL"
  | "WALK_IN"
  | "ADMIN_INVITE";

export type MobileOtpSendResponse = {
  ok: true;
  challengeId: string;
  providerSessionId: string | null;
  expiresAt: string;
  purpose: OtpPurpose;
  mobileNumber: string;
};

export type MobileOtpVerifyResponse = LoginResponse & {
  ok?: boolean;
  purpose?: OtpPurpose;
  mobileNumber?: string;
  mobileVerified?: boolean;
  challengeId?: string;
};

export type EmailOtpSendResponse = {
  ok: true;
  challengeId: string;
  providerSessionId: string | null;
  expiresAt: string;
  purpose: OtpPurpose;
  email: string;
};

export type EmailOtpVerifyResponse = {
  ok: true;
  purpose: OtpPurpose;
  email: string;
  emailVerified: boolean;
  challengeId: string;
  user: SafeUser | null;
};

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as ApiError & { details?: string };
    if (data.error && data.details) {
      return `${data.error} (${data.details})`;
    }
    return data.error ?? "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

function resolveAccessToken(data: LoginResponse) {
  return data.accessToken ?? data.token;
}

export async function sendMobileOtp(input: {
  mobileNumber: string;
  purpose: OtpPurpose;
}): Promise<MobileOtpSendResponse> {
  const res = await fetch("/api/auth/otp/mobile/send", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Client": "web",
    },
    body: JSON.stringify({
      mobileNumber: input.mobileNumber.trim(),
      purpose: input.purpose,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<MobileOtpSendResponse>;
}

export async function verifyMobileOtp(input: {
  mobileNumber: string;
  purpose: OtpPurpose;
  code: string;
  providerSessionId?: string | null;
  name?: string;
  businessName?: string;
  alternateMobileNumber?: string;
  whatsappNumber?: string;
  email?: string;
}): Promise<MobileOtpVerifyResponse> {
  const res = await fetch("/api/auth/otp/mobile/verify", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Client": "web",
    },
    body: JSON.stringify({
      mobileNumber: input.mobileNumber.trim(),
      purpose: input.purpose,
      code: input.code.trim(),
      providerSessionId: input.providerSessionId ?? undefined,
      name: input.name?.trim() || undefined,
      businessName: input.businessName?.trim() || undefined,
      alternateMobileNumber: input.alternateMobileNumber?.trim() || undefined,
      whatsappNumber: input.whatsappNumber?.trim() || undefined,
      email: input.email?.trim().toLowerCase() || undefined,
    }),
  });

  const data = (await res.json()) as MobileOtpVerifyResponse & ApiError;
  if (!res.ok) {
    throw new Error(data.error ?? (await parseError(res)));
  }

  if (data.user && (data.accessToken || data.token)) {
    return {
      ...data,
      token: resolveAccessToken(data)!,
    };
  }
  return data;
}

export async function sendEmailOtp(input: {
  email: string;
  purpose: OtpPurpose;
  accessToken?: string | null;
}): Promise<EmailOtpSendResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client": "web",
  };
  if (input.accessToken) {
    headers.Authorization = `Bearer ${input.accessToken}`;
  }
  const res = await fetch("/api/auth/otp/email/send", {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      purpose: input.purpose,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<EmailOtpSendResponse>;
}

export async function verifyEmailOtp(input: {
  email: string;
  purpose: OtpPurpose;
  code: string;
  providerSessionId?: string | null;
  accessToken?: string | null;
}): Promise<EmailOtpVerifyResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client": "web",
  };
  if (input.accessToken) {
    headers.Authorization = `Bearer ${input.accessToken}`;
  }
  const res = await fetch("/api/auth/otp/email/verify", {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      purpose: input.purpose,
      code: input.code.trim(),
      providerSessionId: input.providerSessionId ?? undefined,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<EmailOtpVerifyResponse>;
}
