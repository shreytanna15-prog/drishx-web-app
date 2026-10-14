"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  AuthField,
  AuthFooterLink,
  AuthLayout,
} from "@/components/auth-layout";
import { buildBusinessInfoHref } from "@/lib/auth-routing";
import { signup } from "@/lib/api";
import {
  getDraftForUser,
  saveRegistrationDraft,
} from "@/lib/registration-draft";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternateMobileNumber, setAlternateMobileNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !mobileNumber.trim() || !email.trim() || !password.trim()) {
      setError("Full name, mobile, email, and password are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Please make sure both passwords match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await signup({
        email: normalizedEmail,
        password,
        name,
        businessName: businessName.trim() || undefined,
        mobileNumber,
        alternateMobileNumber,
        whatsappNumber,
      });
      const userId = result.user?.id;

      if (!userId) {
        setError("Account was created but user id was missing.");
        return;
      }

      saveRegistrationDraft(getDraftForUser(userId, normalizedEmail));
      router.push(buildBusinessInfoHref(userId, normalizedEmail));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      wide
      title="Create account"
      subtitle="Join Drishx to shop and track orders. Business and GST details are optional."
      step={1}
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="auth-alert-error">{error}</div>}

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

        <AuthField label="Alternate mobile number" htmlFor="alternateMobileNumber" optional>
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
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            placeholder="Password"
          />
        </AuthField>

        <AuthField label="Confirm password" htmlFor="confirmPassword">
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="auth-input"
            placeholder="Confirm password"
          />
        </AuthField>

        <button type="submit" disabled={isSubmitting} className="auth-button">
          {isSubmitting ? "Creating account..." : "Continue"}
        </button>
      </form>

      <AuthFooterLink
        text="Already have an account?"
        linkText="Log in"
        href="/login"
      />
    </AuthLayout>
  );
}
