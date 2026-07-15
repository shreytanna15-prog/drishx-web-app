"use client";

import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useColorLensOrder } from "@/components/color/use-color-lens-order";
import {
  ColorCard,
  ColorPageHeader,
  ColorPrimaryButton,
} from "@/components/color/color-page-header";
import { buildColorLensPath } from "@/lib/color-lens-order";
import {
  COLOR_LENS_DIAMETER_MM,
  formatLensIndex,
  getLensIndexForMaterial,
  getMaterialOptionsForLensType,
  type ColorLensMaterialId,
} from "@/lib/color-lens-specifications";
import { useColorLensBasePath } from "@/lib/on-behalf-order-hooks";
import { cn } from "@/lib/utils";

export function ColorLensSpecificationsScreen() {
  const router = useRouter();
  const basePath = useColorLensBasePath();
  const order = useColorLensOrder();

  const materialOptions = useMemo(
    () => getMaterialOptionsForLensType(order.lensType),
    [order.lensType]
  );

  const [selectedMaterialId, setSelectedMaterialId] = useState<ColorLensMaterialId>(
    (order.materialId as ColorLensMaterialId | undefined) ?? "tintable-brc"
  );
  const [materialPickerOpen, setMaterialPickerOpen] = useState(false);

  useEffect(() => {
    if (!materialOptions.some((option) => option.id === selectedMaterialId)) {
      setSelectedMaterialId(materialOptions[0]?.id ?? "tintable-brc");
    }
  }, [materialOptions, selectedMaterialId]);

  const selectedMaterial = useMemo(
    () =>
      materialOptions.find((entry) => entry.id === selectedMaterialId) ??
      materialOptions[0],
    [materialOptions, selectedMaterialId]
  );

  const lensIndex = formatLensIndex(getLensIndexForMaterial(selectedMaterialId));
  const colorLabel = order.colorName?.trim() || "Tinted lens";

  const handleContinue = () => {
    router.push(
      buildColorLensPath(`${basePath}/review-confirm`, {
        ...order,
        materialId: selectedMaterialId,
      })
    );
  };

  return (
    <div className="relative mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <ColorPageHeader
        title="Lens Specifications"
        subtitle={`Configure material and index for ${colorLabel}`}
        backHref={basePath}
      />

      <div className="space-y-4">
        <ColorCard className="divide-y divide-[var(--brand-card-border)] p-0">
          <button
            type="button"
            onClick={() => setMaterialPickerOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="text-sm font-semibold text-[var(--brand-text-muted)]">
              Material
            </span>
            <span className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-[var(--brand-text)]">
                {selectedMaterial?.title ?? "—"}
              </span>
              {materialPickerOpen ? (
                <ChevronUp className="size-4 text-[var(--brand-text-muted)]" />
              ) : (
                <ChevronDown className="size-4 text-[var(--brand-text-muted)]" />
              )}
            </span>
          </button>

          {materialPickerOpen ? (
            <div className="space-y-1 px-3 pb-3">
              {materialOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelectedMaterialId(option.id);
                    setMaterialPickerOpen(false);
                  }}
                  className={cn(
                    "flex w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors",
                    selectedMaterialId === option.id
                      ? "bg-[color-mix(in_srgb,var(--brand-primary)_12%,var(--brand-card))] text-[var(--brand-link)]"
                      : "text-[var(--brand-text)] hover:bg-[var(--brand-background)]"
                  )}
                >
                  {option.title}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="text-sm font-semibold text-[var(--brand-text-muted)]">
              Lens Index
            </span>
            <span className="text-sm font-extrabold text-[var(--brand-text)]">
              {lensIndex}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="text-sm font-semibold text-[var(--brand-text-muted)]">
              Diameter
            </span>
            <span className="text-sm font-extrabold text-[var(--brand-text)]">
              {COLOR_LENS_DIAMETER_MM} mm
            </span>
          </div>
        </ColorCard>

        <ColorPrimaryButton onClick={handleContinue}>
          Continue
          <ArrowRight className="size-5" />
        </ColorPrimaryButton>
      </div>
    </div>
  );
}
