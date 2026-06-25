import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  wide?: boolean;
  step?: 1 | 2 | 3;
  showLogo?: boolean;
};

export function AuthLayout({
  title,
  subtitle,
  children,
  wide,
  step,
  showLogo = true,
}: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className={`auth-shell ${wide ? "auth-shell--wide" : ""}`}>
        {showLogo && (
          <div className="mb-6 flex justify-center">
            <BrandLogo />
          </div>
        )}

        <div className="auth-card">
          {step !== undefined && (
            <div className="auth-steps" aria-hidden>
              <div
                className={`auth-step ${step >= 1 ? "auth-step--active" : ""}`}
              />
              <div
                className={`auth-step ${step >= 2 ? "auth-step--active" : ""}`}
              />
              <div
                className={`auth-step ${step >= 3 ? "auth-step--active" : ""}`}
              />
            </div>
          )}

          <h1 className="auth-card-title">{title}</h1>
          <p className="auth-card-subtitle">{subtitle}</p>

          {children}
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

export function AuthField({ label, htmlFor, optional, children }: AuthFieldProps) {
  return (
    <div className="auth-field">
      <label htmlFor={htmlFor} className="auth-label">
        {label}
        {optional && (
          <span style={{ fontWeight: 400, color: "var(--brand-placeholder)" }}>
            {" "}
            (optional)
          </span>
        )}
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
