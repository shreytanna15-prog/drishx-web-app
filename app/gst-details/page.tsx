"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthField, AuthLayout } from "@/components/auth-layout";
import { useAuth } from "@/contexts/auth-context";
import { submitGstDetails } from "@/lib/api";
import { buildPendingApprovalHref } from "@/lib/auth-routing";

function GstDetailsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: setSession } = useAuth();

  const userId = searchParams.get("userId") ?? "";
  const email = searchParams.get("email") ?? "";

  const [gstNumber, setGstNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!userId) {
      setError("Please sign up again to continue.");
      router.replace("/signup");
      return;
    }

    if (!gstNumber.trim() || !businessName.trim() || !businessAddress.trim()) {
      setError("GST number, business name, and address are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { user, token } = await submitGstDetails({
        userId,
        gstNumber: gstNumber.trim().toUpperCase(),
        businessName: businessName.trim(),
        businessAddress: businessAddress.trim(),
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
      });

      setSession(token, user);
      router.replace(buildPendingApprovalHref(email || user.email));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      wide
      step={2}
      title="GST details"
      subtitle="Submit your business GST information. Admin will review and approve your account."
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="auth-alert-error">{error}</div>}

        <AuthField label="GSTIN" htmlFor="gstNumber">
          <input
            id="gstNumber"
            type="text"
            autoCapitalize="characters"
            required
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
            className="auth-input"
            placeholder="22AAAAA0000A1Z5"
          />
        </AuthField>

        <AuthField label="Business name" htmlFor="businessName">
          <input
            id="businessName"
            type="text"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="auth-input"
            placeholder="Your business name"
          />
        </AuthField>

        <AuthField label="Business address" htmlFor="businessAddress">
          <textarea
            id="businessAddress"
            required
            rows={3}
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            className="auth-textarea"
            placeholder="Street, city, area"
          />
        </AuthField>

        <AuthField label="State" htmlFor="state" optional>
          <input
            id="state"
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="auth-input"
            placeholder="State"
          />
        </AuthField>

        <AuthField label="Pincode" htmlFor="pincode" optional>
          <input
            id="pincode"
            type="text"
            inputMode="numeric"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            className="auth-input"
            placeholder="Pincode"
          />
        </AuthField>

        <button type="submit" disabled={isSubmitting} className="auth-button">
          {isSubmitting ? "Submitting..." : "Submit for approval"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function GstDetailsPage() {
  return (
    <Suspense>
      <GstDetailsForm />
    </Suspense>
  );
}
