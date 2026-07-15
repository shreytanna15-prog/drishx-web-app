"use client";

import { ArrowRight, CheckCircle2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { LightnessSlider, TintStrengthSlider } from "@/components/color/color-mix-sliders";
import {
  ColorCard,
  ColorPageHeader,
  ColorPrimaryButton,
} from "@/components/color/color-page-header";
import {
  ColorWheelPicker,
  createWheelColor,
  type WheelColor,
} from "@/components/color/color-wheel-picker";
import { buildColorLensPath } from "@/lib/color-lens-order";
import { hslToHex, mixHslColors, type HslColor } from "@/lib/color-utils";
import { useColorLensBasePath } from "@/lib/on-behalf-order-hooks";
import { cn } from "@/lib/utils";

const MAX_COLORS = 3;

const DEFAULT_COLORS: WheelColor[] = [
  createWheelColor("1", { h: 224, s: 75, l: 42 }),
  createWheelColor("2", { h: 265, s: 68, l: 50 }),
];

export function ColorCustomMixScreen() {
  const router = useRouter();
  const basePath = useColorLensBasePath();
  const [selectedColors, setSelectedColors] = useState<WheelColor[]>(DEFAULT_COLORS);
  const [activeColorId, setActiveColorId] = useState(DEFAULT_COLORS[0].id);
  const [tintStrength, setTintStrength] = useState(55);

  const activeColor =
    selectedColors.find((entry) => entry.id === activeColorId) ??
    selectedColors[0] ??
    null;

  const mixedPreview = useMemo(() => {
    const blended = mixHslColors(
      selectedColors.map((entry) => ({ h: entry.h, s: entry.s, l: entry.l }))
    );
    return hslToHex(blended);
  }, [selectedColors]);

  const updateColor = useCallback((id: string, next: HslColor) => {
    setSelectedColors((current) =>
      current.map((entry) =>
        entry.id === id ? createWheelColor(id, next) : entry
      )
    );
  }, []);

  const addColor = () => {
    if (selectedColors.length >= MAX_COLORS) return;

    const id = `${Date.now()}`;
    const last = selectedColors[selectedColors.length - 1];
    const nextColor = createWheelColor(id, {
      h: ((last?.h ?? 180) + 48) % 360,
      s: 72,
      l: 50,
    });

    setSelectedColors((current) => [...current, nextColor]);
    setActiveColorId(id);
  };

  const removeColor = (id: string) => {
    if (selectedColors.length <= 1) return;
    const remaining = selectedColors.filter((entry) => entry.id !== id);
    setSelectedColors(remaining);
    if (activeColorId === id) {
      setActiveColorId(remaining[0]?.id ?? "1");
    }
  };

  const handleNext = () => {
    router.push(
      buildColorLensPath(`${basePath}/lens-type`, {
        colorId: "custom-mix",
        colorName: "Custom Mix",
        colorHex: mixedPreview,
        tintStrength,
      })
    );
  };

  return (
    <div className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <ColorPageHeader
        title="Custom Mix"
        subtitle={`Blend up to ${MAX_COLORS} custom tints`}
        backHref={basePath}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="space-y-4">
          <ColorCard>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
              <ColorWheelPicker
                colors={selectedColors}
                activeColorId={activeColor?.id ?? selectedColors[0]?.id ?? "1"}
                onColorChange={updateColor}
                centerFill={mixedPreview}
              />
              {activeColor ? (
                <LightnessSlider
                  colorHex={activeColor.hex}
                  hue={activeColor.h}
                  saturation={activeColor.s}
                  value={activeColor.l}
                  onChange={(lightness) =>
                    updateColor(activeColor.id, {
                      h: activeColor.h,
                      s: activeColor.s,
                      l: lightness,
                    })
                  }
                />
              ) : null}
            </div>
            <p className="mt-4 text-center text-sm font-medium text-[var(--brand-text-muted)]">
              Drag on the wheel to pick hue. Use the slider to adjust brightness.
            </p>
          </ColorCard>

          <ColorCard>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-extrabold text-[var(--brand-text)]">
                Tint Strength
              </p>
              <span className="text-xl font-extrabold text-[var(--brand-primary)]">
                {tintStrength}%
              </span>
            </div>
            <p className="mb-4 text-xs font-medium text-[var(--brand-text-muted)]">
              How strong the lens tint appears
            </p>
            <TintStrengthSlider
              value={tintStrength}
              accentHex={mixedPreview}
              onChange={setTintStrength}
            />
          </ColorCard>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6">
          <ColorCard>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-extrabold text-[var(--brand-text)]">
                Selected Colors
              </p>
              <span className="text-sm font-bold text-[var(--brand-text-muted)]">
                {selectedColors.length}/{MAX_COLORS}
              </span>
            </div>

            <div className="space-y-2">
              {selectedColors.map((entry) => {
                const isActive = entry.id === activeColor?.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setActiveColorId(entry.id)}
                    onDoubleClick={() => removeColor(entry.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                      isActive
                        ? "border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_10%,var(--brand-card))]"
                        : "border-transparent bg-[var(--brand-background)] hover:border-[var(--brand-card-border)]"
                    )}
                  >
                    <span
                      className="size-9 shrink-0 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: entry.hex }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold tracking-wide text-[var(--brand-text)]">
                        {entry.hex}
                      </span>
                      <span className="text-xs font-semibold text-[var(--brand-text-muted)]">
                        {entry.l}% light
                      </span>
                    </span>
                    {isActive ? (
                      <CheckCircle2 className="size-4 shrink-0 text-[var(--brand-primary)]" />
                    ) : null}
                  </button>
                );
              })}

              {selectedColors.length < MAX_COLORS ? (
                <button
                  type="button"
                  onClick={addColor}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--brand-card-border)] bg-[var(--brand-background)] px-3 py-3 text-sm font-extrabold text-[var(--brand-primary)] transition-colors hover:border-[var(--brand-primary)]/40"
                >
                  <Plus className="size-4" />
                  Add
                </button>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[var(--brand-card-border)] pt-4">
              <div>
                <p className="text-xs font-semibold text-[var(--brand-text-muted)]">
                  Blend preview
                </p>
                <p className="text-base font-extrabold tracking-wide text-[var(--brand-text)]">
                  {mixedPreview}
                </p>
              </div>
              <span
                className="size-12 rounded-full border-2 border-[var(--brand-card-border)] shadow-md"
                style={{ backgroundColor: mixedPreview }}
              />
            </div>
          </ColorCard>

          <ColorPrimaryButton onClick={handleNext}>
            Next
            <ArrowRight className="size-5" />
          </ColorPrimaryButton>
        </div>
      </div>
    </div>
  );
}
