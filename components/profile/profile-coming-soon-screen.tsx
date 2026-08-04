"use client";

import { Construction, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProfileSubpageHeader } from "@/components/profile/profile-screen";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURE_LABELS: Record<string, string> = {
  "billing-address": "Billing Address",
  "outstanding-payments": "Outstanding / Payments",
  support: "Support",
};

export function ProfileComingSoonScreen() {
  const searchParams = useSearchParams();
  const feature = searchParams.get("feature") ?? "";
  const title = FEATURE_LABELS[feature] ?? "Coming soon";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
      <ProfileSubpageHeader title={title} />

      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center rounded-2xl border px-6 py-16 text-center",
          "border-[var(--brand-card-border)] bg-[var(--brand-card)] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.2)]"
        )}
      >
        <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]">
          <Construction className="size-8" />
        </span>
        <div className="mb-3 flex items-center gap-2 rounded-full border border-[var(--brand-card-border)] bg-[var(--brand-primary)]/10 px-4 py-2">
          <Sparkles className="size-4 text-[var(--brand-primary)]" />
          <span className="text-sm font-semibold text-[var(--brand-link)]">
            Coming soon
          </span>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-[var(--brand-text-muted)]">
          {title} will be available on the web portal soon. You can continue
          using the mobile app for this feature in the meantime.
        </p>
        <Button
          asChild
          className="mt-6 rounded-xl bg-gradient-to-r from-[#f5ad42] to-[#e8941f] font-bold text-[var(--brand-primary-text)]"
        >
          <Link href="/profile">Back to Profile</Link>
        </Button>
      </div>
    </div>
  );
}
