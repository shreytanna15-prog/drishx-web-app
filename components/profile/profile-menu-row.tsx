"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ProfileMenuRowProps = {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  variant?: "default" | "alt";
};

export function ProfileMenuRow({
  icon: Icon,
  label,
  href,
  onClick,
  danger = false,
  variant = "default",
}: ProfileMenuRowProps) {
  const className = cn(
    "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors sm:px-5 sm:py-4",
    variant === "alt"
      ? "bg-[color-mix(in_srgb,var(--brand-card)_92%,var(--brand-primary)_8%)]"
      : "bg-[var(--brand-card)]",
    !danger && "hover:bg-[var(--brand-primary)]/8",
    danger && "hover:bg-[var(--brand-danger)]/8"
  );

  const content = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <Icon
          className={cn(
            "size-5 shrink-0",
            danger ? "text-[var(--brand-danger)]" : "text-[var(--brand-text-muted)]"
          )}
        />
        <span
          className={cn(
            "truncate text-sm font-semibold sm:text-base",
            danger ? "text-[var(--brand-danger)]" : "text-[var(--brand-text)]"
          )}
        >
          {label}
        </span>
      </span>
      {!danger ? (
        <ChevronRight className="size-4 shrink-0 text-[var(--brand-text-muted)]" />
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
