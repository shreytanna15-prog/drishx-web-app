"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  AuthField,
  AuthLayout,
  AuthSectionTitle,
} from "@/components/auth-layout";
import { useAuth } from "@/contexts/auth-context";
import { buildPendingApprovalHref } from "@/lib/auth-routing";
import { useUpdateCustomerProfile } from "@/lib/modules/customer-profile/mutation/use-update-customer-profile";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, token, updateUser, isLoading } = useAuth();
  const { mutate, pending } = useUpdateCustomerProfile();

  const [name, setName] = useState("");
  const [alternateMobileNumber, setAlternateMobileNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [shopName, setShopName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [shopPhoneNumber, setShopPhoneNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [legalBusinessName, setLegalBusinessName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [gstRegistrationState, setGstRegistrationState] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [billingLegalName, setBillingLegalName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingPincode, setBillingPincode] = useState("");
  const [billingGstState, setBillingGstState] = useState("");
  const [shippingLegalName, setShippingLegalName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPincode, setShippingPincode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setAlternateMobileNumber(user.alternateMobileNumber ?? "");
    setWhatsappNumber(user.whatsappNumber ?? "");
    setShopName(user.shopName ?? "");
    setBusinessType(user.businessType ?? "");
    setAddressLine1(user.addressLine1 ?? "");
    setAddressLine2(user.addressLine2 ?? "");
    setCity(user.city ?? "");
    setState(user.state ?? "");
    setPincode(user.pincode ?? "");
    setBusinessEmail(user.businessEmail ?? "");
    setShopPhoneNumber(user.shopPhoneNumber ?? "");
    setGstNumber(user.gstNumber ?? "");
    setLegalBusinessName(user.legalBusinessName ?? "");
    setTradeName(user.tradeName ?? "");
    setGstRegistrationState(user.gstRegistrationState ?? "");
    setPanNumber(user.panNumber ?? "");
    setBillingLegalName(user.billingLegalName ?? "");
    setBillingAddress(user.billingAddress ?? "");
    setBillingCity(user.billingCity ?? "");
    setBillingState(user.billingState ?? "");
    setBillingPincode(user.billingPincode ?? "");
    setBillingGstState(user.billingGstState ?? "");
    setShippingLegalName(user.shippingLegalName ?? "");
    setShippingAddress(user.shippingAddress ?? "");
    setShippingCity(user.shippingCity ?? "");
    setShippingState(user.shippingState ?? "");
    setShippingPincode(user.shippingPincode ?? "");
  }, [user]);

  useEffect(() => {
    if (isLoading) return;
    if (!token || !user || user.role !== "CUSTOMER") {
      router.replace("/login");
    }
  }, [isLoading, token, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const result = await mutate({
        name: name.trim() || null,
        alternateMobileNumber: alternateMobileNumber.trim() || null,
        whatsappNumber: whatsappNumber.trim() || null,
        shopName: shopName.trim() || null,
        businessType: businessType.trim() || null,
        addressLine1: addressLine1.trim() || null,
        addressLine2: addressLine2.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        pincode: pincode.trim() || null,
        businessEmail: businessEmail.trim().toLowerCase() || null,
        shopPhoneNumber: shopPhoneNumber.trim() || null,
        gstNumber: gstNumber.trim().toUpperCase() || null,
        legalBusinessName: legalBusinessName.trim() || null,
        tradeName: tradeName.trim() || null,
        gstRegistrationState: gstRegistrationState.trim() || null,
        panNumber: panNumber.trim().toUpperCase() || null,
        billingLegalName: billingLegalName.trim() || null,
        billingAddress: billingAddress.trim() || null,
        billingCity: billingCity.trim() || null,
        billingState: billingState.trim() || null,
        billingPincode: billingPincode.trim() || null,
        billingGstState: billingGstState.trim() || null,
        shippingLegalName: shippingLegalName.trim() || null,
        shippingAddress: shippingAddress.trim() || null,
        shippingCity: shippingCity.trim() || null,
        shippingState: shippingState.trim() || null,
        shippingPincode: shippingPincode.trim() || null,
      });
      if (!result) return;
      updateUser(result.user);
      router.replace(buildPendingApprovalHref(result.user.email));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  }

  if (!user) {
    return (
      <AuthLayout title="Edit profile" subtitle="Loading…">
        <div className="auth-spinner" />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      wide
      title="Edit profile"
      subtitle="Saving sends your account back for admin approval. Orders stay frozen until you are approved again."
    >
      <form onSubmit={(e) => void handleSubmit(e)}>
        {error ? <div className="auth-alert-error">{error}</div> : null}

        <AuthSectionTitle>Account</AuthSectionTitle>
        <AuthField label="Name" htmlFor="name" optional>
          <input
            id="name"
            className="auth-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </AuthField>
        <AuthField label="Alternate mobile" htmlFor="altMobile" optional>
          <input
            id="altMobile"
            className="auth-input"
            value={alternateMobileNumber}
            onChange={(e) => setAlternateMobileNumber(e.target.value)}
          />
        </AuthField>
        <AuthField label="WhatsApp" htmlFor="whatsapp" optional>
          <input
            id="whatsapp"
            className="auth-input"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
          />
        </AuthField>

        <AuthSectionTitle>Business</AuthSectionTitle>
        <AuthField label="Shop name" htmlFor="shopName" optional>
          <input
            id="shopName"
            className="auth-input"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
        </AuthField>
        <AuthField label="Business type" htmlFor="businessType" optional>
          <input
            id="businessType"
            className="auth-input"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
          />
        </AuthField>
        <AuthField label="Address line 1" htmlFor="addressLine1" optional>
          <input
            id="addressLine1"
            className="auth-input"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
          />
        </AuthField>
        <AuthField label="Address line 2" htmlFor="addressLine2" optional>
          <input
            id="addressLine2"
            className="auth-input"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
          />
        </AuthField>
        <AuthField label="City" htmlFor="city" optional>
          <input
            id="city"
            className="auth-input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </AuthField>
        <AuthField label="State" htmlFor="state" optional>
          <input
            id="state"
            className="auth-input"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </AuthField>
        <AuthField label="Pincode" htmlFor="pincode" optional>
          <input
            id="pincode"
            className="auth-input"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
          />
        </AuthField>
        <AuthField label="Business email" htmlFor="businessEmail" optional>
          <input
            id="businessEmail"
            type="email"
            className="auth-input"
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
          />
        </AuthField>
        <AuthField label="Shop phone" htmlFor="shopPhone" optional>
          <input
            id="shopPhone"
            className="auth-input"
            value={shopPhoneNumber}
            onChange={(e) => setShopPhoneNumber(e.target.value)}
          />
        </AuthField>

        <AuthSectionTitle>GST</AuthSectionTitle>
        <AuthField label="GSTIN" htmlFor="gstNumber" optional>
          <input
            id="gstNumber"
            className="auth-input"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
          />
        </AuthField>
        <AuthField label="Legal business name" htmlFor="legalName" optional>
          <input
            id="legalName"
            className="auth-input"
            value={legalBusinessName}
            onChange={(e) => setLegalBusinessName(e.target.value)}
          />
        </AuthField>
        <AuthField label="Trade name" htmlFor="tradeName" optional>
          <input
            id="tradeName"
            className="auth-input"
            value={tradeName}
            onChange={(e) => setTradeName(e.target.value)}
          />
        </AuthField>
        <AuthField label="GST registration state" htmlFor="gstState" optional>
          <input
            id="gstState"
            className="auth-input"
            value={gstRegistrationState}
            onChange={(e) => setGstRegistrationState(e.target.value)}
          />
        </AuthField>
        <AuthField label="PAN" htmlFor="pan" optional>
          <input
            id="pan"
            className="auth-input"
            value={panNumber}
            onChange={(e) => setPanNumber(e.target.value)}
          />
        </AuthField>

        <AuthSectionTitle>Billing</AuthSectionTitle>
        <AuthField label="Legal name" htmlFor="billingLegalName" optional>
          <input
            id="billingLegalName"
            className="auth-input"
            value={billingLegalName}
            onChange={(e) => setBillingLegalName(e.target.value)}
          />
        </AuthField>
        <AuthField label="Address" htmlFor="billingAddress" optional>
          <input
            id="billingAddress"
            className="auth-input"
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
          />
        </AuthField>
        <AuthField label="City" htmlFor="billingCity" optional>
          <input
            id="billingCity"
            className="auth-input"
            value={billingCity}
            onChange={(e) => setBillingCity(e.target.value)}
          />
        </AuthField>
        <AuthField label="State" htmlFor="billingState" optional>
          <input
            id="billingState"
            className="auth-input"
            value={billingState}
            onChange={(e) => setBillingState(e.target.value)}
          />
        </AuthField>
        <AuthField label="PIN" htmlFor="billingPincode" optional>
          <input
            id="billingPincode"
            className="auth-input"
            value={billingPincode}
            onChange={(e) => setBillingPincode(e.target.value)}
          />
        </AuthField>
        <AuthField label="GST state" htmlFor="billingGstState" optional>
          <input
            id="billingGstState"
            className="auth-input"
            value={billingGstState}
            onChange={(e) => setBillingGstState(e.target.value)}
          />
        </AuthField>

        <AuthSectionTitle>Shipping</AuthSectionTitle>
        <AuthField label="Legal name" htmlFor="shippingLegalName" optional>
          <input
            id="shippingLegalName"
            className="auth-input"
            value={shippingLegalName}
            onChange={(e) => setShippingLegalName(e.target.value)}
          />
        </AuthField>
        <AuthField label="Address" htmlFor="shippingAddress" optional>
          <input
            id="shippingAddress"
            className="auth-input"
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
          />
        </AuthField>
        <AuthField label="City" htmlFor="shippingCity" optional>
          <input
            id="shippingCity"
            className="auth-input"
            value={shippingCity}
            onChange={(e) => setShippingCity(e.target.value)}
          />
        </AuthField>
        <AuthField label="State" htmlFor="shippingState" optional>
          <input
            id="shippingState"
            className="auth-input"
            value={shippingState}
            onChange={(e) => setShippingState(e.target.value)}
          />
        </AuthField>
        <AuthField label="PIN" htmlFor="shippingPincode" optional>
          <input
            id="shippingPincode"
            className="auth-input"
            value={shippingPincode}
            onChange={(e) => setShippingPincode(e.target.value)}
          />
        </AuthField>

        <button type="submit" className="auth-button" disabled={pending}>
          {pending ? "Saving…" : "Save & resubmit for approval"}
        </button>
        <p className="mt-4 text-center">
          <Link href="/pending-approval" className="auth-link">
            Back
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
