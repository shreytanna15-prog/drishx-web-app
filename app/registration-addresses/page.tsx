"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import {
  AuthField,
  AuthLayout,
  AuthSectionTitle,
} from "@/components/auth-layout";
import { useAuth } from "@/contexts/auth-context";
import { submitGstDetails } from "@/lib/api";
import {
  buildBusinessInfoHref,
  buildGstDetailsHref,
  buildPendingApprovalHref,
} from "@/lib/auth-routing";
import {
  clearRegistrationDraft,
  getDraftForUser,
} from "@/lib/registration-draft";

function RegistrationAddressesForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: setSession } = useAuth();

  const userId = searchParams.get("userId") ?? "";
  const email = searchParams.get("email") ?? "";

  const [billingLegalName, setBillingLegalName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingPincode, setBillingPincode] = useState("");
  const [billingGstState, setBillingGstState] = useState("");

  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingLegalName, setShippingLegalName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPincode, setShippingPincode] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const draft = getDraftForUser(userId, email);
    if (!draft.business) {
      router.replace(buildBusinessInfoHref(userId, email));
      return;
    }
    if (!draft.gst) {
      router.replace(buildGstDetailsHref(userId, email));
    }
  }, [userId, email, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!userId) {
      setError("Please sign up again to continue.");
      router.replace("/signup");
      return;
    }

    const draft = getDraftForUser(userId, email);
    if (!draft.business) {
      router.replace(buildBusinessInfoHref(userId, email));
      return;
    }
    if (!draft.gst) {
      router.replace(buildGstDetailsHref(userId, email));
      return;
    }

    if (
      !billingLegalName.trim() ||
      !billingAddress.trim() ||
      !billingCity.trim() ||
      !billingState.trim() ||
      !billingPincode.trim() ||
      !billingGstState.trim()
    ) {
      setError("Please complete all billing address fields.");
      return;
    }

    const resolvedShipping = sameAsBilling
      ? {
          shippingLegalName: billingLegalName.trim(),
          shippingAddress: billingAddress.trim(),
          shippingCity: billingCity.trim(),
          shippingState: billingState.trim(),
          shippingPincode: billingPincode.trim(),
        }
      : {
          shippingLegalName: shippingLegalName.trim(),
          shippingAddress: shippingAddress.trim(),
          shippingCity: shippingCity.trim(),
          shippingState: shippingState.trim(),
          shippingPincode: shippingPincode.trim(),
        };

    if (
      !resolvedShipping.shippingLegalName ||
      !resolvedShipping.shippingAddress ||
      !resolvedShipping.shippingCity ||
      !resolvedShipping.shippingState ||
      !resolvedShipping.shippingPincode
    ) {
      setError("Please complete all shipping address fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { user, token } = await submitGstDetails({
        userId,
        ...draft.business,
        addressLine2: draft.business.addressLine2 || undefined,
        ...draft.gst,
        tradeName: draft.gst.tradeName || undefined,
        billingLegalName: billingLegalName.trim(),
        billingAddress: billingAddress.trim(),
        billingCity: billingCity.trim(),
        billingState: billingState.trim(),
        billingPincode: billingPincode.trim(),
        billingGstState: billingGstState.trim(),
        ...resolvedShipping,
      });

      clearRegistrationDraft();
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
      step={4}
      title="Billing & shipping"
      subtitle="Provide billing and delivery addresses for your account."
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="auth-alert-error">{error}</div>}

        <AuthSectionTitle>Billing address</AuthSectionTitle>

        <AuthField label="Legal name" htmlFor="billingLegalName">
          <input
            id="billingLegalName"
            type="text"
            required
            value={billingLegalName}
            onChange={(e) => setBillingLegalName(e.target.value)}
            className="auth-input"
            placeholder="Legal name"
          />
        </AuthField>

        <AuthField label="Address" htmlFor="billingAddress">
          <textarea
            id="billingAddress"
            required
            rows={3}
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            className="auth-textarea"
            placeholder="Billing address"
          />
        </AuthField>

        <AuthField label="City" htmlFor="billingCity">
          <input
            id="billingCity"
            type="text"
            required
            value={billingCity}
            onChange={(e) => setBillingCity(e.target.value)}
            className="auth-input"
            placeholder="City"
          />
        </AuthField>

        <AuthField label="State" htmlFor="billingState">
          <input
            id="billingState"
            type="text"
            required
            value={billingState}
            onChange={(e) => setBillingState(e.target.value)}
            className="auth-input"
            placeholder="State"
          />
        </AuthField>

        <AuthField label="PIN" htmlFor="billingPincode">
          <input
            id="billingPincode"
            type="text"
            inputMode="numeric"
            required
            value={billingPincode}
            onChange={(e) => setBillingPincode(e.target.value)}
            className="auth-input"
            placeholder="PIN code"
          />
        </AuthField>

        <AuthField label="GST state" htmlFor="billingGstState">
          <input
            id="billingGstState"
            type="text"
            required
            value={billingGstState}
            onChange={(e) => setBillingGstState(e.target.value)}
            className="auth-input"
            placeholder="GST state"
          />
        </AuthField>

        <AuthSectionTitle>Shipping / delivery address</AuthSectionTitle>

        <label
          className="auth-field"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={sameAsBilling}
            onChange={(e) => setSameAsBilling(e.target.checked)}
          />
          <span className="auth-label" style={{ marginBottom: 0 }}>
            Same as billing address
          </span>
        </label>

        {!sameAsBilling ? (
          <>
            <AuthField label="Legal name" htmlFor="shippingLegalName">
              <input
                id="shippingLegalName"
                type="text"
                required
                value={shippingLegalName}
                onChange={(e) => setShippingLegalName(e.target.value)}
                className="auth-input"
                placeholder="Legal name"
              />
            </AuthField>

            <AuthField label="Address" htmlFor="shippingAddress">
              <textarea
                id="shippingAddress"
                required
                rows={3}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="auth-textarea"
                placeholder="Shipping address"
              />
            </AuthField>

            <AuthField label="City" htmlFor="shippingCity">
              <input
                id="shippingCity"
                type="text"
                required
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                className="auth-input"
                placeholder="City"
              />
            </AuthField>

            <AuthField label="State" htmlFor="shippingState">
              <input
                id="shippingState"
                type="text"
                required
                value={shippingState}
                onChange={(e) => setShippingState(e.target.value)}
                className="auth-input"
                placeholder="State"
              />
            </AuthField>

            <AuthField label="PIN" htmlFor="shippingPincode">
              <input
                id="shippingPincode"
                type="text"
                inputMode="numeric"
                required
                value={shippingPincode}
                onChange={(e) => setShippingPincode(e.target.value)}
                className="auth-input"
                placeholder="PIN code"
              />
            </AuthField>
          </>
        ) : null}

        <button type="submit" disabled={isSubmitting} className="auth-button">
          {isSubmitting ? "Submitting..." : "Submit for approval"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function RegistrationAddressesPage() {
  return (
    <Suspense>
      <RegistrationAddressesForm />
    </Suspense>
  );
}
