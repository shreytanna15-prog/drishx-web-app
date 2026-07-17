"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { BrandSplash } from "@/components/brand-splash";
import { useAuth } from "@/contexts/auth-context";
import {
  buildGstDetailsHref,
  buildPendingApprovalHref,
  getPostLoginRoute,
} from "@/lib/auth-routing";

const SPLASH_SESSION_KEY = "drishx-splash-done";

function shouldSkipSplash(): boolean {
  if (typeof window === "undefined") return false;

  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;

  if (nav?.type === "reload") {
    return false;
  }

  return sessionStorage.getItem(SPLASH_SESSION_KEY) === "1";
}

const LANDING_FEATURES = [
  { label: "Order", text: "Place lens orders online" },
  { label: "Track", text: "Monitor order status live" },
  { label: "Manage", text: "Your business account" },
] as const;

function HomeContent() {
  const { user, isLoading, logout } = useAuth();

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header__inner">
          <BrandLogo size="sm" />

          <nav className="landing-header__nav">
            {isLoading ? (
              <span
                className="text-sm"
                style={{ color: "var(--brand-text-muted)" }}
              >
                Loading...
              </span>
            ) : user ? (
              <>
                <span
                  className="hidden text-sm sm:inline"
                  style={{ color: "var(--brand-text-muted)" }}
                >
                  {user.name ?? user.email}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="auth-button-outline auth-button--inline"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="header-auth-pair">
                <Link
                  href="/login"
                  className="auth-button-outline auth-button--inline"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="auth-button auth-button--inline"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="landing-hero">
        <div className="landing-hero__content">
            <p className="brand-badge mb-5">Lens ordering portal</p>

            <Image
              src="/edited-photo.png"
              alt=""
              width={120}
              height={120}
              className="landing-hero__logo"
              priority
            />

            <h1 className="landing-hero__title">
              One System,
              <br />
              <span className="landing-hero__title-accent">
                Endless Possibilities.
              </span>
            </h1> 

            <p className="landing-hero__subtitle">
              Sign in to manage your orders, or create a new customer account
              to get started with Drishx.
            </p>

            <div className="landing-hero__actions">
              <Link href="/login" className="auth-button">
                Sign in
              </Link>
              <Link href="/signup" className="auth-button-outline">
                Create account
              </Link>
            </div>

            <div className="landing-features">
              {LANDING_FEATURES.map((feature) => (
                <div key={feature.label} className="landing-feature">
                  <span className="landing-feature__label">{feature.label}</span>
                  <p className="landing-feature__text">{feature.text}</p>
                </div>
              ))}
            </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const hasNavigated = useRef(false);

  const [mounted, setMounted] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (shouldSkipSplash()) {
      setSplashDone(true);
    }
  }, []);

  const handleSplashFinish = useCallback(() => {
    sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
    setSplashDone(true);
  }, []);

  const navigateAfterSplash = useCallback(() => {
    if (!splashDone || isLoading || hasNavigated.current || !user) {
      return;
    }

    const nextRoute = getPostLoginRoute(user);
    if (
      nextRoute === "/home" ||
      nextRoute === "/employee/home" ||
      nextRoute === "/gst-details" ||
      nextRoute === "/pending-approval"
    ) {
      hasNavigated.current = true;
      if (nextRoute === "/gst-details") {
        router.replace(buildGstDetailsHref(user.id, user.email));
      } else if (nextRoute === "/pending-approval") {
        router.replace(buildPendingApprovalHref(user.email));
      } else {
        router.replace(nextRoute);
      }
    }
  }, [splashDone, isLoading, user, router]);

  useEffect(() => {
    navigateAfterSplash();
  }, [navigateAfterSplash]);

  return (
    <>
      {mounted && !splashDone && (
        <BrandSplash onFinish={handleSplashFinish} />
      )}
      {!mounted && (
        <div className="brand-splash brand-splash--pending" aria-hidden />
      )}
      <div
        className={splashDone ? "flex min-h-full flex-1 flex-col" : "hidden"}
        aria-hidden={!splashDone}
      >
        <HomeContent />
      </div>
    </>
  );
}
