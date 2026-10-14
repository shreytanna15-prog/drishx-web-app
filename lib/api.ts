import type { ApiError, LoginResponse, SafeUser, SignupResponse } from "./types";
import {
  authFetch,
  AuthError,
  type AuthErrorCode,
} from "./auth-fetch";
import { getAccessToken } from "./auth-storage";

export { AuthError };

export class LoginRejectedError extends Error {
  rejectionReason: string | null;
  user: SafeUser;

  constructor(message: string, rejectionReason: string | null, user: SafeUser) {
    super(message);
    this.name = "LoginRejectedError";
    this.rejectionReason = rejectionReason;
    this.user = user;
  }
}

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

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = (await res.json()) as LoginResponse & ApiError & {
    rejectionReason?: string;
    user?: SafeUser;
  };

  if (!res.ok) {
    if (res.status === 403 && data.user) {
      throw new LoginRejectedError(
        data.error ?? "Your account was rejected by admin.",
        data.rejectionReason ?? null,
        data.user
      );
    }
    throw new Error(
      data.error ?? "Something went wrong. Please try again."
    );
  }

  return {
    ...data,
    token: resolveAccessToken(data),
  };
}

export async function signup(payload: {
  email: string;
  password: string;
  name: string;
  businessName?: string;
  mobileNumber: string;
  alternateMobileNumber?: string;
  whatsappNumber?: string;
}): Promise<SignupResponse> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      name: payload.name.trim(),
      businessName: payload.businessName?.trim() || undefined,
      mobileNumber: payload.mobileNumber.trim(),
      alternateMobileNumber: payload.alternateMobileNumber?.trim() || undefined,
      whatsappNumber: payload.whatsappNumber?.trim() || undefined,
    }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json() as Promise<SignupResponse>;
}

/** RW-07: all fields except userId are optional on sparse registration submit. */
export type GstDetailsPayload = {
  userId: string;
  shopName?: string;
  businessType?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  businessEmail?: string;
  shopPhoneNumber?: string;
  gstNumber?: string;
  legalBusinessName?: string;
  tradeName?: string;
  gstRegistrationState?: string;
  panNumber?: string;
  billingLegalName?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPincode?: string;
  billingGstState?: string;
  shippingLegalName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPincode?: string;
};

export type GstDetailsResponse = {
  user: SafeUser;
  token: string;
  accessToken?: string;
  message: string;
};

export async function submitGstDetails(
  payload: GstDetailsPayload
): Promise<GstDetailsResponse> {
  const res = await fetch("/api/auth/gst", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const data = (await res.json()) as GstDetailsResponse;
  return {
    ...data,
    token: data.accessToken ?? data.token,
  };
}

export async function fetchCurrentUser(): Promise<SafeUser> {
  const token = getAccessToken();
  if (!token) {
    throw new AuthError("Not authenticated", "TOKEN_MISSING");
  }

  const res = await authFetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let message = "Unauthorized.";
    let code: AuthErrorCode = "TOKEN_INVALID";
    try {
      const data = (await res.json()) as { error?: string; code?: AuthErrorCode };
      if (data.error) message = data.error;
      if (data.code) code = data.code;
    } catch {
      // keep defaults
    }
    throw new AuthError(message, code, res.status);
  }

  const data = (await res.json()) as { user: SafeUser };
  return data.user;
}
