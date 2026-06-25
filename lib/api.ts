import type { ApiError, LoginResponse, SafeUser, SignupResponse } from "./types";
import { getStoredToken } from "./auth-storage";

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

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
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

  return data;
}

export async function signup(
  email: string,
  password: string,
  name: string
): Promise<SignupResponse> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      name: name.trim(),
    }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json() as Promise<SignupResponse>;
}

export type GstDetailsPayload = {
  userId: string;
  gstNumber: string;
  businessName: string;
  businessAddress: string;
  state?: string;
  pincode?: string;
};

export type GstDetailsResponse = {
  user: SafeUser;
  token: string;
  message: string;
};

export async function submitGstDetails(
  payload: GstDetailsPayload
): Promise<GstDetailsResponse> {
  const res = await fetch("/api/auth/gst", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json() as Promise<GstDetailsResponse>;
}

export async function fetchCurrentUser(): Promise<SafeUser> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const data = (await res.json()) as { user: SafeUser };
  return data.user;
}
