"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { AuthField, AuthLayout } from "@/components/auth-layout";
import { buildGstDetailsHref } from "@/lib/auth-routing";
import {
  EMPTY_BUSINESS_INFO,
  getDraftForUser,
  saveRegistrationDraft,
  type RegistrationBusinessInfo,
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

  function persistAndContinue(business: RegistrationBusinessInfo) {
    if (!userId) {
      setError("Please sign up again to continue.");
      router.replace("/signup");
      return;
    }
    const draft = getDraftForUser(userId, email);
    saveRegistrationDraft({ ...draft, business });
    router.push(buildGstDetailsHref(userId, email));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    persistAndContinue({
      shopName: shopName.trim(),
      businessType: businessType.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      businessEmail: businessEmail.trim().toLowerCase(),
      shopPhoneNumber: shopPhoneNumber.trim(),
    });
  }

  function handleSkip() {
    setError("");
    persistAndContinue(EMPTY_BUSINESS_INFO);
  }

  return (
    <AuthLayout
      wide
      step={2}
      title="Business info"
      subtitle="Shop details are optional — you can skip and add them later."
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="auth-alert-error">{error}</div>}

        <AuthField label="Shop name" htmlFor="shopName" optional>
          <input
            id="shopName"
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="auth-input"
            placeholder="Shop / store name"
          />
        </AuthField>

        <AuthField label="Business type" htmlFor="businessType" optional>
          <input
            id="businessType"
            type="text"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="auth-input"
            placeholder="Optical retail, distributor, etc."
          />
        </AuthField>

        <AuthField label="Address line 1" htmlFor="addressLine1" optional>
          <input
            id="addressLine1"
            type="text"
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

        <AuthField label="City" htmlFor="city" optional>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="auth-input"
            placeholder="City"
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

        <AuthField label="Pin code" htmlFor="pincode" optional>
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

        <AuthField label="Business contact email" htmlFor="businessEmail" optional>
          <input
            id="businessEmail"
            type="email"
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
            className="auth-input"
            placeholder="business@example.com"
          />
        </AuthField>

        <AuthField label="Shop phone number" htmlFor="shopPhoneNumber" optional>
          <input
            id="shopPhoneNumber"
            type="tel"
            inputMode="tel"
            value={shopPhoneNumber}
            onChange={(e) => setShopPhoneNumber(e.target.value)}
            className="auth-input"
            placeholder="Shop phone number"
          />
        </AuthField>

        <button type="submit" className="auth-button">
          Continue
        </button>
        <button
          type="button"
          className="auth-link mt-3 w-full text-center"
          onClick={handleSkip}
        >
          Skip for now
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
