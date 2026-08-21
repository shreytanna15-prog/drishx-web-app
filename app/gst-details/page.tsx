"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { AuthField, AuthLayout } from "@/components/auth-layout";
import {
  buildBusinessInfoHref,
  buildRegistrationAddressesHref,
} from "@/lib/auth-routing";
import {
  getDraftForUser,
  saveRegistrationDraft,
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
    if (!draft.business) {
      router.replace(buildBusinessInfoHref(userId, email));
      return;
    }
    if (draft.gst) {
      setGstNumber(draft.gst.gstNumber);
      setLegalBusinessName(draft.gst.legalBusinessName);
      setTradeName(draft.gst.tradeName);
      setGstRegistrationState(draft.gst.gstRegistrationState);
      setPanNumber(draft.gst.panNumber);
    }
  }, [userId, email, router]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!userId) {
      setError("Please sign up again to continue.");
      router.replace("/signup");
      return;
    }

    if (
      !gstNumber.trim() ||
      !legalBusinessName.trim() ||
      !gstRegistrationState.trim() ||
      !panNumber.trim()
    ) {
      setError("GSTIN, legal business name, GST registration state, and PAN are required.");
      return;
    }

    const draft = getDraftForUser(userId, email);
    if (!draft.business) {
      router.replace(buildBusinessInfoHref(userId, email));
      return;
    }

    saveRegistrationDraft({
      ...draft,
      gst: {
        gstNumber: gstNumber.trim().toUpperCase(),
        legalBusinessName: legalBusinessName.trim(),
        tradeName: tradeName.trim(),
        gstRegistrationState: gstRegistrationState.trim(),
        panNumber: panNumber.trim().toUpperCase(),
      },
    });

    router.push(buildRegistrationAddressesHref(userId, email));
  }

  return (
    <AuthLayout
      wide
      step={3}
      title="GST information"
      subtitle="Submit your GST details. Admin will review and approve your account."
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

        <AuthField label="Legal business name" htmlFor="legalBusinessName">
          <input
            id="legalBusinessName"
            type="text"
            required
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

        <AuthField label="GST registration state" htmlFor="gstRegistrationState">
          <input
            id="gstRegistrationState"
            type="text"
            required
            value={gstRegistrationState}
            onChange={(e) => setGstRegistrationState(e.target.value)}
            className="auth-input"
            placeholder="GST registration state"
          />
        </AuthField>

        <AuthField label="PAN" htmlFor="panNumber">
          <input
            id="panNumber"
            type="text"
            autoCapitalize="characters"
            required
            value={panNumber}
            onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
            className="auth-input"
            placeholder="ABCDE1234F"
          />
        </AuthField>

        <button type="submit" className="auth-button">
          Continue
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
