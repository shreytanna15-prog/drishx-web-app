"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  WHITE_LENS_TYPES,
  listWhiteProductLines,
  listWhiteVariants,
  parseWhiteLensType,
  parseWhiteProductLine,
  whiteLensTypeDisplayTitle,
} from "@/lib/white-catalog";
import { cn } from "@/lib/utils";

type WhiteLensHubProps = {
  lensType?: string;
  line?: string;
};

export function WhiteLensHub({ lensType: lensTypeParam, line: lineParam }: WhiteLensHubProps) {
  const lensType = parseWhiteLensType(lensTypeParam);
  const lineId = parseWhiteProductLine(lineParam);

  if (lineId && lensType) {
    const line = listWhiteProductLines(lensType).find((entry) => entry.id === lineId);
    const variants = listWhiteVariants(lineId);

    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
        <Button variant="ghost" asChild className="mb-4 px-0">
          <Link href={`/white/${lensType}`}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-extrabold text-[var(--brand-text)]">{line?.title}</h1>
        <p className="mt-1 text-sm text-[var(--brand-text-muted)]">Choose a power range</p>
        <div className="mt-6 space-y-3">
          {variants.map((variant) => (
            <Link
              key={variant.id}
              href={`/white/product?line=${lineId}&variant=${variant.id}`}
              className="flex items-center justify-between rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-4 transition-colors hover:border-[var(--brand-primary)]/40"
            >
              <div>
                <p className="font-extrabold text-[var(--brand-text)]">{variant.title}</p>
                <p className="text-sm text-[var(--brand-text-muted)]">{variant.subtitle}</p>
              </div>
              <ChevronRight className="size-5 text-[var(--brand-primary)]" />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (lensType) {
    const lines = listWhiteProductLines(lensType);
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
        <Button variant="ghost" asChild className="mb-4 px-0">
          <Link href="/white">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-extrabold text-[var(--brand-text)]">
          {whiteLensTypeDisplayTitle(lensType)}
        </h1>
        <p className="mt-1 text-sm text-[var(--brand-text-muted)]">Select a product line</p>
        <div className="mt-6 space-y-3">
          {lines.map((line) => (
            <Link
              key={line.id}
              href={`/white/${lensType}/${line.id}`}
              className="flex items-center justify-between rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-4 transition-colors hover:border-[var(--brand-primary)]/40"
            >
              <div>
                <p className="font-extrabold text-[var(--brand-text)]">{line.title}</p>
                <p className="text-sm text-[var(--brand-text-muted)]">{line.description}</p>
              </div>
              <ChevronRight className="size-5 text-[var(--brand-primary)]" />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
      <Button variant="ghost" asChild className="mb-4 px-0">
        <Link href="/">
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
      </Button>
      <h1 className="text-2xl font-extrabold text-[var(--brand-text)]">White</h1>
      <p className="mt-1 text-sm text-[var(--brand-text-muted)]">White lens product catalog</p>
      <div className="mt-6 space-y-3">
        {WHITE_LENS_TYPES.map((option) => (
          <Link
            key={option.id}
            href={`/white/${option.id}`}
            className={cn(
              "flex items-center justify-between rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-4 transition-colors hover:border-[var(--brand-primary)]/40"
            )}
          >
            <div>
              <p className="font-extrabold text-[var(--brand-text)]">{option.title}</p>
              <p className="text-sm text-[var(--brand-text-muted)]">{option.description}</p>
            </div>
            <ChevronRight className="size-5 text-[var(--brand-primary)]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
