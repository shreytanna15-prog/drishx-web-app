"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CustomerCompany } from "@/lib/customers-api";
import {
  createWalkInCustomer,
  sendWalkInMobileOtp,
  verifyWalkInMobileOtp,
} from "@/lib/walk-in-customer-api";

type Props = {
  onCreated: (customer: CustomerCompany) => void;
};

export function EmployeeWalkInCreatePanel({ onCreated }: Props) {
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [shop, setShop] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setError(null);
    setBusy(true);
    setVerified(false);
    setChallengeId(null);
    try {
      const res = await sendWalkInMobileOtp(mobile.trim());
      setSessionId(res.providerSessionId);
      setMobile(res.mobileNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setBusy(true);
    try {
      const res = await verifyWalkInMobileOtp({
        mobileNumber: mobile.trim(),
        code: code.trim(),
        providerSessionId: sessionId,
      });
      setChallengeId(res.challengeId);
      setVerified(true);
      setMobile(res.mobileNumber);
      if (res.user?.id) {
        onCreated(res.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    if (!challengeId) {
      setError("Verify mobile OTP first.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const customer = await createWalkInCustomer({
        mobileNumber: mobile.trim(),
        challengeId,
        name: name.trim() || undefined,
        shopName: shop.trim() || undefined,
      });
      onCreated(customer);
      setCode("");
      setName("");
      setShop("");
      setVerified(false);
      setChallengeId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create walk-in customer."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-[var(--brand-primary)]/40 bg-[var(--brand-card)] p-4">
      <div>
        <h3 className="text-sm font-bold text-[var(--brand-text)]">
          Create walk-in customer
        </h3>
        <p className="mt-0.5 text-xs text-[var(--brand-text-muted)]">
          Phone + OTP, then place order while Admin finishes commercial setup.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="10-digit mobile"
          className="h-10 rounded-xl"
          disabled={busy || verified}
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={busy || !mobile.trim() || verified}
          onClick={() => void handleSend()}
        >
          {busy ? "…" : "Send OTP"}
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="OTP code"
          className="h-10 rounded-xl"
          disabled={busy || verified}
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={busy || !code.trim() || verified}
          onClick={() => void handleVerify()}
        >
          {verified ? "Verified" : "Verify"}
        </Button>
      </div>

      {verified ? (
        <div className="space-y-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            className="h-10 rounded-xl"
            disabled={busy}
          />
          <Input
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            placeholder="Shop name (optional)"
            className="h-10 rounded-xl"
            disabled={busy}
          />
          <Button
            type="button"
            className="h-10 w-full rounded-xl bg-[var(--brand-primary)] font-bold text-[var(--brand-primary-text)]"
            disabled={busy}
            onClick={() => void handleCreate()}
          >
            {busy ? "Creating…" : "Create walk-in & select"}
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="text-xs font-medium text-[var(--brand-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
