"use client";

import {
  ArrowRight,
  Award,
  BadgeCheck,
  Eye,
  ImagePlus,
  Palette,
  Pipette,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ColorCard,
  ColorPageHeader,
} from "@/components/color/color-page-header";
import { COLOR_LENS_FEATURES, COLOR_LENS_MODES } from "@/lib/color-lens";
import { getOnBehalfCustomOrderContext } from "@/lib/on-behalf-custom-order";
import { useColorLensBasePath } from "@/lib/on-behalf-order-hooks";
import { cn } from "@/lib/utils";

const MODE_ICONS = {
  predefined: Palette,
  "upload-reference": ImagePlus,
  "custom-mix": Pipette,
} as const;

const FEATURE_ICONS = {
  preview: Eye,
  accuracy: BadgeCheck,
  quality: Award,
} as const;

export function ColorLensHub() {
  const router = useRouter();
  const basePath = useColorLensBasePath();
  const onBehalf = basePath.startsWith("/employee")
    ? getOnBehalfCustomOrderContext()
    : null;

  return (
    <div className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(100%,36rem)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative space-y-8">
        <ColorPageHeader
          title={onBehalf ? "Color order on behalf" : "Color Lens"}
          subtitle={
            onBehalf
              ? `For ${onBehalf.customerLabel}`
              : "Tinted & Fashion Prescription Lens"
          }
          backHref={onBehalf?.returnTo ?? "/home"}
        />

        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-[var(--brand-text)]">
            Choose Color Mode
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COLOR_LENS_MODES.map((mode, index) => {
              const Icon = MODE_ICONS[mode.id];
              const highlighted = index === 0;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => router.push(`${basePath}/${mode.id}`)}
                  className={cn(
                    "group flex min-h-[11rem] flex-col items-center gap-4 rounded-2xl border p-6 text-center transition-all",
                    "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
                    "hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/45 hover:shadow-[0_12px_32px_-12px_rgba(240,161,50,0.35)]",
                    highlighted &&
                      "border-[var(--brand-primary)]/60 bg-[color-mix(in_srgb,var(--brand-primary)_6%,var(--brand-card))] shadow-[0_8px_24px_-10px_rgba(240,161,50,0.3)]"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-14 items-center justify-center rounded-full border border-[var(--brand-card-border)] bg-[var(--brand-primary)]/12 text-[var(--brand-primary)] transition-colors group-hover:bg-[var(--brand-primary)]/18",
                      highlighted && "border-[var(--brand-primary)]/40 bg-[var(--brand-primary)]/20"
                    )}
                  >
                    <Icon className="size-7" />
                  </span>
                  <div className="space-y-1.5">
                    <p className="text-base font-extrabold text-[var(--brand-text)]">
                      {mode.title}
                    </p>
                    <p className="text-sm font-medium leading-snug text-[var(--brand-text-muted)]">
                      {mode.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-[var(--brand-text)]">
            Why choose us?
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {COLOR_LENS_FEATURES.map((feature) => {
              const Icon = FEATURE_ICONS[feature.id];
              return (
                <ColorCard
                  key={feature.id}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]">
                    <Icon className="size-5" />
                  </span>
                  <p className="text-sm font-bold text-[var(--brand-text-muted)]">
                    {feature.label}
                  </p>
                </ColorCard>
              );
            })}
          </div>
        </section>

        <ColorCard className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-extrabold text-[var(--brand-text)]">
              Need inspiration?
            </h3>
            <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
              Explore our color collections
            </p>
          </div>
          <Link
            href={`${basePath}/predefined`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#f5ad42] to-[#e8941f] px-5 py-3 text-sm font-extrabold text-[var(--brand-primary-text)] shadow-[0_4px_16px_rgba(240,161,50,0.3)] transition-all hover:from-[#f7b84e] hover:to-[#ec9d28]"
          >
            Explore
            <ArrowRight className="size-4" />
          </Link>
        </ColorCard>
      </div>
    </div>
  );
}
