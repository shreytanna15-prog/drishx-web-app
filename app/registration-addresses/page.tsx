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
import { buildPendingApprovalHref } from "@/lib/auth-routing";
import {
  clearRegistrationDraft,
  EMPTY_BUSINESS_INFO,
  EMPTY_GST_INFO,
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
    // RW-07: missing draft sections are fine — empty defaults are used on submit.
    if (!userId) return;
  }, [userId]);

  async function finalize(options: {
    includeAddresses: boolean;
  }) {
    if (!userId) {
      setError("Please sign up again to continue.");
      router.replace("/signup");
      return;
    }

    const draft = getDraftForUser(userId, email);
    const business = draft.business ?? EMPTY_BUSINESS_INFO;
    const gst = draft.gst ?? EMPTY_GST_INFO;

    const billing = options.includeAddresses
      ? {
          billingLegalName: billingLegalName.trim() || undefined,
          billingAddress: billingAddress.trim() || undefined,
          billingCity: billingCity.trim() || undefined,
          billingState: billingState.trim() || undefined,
          billingPincode: billingPincode.trim() || undefined,
          billingGstState: billingGstState.trim() || undefined,
        }
      : {};

    const shipping = options.includeAddresses
      ? sameAsBilling
        ? {
            shippingLegalName: billingLegalName.trim() || undefined,
            shippingAddress: billingAddress.trim() || undefined,
            shippingCity: billingCity.trim() || undefined,
            shippingState: billingState.trim() || undefined,
            shippingPincode: billingPincode.trim() || undefined,
          }
        : {
            shippingLegalName: shippingLegalName.trim() || undefined,
            shippingAddress: shippingAddress.trim() || undefined,
            shippingCity: shippingCity.trim() || undefined,
            shippingState: shippingState.trim() || undefined,
            shippingPincode: shippingPincode.trim() || undefined,
          }
      : {};

    setIsSubmitting(true);
    setError("");

    try {
      const { user, token } = await submitGstDetails({
        userId,
        shopName: business.shopName || undefined,
        businessType: business.businessType || undefined,
        addressLine1: business.addressLine1 || undefined,
        addressLine2: business.addressLine2 || undefined,
        city: business.city || undefined,
        state: business.state || undefined,
        pincode: business.pincode || undefined,
        businessEmail: business.businessEmail || undefined,
        shopPhoneNumber: business.shopPhoneNumber || undefined,
        gstNumber: gst.gstNumber || undefined,
        legalBusinessName: gst.legalBusinessName || undefined,
        tradeName: gst.tradeName || undefined,
        gstRegistrationState: gst.gstRegistrationState || undefined,
        panNumber: gst.panNumber || undefined,
        ...billing,
        ...shipping,
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await finalize({ includeAddresses: true });
  }

  async function handleSkip() {
    await finalize({ includeAddresses: false });
  }

  return (
    <AuthLayout
      wide
      step={4}
      title="Billing & shipping"
      subtitle="Addresses are optional. Skip to submit your registration for admin review."
    >
      <form onSubmit={(e) => void handleSubmit(e)}>
        {error && <div className="auth-alert-error">{error}</div>}

        <AuthSectionTitle>Billing address</AuthSectionTitle>

        <AuthField label="Legal name" htmlFor="billingLegalName" optional>
          <input
            id="billingLegalName"
            type="text"
            value={billingLegalName}
            onChange={(e) => setBillingLegalName(e.target.value)}
            className="auth-input"
            placeholder="Legal name"
          />
        </AuthField>

        <AuthField label="Address" htmlFor="billingAddress" optional>
          <textarea
            id="billingAddress"
            rows={3}
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            className="auth-textarea"
            placeholder="Billing address"
          />
        </AuthField>

        <AuthField label="City" htmlFor="billingCity" optional>
          <input
            id="billingCity"
            type="text"
            value={billingCity}
            onChange={(e) => setBillingCity(e.target.value)}
            className="auth-input"
            placeholder="City"
          />
        </AuthField>

        <AuthField label="State" htmlFor="billingState" optional>
          <input
            id="billingState"
            type="text"
            value={billingState}
            onChange={(e) => setBillingState(e.target.value)}
            className="auth-input"
            placeholder="State"
          />
        </AuthField>

        <AuthField label="PIN" htmlFor="billingPincode" optional>
          <input
            id="billingPincode"
            type="text"
            inputMode="numeric"
            value={billingPincode}
            onChange={(e) => setBillingPincode(e.target.value)}
            className="auth-input"
            placeholder="PIN code"
          />
        </AuthField>

        <AuthField label="GST state" htmlFor="billingGstState" optional>
          <input
            id="billingGstState"
            type="text"
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
            <AuthField label="Legal name" htmlFor="shippingLegalName" optional>
              <input
                id="shippingLegalName"
                type="text"
                value={shippingLegalName}
                onChange={(e) => setShippingLegalName(e.target.value)}
                className="auth-input"
                placeholder="Legal name"
              />
            </AuthField>

            <AuthField label="Address" htmlFor="shippingAddress" optional>
              <textarea
                id="shippingAddress"
                rows={3}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="auth-textarea"
                placeholder="Shipping address"
              />
            </AuthField>

            <AuthField label="City" htmlFor="shippingCity" optional>
              <input
                id="shippingCity"
                type="text"
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                className="auth-input"
                placeholder="City"
              />
            </AuthField>

            <AuthField label="State" htmlFor="shippingState" optional>
              <input
                id="shippingState"
                type="text"
                value={shippingState}
                onChange={(e) => setShippingState(e.target.value)}
                className="auth-input"
                placeholder="State"
              />
            </AuthField>

            <AuthField label="PIN" htmlFor="shippingPincode" optional>
              <input
                id="shippingPincode"
                type="text"
                inputMode="numeric"
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
        <button
          type="button"
          disabled={isSubmitting}
          className="auth-link mt-3 w-full text-center"
          onClick={() => void handleSkip()}
        >
          Skip addresses and submit
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
