"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  AuthField,
  AuthFooterLink,
  AuthLayout,
} from "@/components/auth-layout";
import { useAuth } from "@/contexts/auth-context";
import { LoginRejectedError, login } from "@/lib/api";
import {
  buildBusinessInfoHref,
  buildPendingApprovalHref,
  getPostLoginRoute,
} from "@/lib/auth-routing";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, login: setSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const emailParam = new URLSearchParams(window.location.search).get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  useEffect(() => {
    if (isLoading || !user) return;

    const nextRoute = getPostLoginRoute(user);
    if (nextRoute === "/business-info") {
      router.replace(buildBusinessInfoHref(user.id, user.email));
    } else if (nextRoute === "/pending-approval") {
      router.replace(buildPendingApprovalHref(user.email));
    } else if (nextRoute !== "/") {
      router.replace(nextRoute);
    }
  }, [user, isLoading, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const data = await login(normalizedEmail, password);
      setSession(data.token, data.user);
    } catch (err) {
      if (err instanceof LoginRejectedError) {
        router.push(
          buildPendingApprovalHref(email.trim().toLowerCase(), {
            rejected: true,
            reason: err.rejectionReason ?? undefined,
          })
        );
        return;
      }
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue ordering and tracking with Drishx."
      panelEyebrow="Customer portal"
      panelTitle="Your lens workflow, ready when you are."
      panelDescription="Access orders, inventory-backed fulfillment, and company tools in one place."
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="auth-alert-error">{error}</div>}

        <AuthField label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="you@example.com"
          />
        </AuthField>

        <AuthField label="Password" htmlFor="password">
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            placeholder="Enter your password"
          />
        </AuthField>

        <button type="submit" disabled={isSubmitting} className="auth-button">
          {isSubmitting ? "Signing in..." : "Sign in to Drishx"}
        </button>
      </form>

      <AuthFooterLink
        text="Don't have an account?"
        linkText="Create account"
        href="/signup"
      />
    </AuthLayout>
  );
}
