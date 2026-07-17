import Link from "next/link";
import { BrandLogo, BrandMark, BRAND_MARK_SRC } from "@/components/brand-logo";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  wide?: boolean;
  step?: 1 | 2 | 3;
  showLogo?: boolean;
  /** Highlighted highlight line under the brand panel title. */
  panelEyebrow?: string;
  panelTitle?: string;
  panelDescription?: string;
};

const DEFAULT_PANEL = {
  eyebrow: "Lens ordering portal",
  title: "One system for every order.",
  description:
    "Sign in to place lens orders, track fulfillment, and manage your account with Drishx.",
} as const;

export function AuthLayout({
  title,
  subtitle,
  children,
  wide,
  step,
  showLogo = true,
  panelEyebrow = DEFAULT_PANEL.eyebrow,
  panelTitle = DEFAULT_PANEL.title,
  panelDescription = DEFAULT_PANEL.description,
}: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className="auth-page__glow auth-page__glow--a" aria-hidden />
      <div className="auth-page__glow auth-page__glow--b" aria-hidden />
      <div className="auth-page__rings" aria-hidden />

      <div className={`auth-stage${wide ? " auth-stage--wide" : ""}`}>
        <aside className="auth-brand-panel">
          <div className="auth-brand-panel__mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_MARK_SRC}
              alt=""
              width={200}
              height={200}
              className="auth-brand-panel__logo"
              draggable={false}
              decoding="async"
            />
          </div>

          <p className="auth-brand-panel__eyebrow">{panelEyebrow}</p>
          <h2 className="auth-brand-panel__title">{panelTitle}</h2>
          <p className="auth-brand-panel__copy">{panelDescription}</p>

          <ul className="auth-brand-panel__points">
            <li>Order lenses online in minutes</li>
            <li>Track status from procurement to ship</li>
            <li>Manage company account details</li>
          </ul>

          <p className="auth-brand-panel__tagline">
            <span>Intelligence</span>
            <span aria-hidden>·</span>
            <span>Precision</span>
            <span aria-hidden>·</span>
            <span>Control</span>
          </p>
        </aside>

        <div className={`auth-shell${wide ? " auth-shell--wide" : ""}`}>
          {showLogo ? (
            <div className="auth-shell__logo">
              <BrandLogo href="/" size="sm" />
            </div>
          ) : null}

          <div className="auth-card">
            <div className="auth-card__accent" aria-hidden />

            {step !== undefined ? (
              <div className="auth-steps" aria-hidden>
                <div
                  className={`auth-step${step >= 1 ? " auth-step--active" : ""}`}
                />
                <div
                  className={`auth-step${step >= 2 ? " auth-step--active" : ""}`}
                />
                <div
                  className={`auth-step${step >= 3 ? " auth-step--active" : ""}`}
                />
              </div>
            ) : null}

            <div className="auth-card__heading">
              <BrandMark size="md" className="auth-card__heading-mark" />
              <div>
                <h1 className="auth-card-title">{title}</h1>
                <p className="auth-card-subtitle">{subtitle}</p>
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

type AuthFieldProps = {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
};

export function AuthField({
  label,
  htmlFor,
  optional,
  children,
}: AuthFieldProps) {
  return (
    <div className="auth-field">
      <label htmlFor={htmlFor} className="auth-label">
        {label}
        {optional ? (
          <span style={{ fontWeight: 400, color: "var(--brand-placeholder)" }}>
            {" "}
            (optional)
          </span>
        ) : null}
      </label>
      {children}
    </div>
  );
}

export function AuthFooterLink({
  text,
  linkText,
  href,
}: {
  text: string;
  linkText: string;
  href: string;
}) {
  return (
    <p className="auth-footer-text">
      {text}{" "}
      <Link href={href} className="auth-link">
        {linkText}
      </Link>
    </p>
  );
}
