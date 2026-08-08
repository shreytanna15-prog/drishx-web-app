"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type WholesalePromoBannerProps = {
  href?: string;
  className?: string;
};

/** Web adaptation of the mobile wholesale promo banner. */
export function WholesalePromoBanner({
  href = "/wholesale",
  className,
}: WholesalePromoBannerProps) {
  return (
    <div className={cn("relative", className)}>
      <span
        className={cn(
          "absolute top-0 left-5 z-[2] rounded-full px-4 py-1.5",
          "bg-white text-[13px] font-bold italic text-[#141414]",
          "shadow-[0_4px_14px_-4px_rgba(0,0,0,0.35)]"
        )}
      >
        Place wholesale order
      </span>

      <Link
        href={href}
        className={cn(
          "group relative mt-3.5 flex min-h-[6.5rem] items-center overflow-hidden rounded-[1.25rem] border",
          "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
          "px-5 pt-7 pb-5 sm:min-h-[7rem] sm:px-7 sm:pt-8 sm:pb-6",
          "shadow-[0_16px_36px_-22px_rgba(0,0,0,0.5)]",
          "transition-all hover:-translate-y-0.5",
          "hover:border-[var(--brand-primary)]/40",
          "hover:shadow-[0_18px_40px_-18px_rgba(240,161,50,0.28)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-background)]"
        )}
      >
        {/* Decorative gold rings — desktop-friendly, not overpowering */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 -right-10 size-44 -translate-y-1/2 rounded-full border border-[var(--brand-primary)]/20"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2 size-28 -translate-y-1/2 rounded-full border border-[var(--brand-primary)]/30"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-14 size-14 -translate-y-1/2 rounded-full bg-[var(--brand-primary)]/12"
        />

        <div className="relative z-[1] flex w-full items-center gap-4 sm:gap-6">
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-[var(--brand-text-muted)] sm:text-[0.95rem]">
            Choose from 1000+ products and get best wholesale prices
          </p>

          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-full sm:size-14",
              "bg-[var(--brand-primary)] text-[var(--brand-primary-text)]",
              "shadow-[0_8px_20px_-6px_rgba(240,161,50,0.55)]",
              "transition-transform group-hover:translate-x-0.5"
            )}
          >
            <ArrowRight className="size-5 sm:size-6" />
          </span>
        </div>
      </Link>
    </div>
  );
}
