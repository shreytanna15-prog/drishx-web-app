"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RxOrderPlacedModal({
  open,
  message,
  onClose,
  primaryHref = "/my-orders",
  primaryLabel = "View orders",
  secondaryHref = "/home",
  secondaryLabel = "Continue shopping",
}: {
  open: boolean;
  message: string;
  onClose: () => void;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-6 shadow-xl">
        <div className="mb-4 flex justify-center">
          <CheckCircle2 className="size-14 text-[var(--brand-success)]" />
        </div>
        <h3 className="text-center text-xl font-extrabold text-[var(--brand-text)]">
          Order placed
        </h3>
        <p className="mt-2 text-center text-sm leading-relaxed text-[var(--brand-text-muted)]">
          {message}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            className="h-11 flex-1 rounded-xl bg-gradient-to-b from-[#f5ad42] to-[#e8941f] font-bold text-[var(--brand-primary-text)]"
            asChild
            onClick={onClose}
          >
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <Button
            variant="outline"
            className="h-11 flex-1 rounded-xl border-[var(--brand-card-border)]"
            asChild
            onClick={onClose}
          >
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
