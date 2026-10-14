"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { AuthField, AuthLayout } from "@/components/auth-layout";
import { buildRegistrationAddressesHref } from "@/lib/auth-routing";
import {
  EMPTY_GST_INFO,
  getDraftForUser,
  saveRegistrationDraft,
  validateOptionalGstinPan,
  type RegistrationGstInfo,
} from "@/lib/registration-draft";

function GstDetailsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get("userId") ?? "";
  const email = searchParams.get("email") ?? "";

  const [gstNumber, setGstNumber] = useState("");
  const [legalBusinessName, setLegalBusinessName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [gstRegistrationState, setGstRegistrationState] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    const draft = getDraftForUser(userId, email);
    if (draft.gst) {
      setGstNumber(draft.gst.gstNumber);
      setLegalBusinessName(draft.gst.legalBusinessName);
      setTradeName(draft.gst.tradeName);
      setGstRegistrationState(draft.gst.gstRegistrationState);
      setPanNumber(draft.gst.panNumber);
    }
  }, [userId, email]);

  function persistAndContinue(gst: RegistrationGstInfo) {
    if (!userId) {
      setError("Please sign up again to continue.");
      router.replace("/signup");
      return;
    }
    const draft = getDraftForUser(userId, email);
    saveRegistrationDraft({ ...draft, gst });
    router.push(buildRegistrationAddressesHref(userId, email));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const formatError = validateOptionalGstinPan({ gstNumber, panNumber });
    if (formatError) {
      setError(formatError);
      return;
    }

    persistAndContinue({
      gstNumber: gstNumber.trim().toUpperCase(),
      legalBusinessName: legalBusinessName.trim(),
      tradeName: tradeName.trim(),
      gstRegistrationState: gstRegistrationState.trim(),
      panNumber: panNumber.trim().toUpperCase(),
    });
  }

  function handleSkip() {
    setError("");
    persistAndContinue(EMPTY_GST_INFO);
  }

  return (
    <AuthLayout
      wide
      step={3}
      title="GST information"
      subtitle="GST details are optional. Without GST your account stays incomplete until an admin reviews it."
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="auth-alert-error">{error}</div>}

        <AuthField label="GSTIN" htmlFor="gstNumber" optional>
          <input
            id="gstNumber"
            type="text"
            autoCapitalize="characters"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
            className="auth-input"
            placeholder="22AAAAA0000A1Z5"
          />
        </AuthField>

        <AuthField label="Legal business name" htmlFor="legalBusinessName" optional>
          <input
            id="legalBusinessName"
            type="text"
            value={legalBusinessName}
            onChange={(e) => setLegalBusinessName(e.target.value)}
            className="auth-input"
            placeholder="Legal business name"
          />
        </AuthField>

        <AuthField label="Trade name" htmlFor="tradeName" optional>
          <input
            id="tradeName"
            type="text"
            value={tradeName}
            onChange={(e) => setTradeName(e.target.value)}
            className="auth-input"
            placeholder="Trade name"
          />
        </AuthField>

        <AuthField
          label="GST registration state"
          htmlFor="gstRegistrationState"
          optional
        >
          <input
            id="gstRegistrationState"
            type="text"
            value={gstRegistrationState}
            onChange={(e) => setGstRegistrationState(e.target.value)}
            className="auth-input"
            placeholder="GST registration state"
          />
        </AuthField>

        <AuthField label="PAN" htmlFor="panNumber" optional>
          <input
            id="panNumber"
            type="text"
            autoCapitalize="characters"
            value={panNumber}
            onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
            className="auth-input"
            placeholder="ABCDE1234F"
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

export default function GstDetailsPage() {
  return (
    <Suspense>
      <GstDetailsForm />
    </Suspense>
  );
}
