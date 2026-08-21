"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { useAuth } from "@/contexts/auth-context";
import { fetchCurrentUser } from "@/lib/api";
import { isCustomerApproved } from "@/lib/auth-routing";

const POLL_MS = 5000;

function PendingApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user, login, logout, updateUser } = useAuth();
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

      if (currentUser.approvalStatus === "REJECTED") {
        stopPolling();
        logout();
        router.replace("/login");
      }
    } catch {
      // Keep polling on transient network errors
    }
  }, [token, updateUser, login, router, logout, stopPolling]);

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
          : "Your registration details were submitted successfully. An admin must approve your account before you can use the portal."
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
              ? "Checking approval... You will be signed in automatically when your account is ready."
              : "Log in with your email to continue. Your account is waiting for admin approval."}
          </p>
        </div>
      )}

      {isRejected && (
        <div className="mt-2 flex flex-col gap-3">
          <Link href="/signup" className="auth-button">
            Sign up again
          </Link>
          <Link href="/login" className="auth-link" style={{ textAlign: "center" }}>
            Back to login
          </Link>
        </div>
      )}
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
