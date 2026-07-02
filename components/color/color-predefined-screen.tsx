"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { TintStrengthSlider } from "@/components/color/color-mix-sliders";
import {
  ColorAccentButton,
  ColorCard,
  ColorPageHeader,
} from "@/components/color/color-page-header";
import { ColorSwatch } from "@/components/color/color-swatch";
import {
  COLOR_LENS_COLLECTION_LABEL,
  COLOR_LENS_DEFAULT_TINT_STRENGTH,
  buildColorLensPath,
} from "@/lib/color-lens-order";
import { PREDEFINED_LENS_COLORS } from "@/lib/color-lens";

export function ColorPredefinedScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tintStrength, setTintStrength] = useState(COLOR_LENS_DEFAULT_TINT_STRENGTH);

  const selectedColor = useMemo(
    () => PREDEFINED_LENS_COLORS.find((entry) => entry.id === selectedId) ?? null,
    [selectedId]
  );

  const handleContinue = () => {
    if (!selectedColor) return;
    router.push(
      buildColorLensPath("/color/lens-type", {
        colorId: selectedColor.id,
        colorName: selectedColor.name,
        colorHex: selectedColor.hex,
        colorHighlight: selectedColor.highlight,
        colorShadow: selectedColor.shadow,
        tintStrength,
      })
    );
  };

  return (
    <div className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <ColorPageHeader title="Predefined Colors" backHref="/color" />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <ColorCard>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-4">
            {PREDEFINED_LENS_COLORS.map((color) => (
              <ColorSwatch
                key={color.id}
                color={color}
                selected={selectedId === color.id}
                onSelect={() => setSelectedId(color.id)}
              />
            ))}
          </div>
        </ColorCard>

        <div className="space-y-4 lg:sticky lg:top-6">
          {selectedColor ? (
            <ColorCard className="flex items-center gap-4">
              <div
                className="relative size-12 shrink-0 overflow-hidden rounded-full shadow-md"
                style={{ backgroundColor: selectedColor.hex }}
              >
                <div
                  className="absolute left-2 top-2 size-3 rounded-full opacity-50"
                  style={{ backgroundColor: selectedColor.highlight }}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--brand-text-muted)]">
                  Selected Color
                </p>
                <p className="text-lg font-extrabold text-[var(--brand-text)]">
                  {selectedColor.name}
                </p>
                <p className="text-xs font-medium text-[var(--brand-text-muted)]">
                  {COLOR_LENS_COLLECTION_LABEL}
                </p>
              </div>
            </ColorCard>
          ) : (
            <ColorCard className="text-center">
              <p className="text-sm font-semibold text-[var(--brand-text-muted)]">
                Select a color to continue
              </p>
            </ColorCard>
          )}

          <ColorCard className={!selectedColor ? "opacity-55" : undefined}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-extrabold text-[var(--brand-text)]">
                  Tint Strength
                </p>
                <p className="mt-1 text-xs font-medium text-[var(--brand-text-muted)]">
                  How strong the lens tint appears
                </p>
              </div>
              <span className="text-xl font-extrabold text-[var(--brand-primary)]">
                {tintStrength}%
              </span>
            </div>
            <TintStrengthSlider
              value={tintStrength}
              accentHex={selectedColor?.hex ?? "#F0A132"}
              onChange={setTintStrength}
              disabled={!selectedColor}
            />
          </ColorCard>

          <ColorAccentButton disabled={!selectedColor} onClick={handleContinue}>
            Continue
            <ArrowRight className="size-5" />
          </ColorAccentButton>
        </div>
      </div>
    </div>
  );
}
