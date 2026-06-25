"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  AuthField,
  AuthFooterLink,
  AuthLayout,
} from "@/components/auth-layout";
import { buildGstDetailsHref } from "@/lib/auth-routing";
import { signup } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Name, email, and password are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Please make sure both passwords match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signup(email, password, name);
      const userId = result.user?.id;

      if (!userId) {
        setError("Account was created but user id was missing.");
        return;
      }

      router.push(buildGstDetailsHref(userId, email.trim().toLowerCase()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Join Drishx to shop and track orders"
      step={1}
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="auth-alert-error">{error}</div>}

        <AuthField label="Full name" htmlFor="name">
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="auth-input"
            placeholder="John Doe"
          />
        </AuthField>

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
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            placeholder="Password"
          />
        </AuthField>

        <AuthField label="Confirm password" htmlFor="confirmPassword">
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="auth-input"
            placeholder="Confirm password"
          />
        </AuthField>

        <button type="submit" disabled={isSubmitting} className="auth-button">
          {isSubmitting ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <AuthFooterLink
        text="Already have an account?"
        linkText="Log in"
        href="/login"
      />
    </AuthLayout>
  );
}
