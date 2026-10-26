"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  AuthField,
  AuthFooterLink,
  AuthLayout,
} from "@/components/auth-layout";
import { useAuth } from "@/contexts/auth-context";
import { LoginRejectedError, login } from "@/lib/api";
import {
  buildBusinessInfoHref,
  buildPendingApprovalHref,
  getPostLoginRoute,
  isStaffUser,
} from "@/lib/auth-routing";
import { sendMobileOtp, verifyMobileOtp } from "@/lib/otp-api";
import type { SafeUser } from "@/lib/types";

type LoginMode = "otp" | "password";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, login: setSession } = useAuth();

  const [mode, setMode] = useState<LoginMode>("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [providerSessionId, setProviderSessionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    const mobileParam = params.get("mobile");
    if (emailParam) {
      setEmail(emailParam);
      setMode("password");
    }
    if (mobileParam) {
      setMobileNumber(mobileParam);
      setMode("otp");
    }
  }, []);

  function routeAfterLogin(nextUser: SafeUser) {
    const nextRoute = getPostLoginRoute(nextUser);
    if (nextRoute === "/business-info") {
      router.replace(buildBusinessInfoHref(nextUser.id, nextUser.email));
    } else if (nextRoute === "/pending-approval") {
      router.replace(
        buildPendingApprovalHref(nextUser.email, {
          rejected: nextUser.approvalStatus === "REJECTED",
          reason: nextUser.rejectionReason ?? undefined,
        })
      );
    } else if (nextRoute !== "/") {
      router.replace(nextRoute);
    }
  }

  useEffect(() => {
    if (isLoading || !user) return;
    routeAfterLogin(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when session user appears
  }, [user, isLoading, router]);

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await login(email.trim().toLowerCase(), password);
      setSession(data.token, data.user);
    } catch (err) {
      if (err instanceof LoginRejectedError) {
        router.push(
          buildPendingApprovalHref(email.trim().toLowerCase(), {
            rejected: true,
            reason: err.rejectionReason ?? undefined,
          })
        );
        return;
      }
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!mobileNumber.trim()) {
      setError("Enter your mobile number.");
      return;
    }
    setIsSubmitting(true);
    try {
      const sent = await sendMobileOtp({
        mobileNumber,
        purpose: "LOGIN",
      });
      setProviderSessionId(sent.providerSessionId);
      setOtpCode("");
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!otpCode.trim()) {
      setError("Enter the OTP code.");
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await verifyMobileOtp({
        mobileNumber,
        purpose: "LOGIN",
        code: otpCode,
        providerSessionId,
      });
      const token = data.accessToken ?? data.token;
      if (!token || !data.user) {
        setError("Login succeeded but session was missing. Try again.");
        return;
      }
      if (isStaffUser(data.user)) {
        setError("Staff accounts must sign in with email and password.");
        return;
      }
      setSession(token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in with mobile OTP or email and password."
      compact
      panelEyebrow="Customer portal"
      panelTitle="Your lens workflow, ready when you are."
      panelDescription="Access orders, inventory-backed fulfillment, and company tools in one place."
    >
      <div className="auth-login">
        <div className="auth-login__modes" role="tablist" aria-label="Login method">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "otp"}
            className={
              mode === "otp"
                ? "auth-login__mode auth-login__mode--active"
                : "auth-login__mode"
            }
            onClick={() => {
              setMode("otp");
              setError("");
            }}
          >
            Mobile OTP
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "password"}
            className={
              mode === "password"
                ? "auth-login__mode auth-login__mode--active"
                : "auth-login__mode"
            }
            onClick={() => {
              setMode("password");
              setError("");
            }}
          >
            Email & password
          </button>
        </div>

        <div className="auth-login__body">
          {error ? (
            <div className="auth-alert-error" role="alert">
              {error}
            </div>
          ) : null}

          {mode === "otp" ? (
            <form
              onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
              className="auth-form"
            >
              <p
                style={{
                  marginBottom: "0.75rem",
                  fontSize: "0.875rem",
                  opacity: 0.8,
                  lineHeight: 1.4,
                }}
              >
                Admin-created or walk-in accounts: sign in with the registered
                mobile number (OTP). No password required.
              </p>
              <AuthField label="Mobile number" htmlFor="mobile">
                <input
                  id="mobile"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="auth-input"
                  placeholder="10-digit mobile number"
                  disabled={otpSent && isSubmitting}
                />
              </AuthField>

              {otpSent ? (
                <AuthField label="OTP" htmlFor="otp">
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="auth-input"
                    placeholder="6-digit code"
                  />
                </AuthField>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="auth-button"
              >
                {isSubmitting
                  ? "Please wait..."
                  : otpSent
                    ? "Verify & sign in"
                    : "Send OTP"}
              </button>

              {otpSent ? (
                <button
                  type="button"
                  className="auth-button-outline"
                  style={{ marginTop: "0.5rem", width: "100%" }}
                  disabled={isSubmitting}
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode("");
                    setError("");
                  }}
                >
                  Change mobile number
                </button>
              ) : null}
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} className="auth-form">
              <AuthField label="Email" htmlFor="email">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  placeholder="you@example.com"
                />
              </AuthField>

              <AuthField label="Password" htmlFor="password">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  placeholder="Enter your password"
                />
              </AuthField>

              <button
                type="submit"
                disabled={isSubmitting}
                className="auth-button"
              >
                {isSubmitting ? "Signing in..." : "Sign in to Drishx"}
              </button>
            </form>
          )}
        </div>

        <div className="auth-login__footer">
          <AuthFooterLink
            text="Don't have an account?"
            linkText="Create account"
            href="/signup"
          />
        </div>
      </div>
    </AuthLayout>
  );
}
