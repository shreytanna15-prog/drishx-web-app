"use client";

import { ArrowRight, CheckCircle2, Eye, Focus, Info, Palette } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useColorLensOrder } from "@/components/color/use-color-lens-order";
import {
  ColorCard,
  ColorPageHeader,
  ColorPrimaryButton,
} from "@/components/color/color-page-header";
import {
  COLOR_LENS_TYPE_OPTIONS,
  type ColorLensTypeId,
  type ColorLensTypeOption,
} from "@/lib/color-lens";
import { buildColorLensPath } from "@/lib/color-lens-order";
import { useColorLensBasePath } from "@/lib/on-behalf-order-hooks";
import { cn } from "@/lib/utils";

const TYPE_ICONS = {
  "single-vision": Eye,
  progressive: Focus,
  kryptok: Eye,
} as const;

function LensTypeCard({
  option,
  selected,
  onSelect,
}: {
  option: ColorLensTypeOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = TYPE_ICONS[option.id];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all sm:p-5",
        selected
          ? "border-[var(--brand-primary)]/50 bg-[color-mix(in_srgb,var(--brand-primary)_8%,var(--brand-card))] shadow-[0_8px_24px_-12px_rgba(240,161,50,0.25)]"
          : "border-[var(--brand-card-border)] bg-[var(--brand-card)] hover:border-[var(--brand-primary)]/30"
      )}
    >
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-[var(--brand-card-border)] bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]">
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-extrabold text-[var(--brand-text)]">
          {option.title}
        </span>
        <span className="mt-1 block text-sm font-medium text-[var(--brand-text-muted)]">
          {option.subtitle}
        </span>
      </span>
      {selected ? (
        <CheckCircle2 className="size-6 shrink-0 text-[var(--brand-primary)]" />
      ) : null}
    </button>
  );
}

export function ColorLensTypeScreen() {
  const router = useRouter();
  const basePath = useColorLensBasePath();
  const order = useColorLensOrder();
  const [selectedTypeId, setSelectedTypeId] = useState<ColorLensTypeId>("single-vision");

  const selectedType = useMemo(
    () =>
      COLOR_LENS_TYPE_OPTIONS.find((entry) => entry.id === selectedTypeId) ??
      COLOR_LENS_TYPE_OPTIONS[0],
    [selectedTypeId]
  );

  const colorLabel = order.colorName?.trim() || "your color";
  const colorHex = order.colorHex?.trim();

  const handleContinue = () => {
    router.push(
      buildColorLensPath(`${basePath}/enter-power`, {
        ...order,
        lensType: selectedTypeId,
      })
    );
  };

  return (
    <div className="relative mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <ColorPageHeader
        title="Select Lens Type"
        subtitle="Choose the lens that fits your vision needs"
        backHref={basePath}
      />

      {colorHex ? (
        <ColorCard className="mb-6 flex items-center gap-4">
          <span
            className="size-11 shrink-0 rounded-full border-2 border-white/70 shadow-md"
            style={{ backgroundColor: colorHex }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[var(--brand-text-muted)]">
              Selected tint
            </p>
            <p className="text-base font-extrabold text-[var(--brand-text)]">{colorLabel}</p>
          </div>
          <Palette className="size-5 shrink-0 text-[var(--brand-primary)]" />
        </ColorCard>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-[var(--brand-text)]">Lens categories</h2>
        <div className="space-y-3">
          {COLOR_LENS_TYPE_OPTIONS.map((option) => (
            <LensTypeCard
              key={option.id}
              option={option}
              selected={selectedTypeId === option.id}
              onSelect={() => setSelectedTypeId(option.id)}
            />
          ))}
        </div>

        <ColorCard>
          <div className="mb-2 flex items-center gap-2 text-[var(--brand-primary)]">
            <Info className="size-4" />
            <p className="text-sm font-extrabold text-[var(--brand-text)]">About Lens Type</p>
          </div>
          <p className="text-sm font-extrabold text-[var(--brand-primary)]">
            {selectedType.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--brand-text-muted)]">
            {selectedType.description}
          </p>
        </ColorCard>

        <ColorPrimaryButton onClick={handleContinue}>
          Continue
          <ArrowRight className="size-5" />
        </ColorPrimaryButton>
      </div>
    </div>
  );
}
