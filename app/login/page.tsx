"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import {
  AuthField,
  AuthFooterLink,
  AuthLayout,
} from "@/components/auth-layout";
import { useAuth } from "@/contexts/auth-context";
import { LoginRejectedError, login } from "@/lib/api";
import {
  buildGstDetailsHref,
  buildPendingApprovalHref,
  getCustomerNextRoute,
} from "@/lib/auth-routing";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: setSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

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

      const nextRoute = getCustomerNextRoute(data.user);
      if (nextRoute === "/gst-details") {
        router.push(buildGstDetailsHref(data.user.id, data.user.email));
      } else {
        router.push(nextRoute);
      }
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
      title="Login"
      subtitle="Welcome back to Drishx"
    >
      <form onSubmit={handleSubmit}>
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
            placeholder="Password"
          />
        </AuthField>

        <button type="submit" disabled={isSubmitting} className="auth-button">
          {isSubmitting ? "Signing in..." : "Log in"}
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
