"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { useAuth } from "@/contexts/auth-context";
import { fetchCurrentUser } from "@/lib/api";
import {
  buildBusinessInfoHref,
  isCustomerApproved,
} from "@/lib/auth-routing";

const POLL_MS = 5000;

function PendingApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user, login, updateUser } = useAuth();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const email = user?.email ?? searchParams.get("email") ?? "";
  const isRejected =
    user?.approvalStatus === "REJECTED" || searchParams.get("rejected") === "1";
  const rejectionReason =
    user?.rejectionReason ?? searchParams.get("reason") ?? null;

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const checkApproval = useCallback(async () => {
    if (!token) return;

    try {
      const currentUser = await fetchCurrentUser();
      updateUser(currentUser);

      if (isCustomerApproved(currentUser)) {
        stopPolling();
        login(token, currentUser);
        router.replace("/home");
        return;
      }

      // Phase E: rejected customers stay signed in so they can edit & resubmit.
      if (currentUser.approvalStatus === "REJECTED") {
        stopPolling();
      }
    } catch {
      // Keep polling on transient network errors
    }
  }, [token, updateUser, login, router, stopPolling]);

  useEffect(() => {
    if (isRejected) return;
    if (!token) return;

    void checkApproval();
    pollRef.current = setInterval(() => {
      void checkApproval();
    }, POLL_MS);

    return () => stopPolling();
  }, [token, isRejected, checkApproval, stopPolling]);

  return (
    <AuthLayout
      step={5}
      title={isRejected ? "Account rejected" : "Waiting for approval"}
      subtitle={
        isRejected
          ? rejectionReason ||
            "Your account was rejected by admin. Contact support or sign up again."
          : "Your account is pending admin approval. Self-serve orders stay frozen until you are approved."
      }
    >
      {email ? (
        <p
          className="mb-5 text-sm"
          style={{ color: "var(--brand-label)" }}
        >
          Account: {email}
        </p>
      ) : null}

      {!isRejected && (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="auth-spinner" />
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--brand-text-muted)" }}
          >
            {token
              ? user && !user.gstNumber
                ? "Your account is incomplete (no GST yet). An admin can still review it, or you can add business details below. Ordering stays frozen until approval."
                : "Checking approval… You will be signed in automatically when ready. Ordering stays frozen until then."
              : "Log in to continue. Your account is waiting for admin approval — ordering stays frozen until then."}
          </p>
          {user && !user.gstNumber && user.id ? (
            <Link
              href={buildBusinessInfoHref(user.id, user.email)}
              className="auth-link"
            >
              Complete business / GST details
            </Link>
          ) : null}
        </div>
      )}

      {isRejected && (
        <div className="mt-2 flex flex-col gap-3">
          {token ? (
            <Link href="/edit-profile" className="auth-button">
              Edit profile
            </Link>
          ) : (
            <Link href="/login" className="auth-button">
              Log in to edit profile
            </Link>
          )}
          <Link href="/signup" className="auth-link" style={{ textAlign: "center" }}>
            Sign up again
          </Link>
        </div>
      )}

      {!isRejected && token ? (
        <p className="mt-4 text-center">
          <Link href="/edit-profile" className="auth-link">
            Edit profile
          </Link>
        </p>
      ) : null}
    </AuthLayout>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense>
      <PendingApprovalContent />
    </Suspense>
  );
}
