"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CustomerCompany } from "@/lib/customers-api";
import {
  createWalkInCustomer,
  fetchWalkInHistory,
  lookupWalkInMobile,
  sendWalkInMobileOtp,
  verifyWalkInMobileOtp,
  WalkInApiError,
} from "@/lib/walk-in-customer-api";

type Props = {
  onCreated: (customer: CustomerCompany) => void;
};

type Phase = "idle" | "need_otp" | "need_create";

function customerLabel(c: CustomerCompany): string {
  return c.businessName || c.name || c.email || c.id;
}

export function EmployeeWalkInCreatePanel({ onCreated }: Props) {
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [shop, setShop] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CustomerCompany[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    void fetchWalkInHistory({ page: 1, limit: 20 })
      .then((page) => {
        if (!cancelled) setHistory(page.items);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLookup() {
    setError(null);
    setBusy(true);
    setPhase("idle");
    setChallengeId(null);
    setSessionId(null);
    setCode("");
    try {
      const result = await lookupWalkInMobile(mobile.trim());
      setMobile(result.mobileNumber || mobile.trim());

      if (result.kind === "path_a") {
        setError(
          result.message ??
            "This mobile is a self-signup customer. Use Order on behalf instead."
        );
        return;
      }
      if (result.kind === "staff_created" && !result.orderable) {
        setError(result.message ?? "This customer cannot be used for walk-in.");
        return;
      }
      if (
        result.kind === "staff_created" &&
        result.skipOtp &&
        result.customer?.id
      ) {
        onCreated(result.customer);
        return;
      }
      if (result.kind === "staff_created" && !result.skipOtp) {
        setPhase("need_otp");
        return;
      }
      // New mobile — OTP then create.
      setPhase("need_otp");
    } catch (err) {
      setError(
        err instanceof WalkInApiError || err instanceof Error
          ? err.message
          : "Failed to look up mobile."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSend() {
    setError(null);
    setBusy(true);
    try {
      const res = await sendWalkInMobileOtp(mobile.trim());
      setSessionId(res.providerSessionId);
      setMobile(res.mobileNumber);
    } catch (err) {
      setError(
        err instanceof WalkInApiError || err instanceof Error
          ? err.message
          : "Failed to send OTP."
      );
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
      setMobile(res.mobileNumber);

      if (res.walkInKind === "path_a" || res.code === "WALK_IN_PATH_A") {
        setError(
          res.message ??
            "This mobile is a self-signup customer. Use Order on behalf instead."
        );
        setPhase("idle");
        return;
      }
      if (res.code === "WALK_IN_NOT_ORDERABLE") {
        setError(res.message ?? "This customer cannot be used for walk-in.");
        setPhase("idle");
        return;
      }
      if (res.user?.id) {
        onCreated(res.user);
        return;
      }
      // No existing staff-created — collect optional name/shop and create.
      setPhase("need_create");
    } catch (err) {
      setError(
        err instanceof WalkInApiError || err instanceof Error
          ? err.message
          : "Failed to verify OTP."
      );
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
      setPhase("idle");
      setChallengeId(null);
    } catch (err) {
      setError(
        err instanceof WalkInApiError || err instanceof Error
          ? err.message
          : "Failed to create walk-in customer."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-[var(--brand-primary)]/40 bg-[var(--brand-card)] p-4">
      <div>
        <h3 className="text-sm font-bold text-[var(--brand-text)]">
          Walk-in customer
        </h3>
        <p className="mt-0.5 text-xs text-[var(--brand-text-muted)]">
          Staff-created only. Verified mobiles skip OTP; new mobiles need OTP
          then create.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={mobile}
          onChange={(e) => {
            setMobile(e.target.value);
            if (phase !== "idle") setPhase("idle");
          }}
          placeholder="10-digit mobile"
          className="h-10 rounded-xl"
          disabled={busy || phase === "need_create"}
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={busy || !mobile.trim() || phase === "need_create"}
          onClick={() => void handleLookup()}
        >
          {busy && phase === "idle" ? "…" : "Continue"}
        </Button>
      </div>

      {phase === "need_otp" || phase === "need_create" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={busy || phase === "need_create"}
            onClick={() => void handleSend()}
          >
            Send OTP
          </Button>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="OTP code"
            className="h-10 rounded-xl"
            disabled={busy || phase === "need_create"}
          />
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={busy || !code.trim() || phase === "need_create"}
            onClick={() => void handleVerify()}
          >
            Verify
          </Button>
        </div>
      ) : null}

      {phase === "need_create" ? (
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

      <div className="border-t border-[var(--brand-card-border)] pt-3">
        <p className="mb-2 text-xs font-semibold text-[var(--brand-text-muted)]">
          Recent staff-created
        </p>
        {historyLoading ? (
          <p className="text-xs text-[var(--brand-text-muted)]">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-xs text-[var(--brand-text-muted)]">
            No prior walk-in customers yet.
          </p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {history.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-[var(--brand-text)] hover:bg-[var(--brand-primary)]/10"
                  disabled={busy}
                  onClick={() => onCreated(c)}
                >
                  {customerLabel(c)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
