"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function ColorPageHeader({
  title,
  subtitle,
  backHref = "/color",
  className,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex items-start gap-4", className)}>
      <Link
        href={backHref}
        className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-primary)] transition-colors hover:border-[var(--brand-primary)]/40 hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,var(--brand-card))]"
        aria-label="Go back"
      >
        <ArrowLeft className="size-5" />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>
    </header>
  );
}

export function ColorPrimaryButton({
  children,
  onClick,
  disabled,
  className,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-extrabold transition-all",
        "bg-gradient-to-b from-[#f5ad42] to-[#e8941f] text-[var(--brand-primary-text)]",
        "shadow-[0_4px_20px_rgba(240,161,50,0.35)] hover:from-[#f7b84e] hover:to-[#ec9d28]",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
        className
      )}
    >
      {children}
    </button>
  );
}

export function ColorAccentButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-extrabold text-white transition-all",
        "bg-gradient-to-b from-[#6366f1] to-[#4f46e5] shadow-[0_4px_20px_rgba(79,70,229,0.35)]",
        "hover:from-[#7577f5] hover:to-[#5b52ee]",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
        className
      )}
    >
      {children}
    </button>
  );
}

export function ColorCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5 shadow-[var(--brand-card-shadow)] sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
