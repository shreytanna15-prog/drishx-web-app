"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  AuthField,
  AuthFooterLink,
  AuthLayout,
} from "@/components/auth-layout";
import { useAuth } from "@/contexts/auth-context";
import { buildBusinessInfoHref } from "@/lib/auth-routing";
import {
  sendEmailOtp,
  sendMobileOtp,
  verifyEmailOtp,
  verifyMobileOtp,
} from "@/lib/otp-api";
import {
  getDraftForUser,
  saveRegistrationDraft,
} from "@/lib/registration-draft";

type Step = "details" | "otp" | "email";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternateMobileNumber, setAlternateMobileNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [providerSessionId, setProviderSessionId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailSessionId, setEmailSessionId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function continueToWizard(userId: string, userEmail: string) {
    saveRegistrationDraft(getDraftForUser(userId, userEmail));
    router.push(buildBusinessInfoHref(userId, userEmail));
  }

  async function handleSendMobileOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !mobileNumber.trim()) {
      setError("Full name and mobile number are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const sent = await sendMobileOtp({
        mobileNumber,
        purpose: "SIGNUP",
      });
      setProviderSessionId(sent.providerSessionId);
      setOtpCode("");
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyMobileOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!otpCode.trim()) {
      setError("Enter the OTP sent to your mobile.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await verifyMobileOtp({
        mobileNumber,
        purpose: "SIGNUP",
        code: otpCode,
        providerSessionId,
        name,
        businessName: businessName.trim() || undefined,
        alternateMobileNumber: alternateMobileNumber.trim() || undefined,
        whatsappNumber: whatsappNumber.trim() || undefined,
      });
      const token = result.accessToken ?? result.token;
      const user = result.user;
      if (!token || !user) {
        setError("Account was created but session was missing. Please log in.");
        return;
      }
      login(token, user);
      setAccessToken(token);
      setCreatedUserId(user.id);
      setCreatedEmail(user.email);
      setStep("email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendEmailOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Enter an email, or skip this step.");
      return;
    }
    setIsSubmitting(true);
    try {
      const sent = await sendEmailOtp({
        email,
        purpose: "SIGNUP",
        accessToken,
      });
      setEmailSessionId(sent.providerSessionId);
      setEmailOtp("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email OTP.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyEmailOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!emailOtp.trim()) {
      setError("Enter the email OTP, or skip this step.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await verifyEmailOtp({
        email,
        purpose: "SIGNUP",
        code: emailOtp,
        providerSessionId: emailSessionId,
        accessToken,
      });
      if (result.user) {
        login(accessToken!, result.user);
        setCreatedEmail(result.user.email);
        continueToWizard(result.user.id, result.user.email);
        return;
      }
      if (createdUserId) {
        continueToWizard(createdUserId, email.trim().toLowerCase());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email OTP failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSkipEmail() {
    if (!createdUserId) {
      setError("Please verify mobile OTP first.");
      return;
    }
    continueToWizard(createdUserId, createdEmail);
  }

  const stepNumber = step === "details" ? 1 : step === "otp" ? 1 : 1;
  const subtitle =
    step === "details"
      ? "Verify your mobile to create an account. Business and GST details are optional next."
      : step === "otp"
        ? "Enter the OTP sent to your mobile."
        : "Optional: verify an email now, or skip and continue registration.";

  return (
    <AuthLayout
      wide
      title="Create account"
      subtitle={subtitle}
      step={stepNumber}
      panelEyebrow="Customer signup"
      panelTitle="Mobile-first onboarding."
      panelDescription="Verify your phone with OTP, then complete optional business details for admin review."
    >
      {error && <div className="auth-alert-error">{error}</div>}

      {step === "details" && (
        <form onSubmit={handleSendMobileOtp}>
          <AuthField label="Full name" htmlFor="name">
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              placeholder="John Doe"
            />
          </AuthField>

          <AuthField label="Business name" htmlFor="businessName" optional>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="auth-input"
              placeholder="Your business name"
            />
          </AuthField>

          <AuthField label="Mobile number" htmlFor="mobileNumber">
            <input
              id="mobileNumber"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="auth-input"
              placeholder="10-digit mobile number"
            />
          </AuthField>

          <AuthField
            label="Alternate mobile number"
            htmlFor="alternateMobileNumber"
            optional
          >
            <input
              id="alternateMobileNumber"
              type="tel"
              inputMode="tel"
              value={alternateMobileNumber}
              onChange={(e) => setAlternateMobileNumber(e.target.value)}
              className="auth-input"
              placeholder="Alternate mobile number"
            />
          </AuthField>

          <AuthField label="WhatsApp number" htmlFor="whatsappNumber" optional>
            <input
              id="whatsappNumber"
              type="tel"
              inputMode="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="auth-input"
              placeholder="WhatsApp number"
            />
          </AuthField>

          <button type="submit" disabled={isSubmitting} className="auth-button">
            {isSubmitting ? "Sending OTP..." : "Send mobile OTP"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyMobileOtp}>
          <p className="auth-muted" style={{ marginBottom: "0.75rem" }}>
            Code sent to <strong>{mobileNumber}</strong>
          </p>
          <AuthField label="Mobile OTP" htmlFor="otp">
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
          <button type="submit" disabled={isSubmitting} className="auth-button">
            {isSubmitting ? "Verifying..." : "Verify & continue"}
          </button>
          <button
            type="button"
            className="auth-button-outline"
            style={{ marginTop: "0.5rem", width: "100%" }}
            disabled={isSubmitting}
            onClick={() => {
              setStep("details");
              setOtpCode("");
              setError("");
            }}
          >
            Change mobile number
          </button>
        </form>
      )}

      {step === "email" && (
        <div>
          <form onSubmit={emailSessionId ? handleVerifyEmailOtp : handleSendEmailOtp}>
            <AuthField label="Email" htmlFor="email" optional>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="you@example.com"
              />
            </AuthField>
            {emailSessionId ? (
              <>
                <AuthField label="Email OTP" htmlFor="emailOtp">
                  <input
                    id="emailOtp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    className="auth-input"
                    placeholder="6-digit code"
                  />
                </AuthField>
              </>
            ) : null}
            <button type="submit" disabled={isSubmitting} className="auth-button">
              {isSubmitting
                ? "Please wait..."
                : emailSessionId
                  ? "Verify email & continue"
                  : "Send email OTP"}
            </button>
          </form>
          <button
            type="button"
            className="auth-button-outline"
            style={{ marginTop: "0.5rem", width: "100%" }}
            disabled={isSubmitting}
            onClick={handleSkipEmail}
          >
            Skip email for now
          </button>
        </div>
      )}

      <AuthFooterLink
        text="Already have an account?"
        linkText="Log in"
        href="/login"
      />
    </AuthLayout>
  );
}
