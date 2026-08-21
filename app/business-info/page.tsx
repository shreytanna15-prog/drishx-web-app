"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { AuthField, AuthLayout } from "@/components/auth-layout";
import { buildGstDetailsHref } from "@/lib/auth-routing";
import {
  getDraftForUser,
  saveRegistrationDraft,
} from "@/lib/registration-draft";

function BusinessInfoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get("userId") ?? "";
  const email = searchParams.get("email") ?? "";

  const [shopName, setShopName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [shopPhoneNumber, setShopPhoneNumber] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    const draft = getDraftForUser(userId, email);
    if (draft.business) {
      setShopName(draft.business.shopName);
      setBusinessType(draft.business.businessType);
      setAddressLine1(draft.business.addressLine1);
      setAddressLine2(draft.business.addressLine2);
      setCity(draft.business.city);
      setState(draft.business.state);
      setPincode(draft.business.pincode);
      setBusinessEmail(draft.business.businessEmail);
      setShopPhoneNumber(draft.business.shopPhoneNumber);
    }
  }, [userId, email]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!userId) {
      setError("Please sign up again to continue.");
      router.replace("/signup");
      return;
    }

    if (
      !shopName.trim() ||
      !businessType.trim() ||
      !addressLine1.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pincode.trim() ||
      !businessEmail.trim() ||
      !shopPhoneNumber.trim()
    ) {
      setError("Please fill in all required business fields.");
      return;
    }

    const draft = getDraftForUser(userId, email);
    saveRegistrationDraft({
      ...draft,
      business: {
        shopName: shopName.trim(),
        businessType: businessType.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        businessEmail: businessEmail.trim().toLowerCase(),
        shopPhoneNumber: shopPhoneNumber.trim(),
      },
    });

    router.push(buildGstDetailsHref(userId, email));
  }

  return (
    <AuthLayout
      wide
      step={2}
      title="Business info"
      subtitle="Tell us about your shop so we can set up your wholesale account."
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="auth-alert-error">{error}</div>}

        <AuthField label="Shop name" htmlFor="shopName">
          <input
            id="shopName"
            type="text"
            required
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="auth-input"
            placeholder="Shop / store name"
          />
        </AuthField>

        <AuthField label="Business type" htmlFor="businessType">
          <input
            id="businessType"
            type="text"
            required
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="auth-input"
            placeholder="Optical retail, distributor, etc."
          />
        </AuthField>

        <AuthField label="Address line 1" htmlFor="addressLine1">
          <input
            id="addressLine1"
            type="text"
            required
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            className="auth-input"
            placeholder="Street address"
          />
        </AuthField>

        <AuthField label="Address line 2" htmlFor="addressLine2" optional>
          <input
            id="addressLine2"
            type="text"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            className="auth-input"
            placeholder="Landmark, floor, area"
          />
        </AuthField>

        <AuthField label="City" htmlFor="city">
          <input
            id="city"
            type="text"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="auth-input"
            placeholder="City"
          />
        </AuthField>

        <AuthField label="State" htmlFor="state">
          <input
            id="state"
            type="text"
            required
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="auth-input"
            placeholder="State"
          />
        </AuthField>

        <AuthField label="Pin code" htmlFor="pincode">
          <input
            id="pincode"
            type="text"
            inputMode="numeric"
            required
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            className="auth-input"
            placeholder="Pincode"
          />
        </AuthField>

        <AuthField label="Business contact email" htmlFor="businessEmail">
          <input
            id="businessEmail"
            type="email"
            required
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
            className="auth-input"
            placeholder="business@example.com"
          />
        </AuthField>

        <AuthField label="Shop phone number" htmlFor="shopPhoneNumber">
          <input
            id="shopPhoneNumber"
            type="tel"
            inputMode="tel"
            required
            value={shopPhoneNumber}
            onChange={(e) => setShopPhoneNumber(e.target.value)}
            className="auth-input"
            placeholder="Shop phone number"
          />
        </AuthField>

        <button type="submit" className="auth-button">
          Continue
        </button>
      </form>
    </AuthLayout>
  );
}

export default function BusinessInfoPage() {
  return (
    <Suspense>
      <BusinessInfoForm />
    </Suspense>
  );
}
