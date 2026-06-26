"use client";

import {
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  Eye,
  Focus,
  Minus,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RxCheckoutBar } from "@/components/rx/rx-checkout-bar";
import { RxDiameterField } from "@/components/rx/rx-diameter-field";
import { RxOrderPlacedModal } from "@/components/rx/rx-order-placed-modal";
import { RxPowerStepper } from "@/components/rx/rx-power-stepper";
import { RxRequirementField } from "@/components/rx/rx-requirement-field";
import { RxSectionHeader } from "@/components/rx/rx-section-header";
import { Button } from "@/components/ui/button";
import { formatPowerLabel } from "@/lib/cart-utils";
import {
  buildAddOptions,
  buildCylOptions,
  buildSphOptions,
  createDefaultRxPrescription,
  getRxLensCount,
  getRxOrderSummaryLabel,
  lensTypeTitle,
  PRODUCT_NAME_MAX,
  REMARKS_MAX,
  RX_LENS_COATING_PRESETS,
  RX_LENS_FEATURE_PRESETS,
  RX_LENS_INDEX_PRESETS,
  RX_LENS_TYPE_OPTIONS,
  RX_ORDER_FOR_OPTIONS,
  RX_REMARK_TAGS,
  rxShowsAdd,
  snapToRxAxis,
  stepEyePower,
  stepRxAxis,
  type RxEyePower,
  type RxLensTypeId,
  type RxOrderFor,
  type RxPrescription,
} from "@/lib/rx-order";
import { placeRxOrder, uploadRxPrescription } from "@/lib/rx-orders-api";
import { cn } from "@/lib/utils";

type EyeSide = "right" | "left";
type PowerField = "sph" | "cyl" | "axis" | "add";

const LENS_TYPE_ICONS = {
  "single-vision": Eye,
  progressive: Focus,
  kryptok: Eye,
} as const;

export function RxOrderScreen() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lensType, setLensType] = useState<RxLensTypeId>("single-vision");
  const [orderFor, setOrderFor] = useState<RxOrderFor>("both");
  const [pairQuantity, setPairQuantity] = useState(1);
  const [samePowerForBothEyes, setSamePowerForBothEyes] = useState(true);
  const [prescription, setPrescription] = useState<RxPrescription>(() =>
    createDefaultRxPrescription("single-vision")
  );
  const [feature, setFeature] = useState("Clear");
  const [lensIndex, setLensIndex] = useState("1.56");
  const [coating, setCoating] = useState("HMC");
  const [productName, setProductName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [remarkTags, setRemarkTags] = useState<string[]>([]);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderPlacedMessage, setOrderPlacedMessage] = useState<string | null>(
    null
  );
  const [showSummary, setShowSummary] = useState(false);

  const showAdd = rxShowsAdd(lensType);
  const sphOptions = useMemo(() => buildSphOptions(), []);
  const cylOptions = useMemo(() => buildCylOptions(), []);
  const addOptions = useMemo(() => buildAddOptions(), []);

  const orderSummaryLabel = getRxOrderSummaryLabel(orderFor, pairQuantity);
  const lensCount = getRxLensCount(orderFor, pairQuantity);

  useEffect(() => {
    setPrescription(createDefaultRxPrescription(lensType));
  }, [lensType]);

  useEffect(() => {
    if (!pickedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pickedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pickedFile]);

  const snapPower = useCallback(
    (field: PowerField, value: number): number => {
      if (field === "axis") {
        return snapToRxAxis(value);
      }
      if (field === "sph") {
        return sphOptions.reduce((best, option) =>
          Math.abs(option - value) < Math.abs(best - value) ? option : best
        );
      }
      if (field === "cyl") {
        return cylOptions.reduce((best, option) =>
          Math.abs(option - value) < Math.abs(best - value) ? option : best
        );
      }
      return addOptions.reduce((best, option) =>
        Math.abs(option - value) < Math.abs(best - value) ? option : best
      );
    },
    [addOptions, cylOptions, sphOptions]
  );

  const formatFieldValue = useCallback((field: PowerField, value: number) => {
    if (field === "axis") {
      return String(Math.round(value));
    }
    return formatPowerLabel(value);
  }, []);

  const stepField = useCallback(
    (field: PowerField, current: number, direction: 1 | -1): number => {
      if (field === "axis") {
        return stepRxAxis(current, direction);
      }
      return stepEyePower(field, current, direction);
    },
    []
  );

  const updateEyeField = useCallback(
    (eye: EyeSide, field: PowerField, direction: 1 | -1) => {
      setPrescription((current) => {
        const updatedEye: RxEyePower = {
          ...current[eye],
          [field]: snapPower(
            field,
            stepField(field, current[eye][field], direction)
          ),
        };

        if (samePowerForBothEyes && orderFor === "both") {
          return {
            right: { ...updatedEye },
            left: { ...updatedEye },
          };
        }

        return {
          ...current,
          [eye]: updatedEye,
        };
      });
    },
    [orderFor, samePowerForBothEyes, snapPower, stepField]
  );

  const updateDiameter = useCallback(
    (eye: EyeSide, value: string) => {
      const cleaned = value.replace(/[^0-9]/g, "");
      setPrescription((current) => {
        const updatedEye = { ...current[eye], diameter: cleaned };
        if (samePowerForBothEyes && orderFor === "both") {
          return {
            right: { ...updatedEye },
            left: { ...updatedEye },
          };
        }
        return { ...current, [eye]: updatedEye };
      });
    },
    [orderFor, samePowerForBothEyes]
  );

  const toggleSamePower = () => {
    setSamePowerForBothEyes((current) => {
      const next = !current;
      if (next) {
        setPrescription((prev) => ({
          right: { ...prev.right },
          left: { ...prev.right },
        }));
      }
      return next;
    });
  };

  const toggleRemarkTag = (tag: string) => {
    setRemarkTags((current) =>
      current.includes(tag)
        ? current.filter((entry) => entry !== tag)
        : [...current, tag]
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      window.alert("Please upload a JPG or PNG image.");
      return;
    }
    setPickedFile(file);
    event.target.value = "";
  };

  const handlePlaceOrder = async () => {
    if (placingOrder) {
      return;
    }

    setPlacingOrder(true);
    try {
      let prescriptionImageUrl: string | null = null;
      if (pickedFile) {
        const upload = await uploadRxPrescription(pickedFile);
        prescriptionImageUrl = upload.storedImageUrl || upload.imageUrl;
      }

      const result = await placeRxOrder({
        lensType,
        orderFor,
        quantity: lensCount,
        samePowerForBothEyes,
        prescription,
        feature: feature.trim() || "Clear",
        lensIndex: lensIndex.trim() || "1.56",
        coating: coating.trim() || "HMC",
        productName: productName.trim() || null,
        remarks: remarks.trim() || null,
        remarkTags,
        prescriptionImageUrl,
      });

      if (result.success) {
        setOrderPlacedMessage(result.message);
        return;
      }

      window.alert(result.error);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Could not place your order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  const showRightEye = orderFor === "both" || orderFor === "right";
  const showLeftEye = orderFor === "both" || orderFor === "left";
  const quantityHint =
    orderFor === "both"
      ? `You are ordering ${pairQuantity} ${pairQuantity === 1 ? "Pair" : "Pairs"} (${lensCount} Lenses)`
      : `You are ordering ${lensCount} ${lensCount === 1 ? "Lens" : "Lenses"}`;

  const summaryDetails = [
    `Lens: ${lensTypeTitle(lensType)}`,
    `Order: ${orderSummaryLabel}`,
    `Feature: ${feature.trim() || "Clear"}`,
    `Index: ${lensIndex.trim() || "1.56"}`,
    `Coating: ${coating.trim() || "HMC"}`,
    productName.trim() ? `Product: ${productName.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const powerFields = (
    ["sph", "cyl", "axis", ...(showAdd ? (["add"] as const) : [])] as PowerField[]
  ).map((field) => ({
    field,
    label:
      field === "sph"
        ? "SPH"
        : field === "cyl"
          ? "CYL"
          : field === "axis"
            ? "AXIS"
            : "ADD",
  }));

  return (
    <>
      <RxOrderPlacedModal
        open={orderPlacedMessage !== null}
        message={orderPlacedMessage ?? ""}
        onClose={() => setOrderPlacedMessage(null)}
      />

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center gap-3 border-b border-[var(--brand-card-border)] pb-4">
          <Button
            variant="outline"
            size="icon"
            className="size-9 shrink-0 rounded-xl border-[var(--brand-input-border)]"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ChevronLeft className="size-5 text-[var(--brand-primary)]" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-extrabold text-[var(--brand-text)] sm:text-2xl">
              New RX Order
            </h1>
            <p className="mt-0.5 text-sm text-[var(--brand-text-muted)]">
              Create a new prescription order
            </p>
          </div>
          <div className="size-9 shrink-0" aria-hidden />
        </div>

        <RxSectionHeader number={1} title="Lens Type" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {RX_LENS_TYPE_OPTIONS.map((option) => {
            const selected = lensType === option.id;
            const Icon = LENS_TYPE_ICONS[option.id];
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setLensType(option.id)}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all",
                  selected
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 shadow-sm"
                    : "border-[var(--brand-card-border)] bg-[var(--brand-card)] hover:border-[var(--brand-primary)]/35"
                )}
              >
                {selected ? (
                  <CheckCircle2 className="absolute right-2 top-2 size-4 text-[var(--brand-primary)]" />
                ) : null}
                <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]">
                  <Icon className="size-5" />
                </span>
                <span className="text-sm font-extrabold text-[var(--brand-text)]">
                  {option.title}
                </span>
                <span className="text-xs font-semibold text-[var(--brand-text-muted)]">
                  ({option.shortLabel})
                </span>
              </button>
            );
          })}
        </div>

        <RxSectionHeader number={2} title="Order For & Quantity" />
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-2">
            {RX_ORDER_FOR_OPTIONS.map((option) => {
              const selected = orderFor === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setOrderFor(option.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all sm:p-4",
                    selected
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10"
                      : "border-[var(--brand-card-border)] bg-[var(--brand-card)] hover:border-[var(--brand-primary)]/35"
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)]/15 text-xs font-extrabold text-[var(--brand-primary)]">
                    {option.badge}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold text-[var(--brand-text)]">
                      {option.title}
                    </span>
                    <span className="block text-xs text-[var(--brand-text-muted)]">
                      {option.subtitle}
                    </span>
                  </span>
                  {selected ? (
                    <CheckCircle2 className="size-5 shrink-0 text-[var(--brand-primary)]" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4">
            <p className="text-sm font-bold text-[var(--brand-text)]">Quantity</p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 rounded-xl"
                onClick={() => setPairQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="min-w-[2rem] text-center text-2xl font-extrabold text-[var(--brand-text)]">
                {pairQuantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 rounded-xl"
                onClick={() => setPairQuantity((q) => Math.min(99, q + 1))}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <p className="mt-3 text-center text-xs font-medium text-[var(--brand-text-muted)]">
              {quantityHint}
            </p>
          </div>
        </div>

        {orderFor === "both" ? (
          <button
            type="button"
            onClick={toggleSamePower}
            className="mt-4 flex w-full items-start gap-3 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 text-left"
          >
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2",
                samePowerForBothEyes
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]"
                  : "border-[var(--brand-card-border)]"
              )}
            >
              {samePowerForBothEyes ? (
                <Check className="size-3 text-[var(--brand-primary-text)]" />
              ) : null}
            </span>
            <span>
              <span className="block text-sm font-bold text-[var(--brand-text)]">
                Same power for both eyes
              </span>
              <span className="mt-0.5 block text-xs text-[var(--brand-text-muted)]">
                Enter power for Right eye, it will be applied to Left eye
              </span>
            </span>
          </button>
        ) : null}

        <RxSectionHeader number={3} title="Prescription" />
        <div className="overflow-hidden rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4">
          <div
            className={cn(
              "mb-3 grid gap-3",
              showRightEye && showLeftEye
                ? "grid-cols-[4.5rem_1fr_1fr]"
                : "grid-cols-[4.5rem_1fr]"
            )}
          >
            <div />
            {showRightEye ? (
              <p className="text-center text-sm font-extrabold text-[var(--brand-text)]">
                R
              </p>
            ) : null}
            {showLeftEye ? (
              <p className="text-center text-sm font-extrabold text-[var(--brand-text)]">
                L
              </p>
            ) : null}
          </div>

          {powerFields.map(({ field, label }) => (
            <div
              key={field}
              className={cn(
                "mb-3 grid items-center gap-3 last:mb-0",
                showRightEye && showLeftEye
                  ? "grid-cols-[4.5rem_1fr_1fr]"
                  : "grid-cols-[4.5rem_1fr]"
              )}
            >
              <p className="text-sm font-bold text-[var(--brand-text)]">{label}</p>
              {showRightEye ? (
                <RxPowerStepper
                  value={formatFieldValue(field, prescription.right[field])}
                  onDecrease={() => updateEyeField("right", field, -1)}
                  onIncrease={() => updateEyeField("right", field, 1)}
                />
              ) : null}
              {showLeftEye ? (
                <RxPowerStepper
                  value={formatFieldValue(field, prescription.left[field])}
                  onDecrease={() => updateEyeField("left", field, -1)}
                  onIncrease={() => updateEyeField("left", field, 1)}
                  disabled={orderFor === "both" && samePowerForBothEyes}
                />
              ) : null}
            </div>
          ))}

          <div
            className={cn(
              "grid items-center gap-3 border-t border-[var(--brand-card-border)] pt-3",
              showRightEye && showLeftEye
                ? "grid-cols-[4.5rem_1fr_1fr]"
                : "grid-cols-[4.5rem_1fr]"
            )}
          >
            <div>
              <p className="text-sm font-bold text-[var(--brand-text)]">Diameter</p>
              <p className="text-[10px] text-[var(--brand-text-muted)]">Optional</p>
            </div>
            {showRightEye ? (
              <RxDiameterField
                value={prescription.right.diameter}
                onChange={(value) => updateDiameter("right", value)}
              />
            ) : null}
            {showLeftEye ? (
              <RxDiameterField
                value={prescription.left.diameter}
                onChange={(value) => updateDiameter("left", value)}
                disabled={orderFor === "both" && samePowerForBothEyes}
              />
            ) : null}
          </div>
        </div>

        <RxSectionHeader number={4} title="Lens Requirements" />
        <div className="space-y-4 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4">
          <RxRequirementField
            label="Feature / Type"
            value={feature}
            onChange={setFeature}
            presets={RX_LENS_FEATURE_PRESETS}
            manualPlaceholder="Enter custom type"
          />
          <RxRequirementField
            label="Index"
            value={lensIndex}
            onChange={setLensIndex}
            presets={RX_LENS_INDEX_PRESETS}
            manualPlaceholder="Enter index"
          />
          <RxRequirementField
            label="Coating"
            value={coating}
            onChange={setCoating}
            presets={RX_LENS_COATING_PRESETS}
            manualPlaceholder="Enter custom coating"
          />
        </div>

        <RxSectionHeader number={5} title="Product Name (Optional)" />
        <div className="relative rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4">
          <textarea
            value={productName}
            onChange={(event) =>
              setProductName(event.target.value.slice(0, PRODUCT_NAME_MAX))
            }
            placeholder="Enter product name manually. Example: Prime Blue Cut 1.67 / Zeiss SmartLife / Crizal Sapphire"
            rows={3}
            className="w-full resize-none bg-transparent text-sm text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-text-muted)]"
          />
          <p className="mt-2 text-right text-xs text-[var(--brand-text-muted)]">
            {productName.length}/{PRODUCT_NAME_MAX}
          </p>
        </div>

        <RxSectionHeader number={6} title="Attachments (Optional)" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="relative">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-[var(--brand-primary)]/40 bg-[var(--brand-primary)]/5 p-8 transition-colors hover:bg-[var(--brand-primary)]/10"
          >
            {previewUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewUrl}
                alt="Prescription preview"
                className="max-h-48 w-full object-contain"
              />
            ) : (
              <>
                <Camera className="size-8 text-[var(--brand-primary)]" />
                <span className="text-sm font-extrabold text-[var(--brand-text)]">
                  Prescription
                </span>
                <span className="text-xs text-[var(--brand-text-muted)]">
                  JPG or PNG
                </span>
              </>
            )}
          </button>
          {previewUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute right-3 top-3 size-8 rounded-full p-0"
              onClick={() => setPickedFile(null)}
              aria-label="Remove prescription image"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>

        <RxSectionHeader number={7} title="Remarks (Optional)" />
        <div className="relative rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4">
          <textarea
            value={remarks}
            onChange={(event) =>
              setRemarks(event.target.value.slice(0, REMARKS_MAX))
            }
            placeholder="Add any special instructions..."
            rows={3}
            className="w-full resize-none bg-transparent text-sm text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-text-muted)]"
          />
          <p className="mt-2 text-right text-xs text-[var(--brand-text-muted)]">
            {remarks.length}/{REMARKS_MAX}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {RX_REMARK_TAGS.map((tag) => {
            const active = remarkTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleRemarkTag(tag)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                  active
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]"
                    : "border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>

        <RxCheckoutBar
          orderSummaryLabel={orderSummaryLabel}
          summaryDetails={summaryDetails}
          showSummary={showSummary}
          onToggleSummary={() => setShowSummary((open) => !open)}
          placingOrder={placingOrder}
          onPlaceOrder={() => void handlePlaceOrder()}
          className={cn(
            "sticky z-20 mt-8",
            "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4"
          )}
        />
      </div>
    </>
  );
}
