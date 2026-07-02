"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useColorLensOrder } from "@/components/color/use-color-lens-order";
import {
  ColorCard,
  ColorPageHeader,
  ColorPrimaryButton,
} from "@/components/color/color-page-header";
import { RxPowerStepper } from "@/components/rx/rx-power-stepper";
import { formatPowerLabel } from "@/lib/cart-utils";
import type { ColorLensTypeId } from "@/lib/color-lens";
import { buildColorLensPath } from "@/lib/color-lens-order";
import {
  createDefaultPrescription,
  formatAxisPickerLabel,
  getAxisOptionsForLensType,
  lensTypeShowsAdd,
  snapPrescriptionToLensType,
  stepEyePower,
  type ColorLensPrescription,
  type EyePowerValues,
} from "@/lib/color-lens-prescription";

type EyeSide = "right" | "left";
type PowerField = keyof EyePowerValues;

function EyePowerCard({
  side,
  title,
  badge,
  values,
  showAdd,
  axisOptions,
  onFieldChange,
}: {
  side: EyeSide;
  title: string;
  badge: string;
  values: EyePowerValues;
  showAdd: boolean;
  axisOptions: number[];
  onFieldChange: (field: PowerField, value: number) => void;
}) {
  const stepField = (field: PowerField, direction: 1 | -1) => {
    onFieldChange(field, stepEyePower(field, values[field], direction));
  };

  const stepAxis = (direction: 1 | -1) => {
    const currentIndex = axisOptions.indexOf(values.axis);
    const nextIndex =
      currentIndex === -1
        ? 0
        : Math.min(
            axisOptions.length - 1,
            Math.max(0, currentIndex + direction)
          );
    onFieldChange("axis", axisOptions[nextIndex] ?? values.axis);
  };

  return (
    <ColorCard>
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-lg bg-[var(--brand-primary)]/15 px-2.5 py-1 text-xs font-extrabold text-[var(--brand-link)]">
          {badge}
        </span>
        <h3 className="text-base font-extrabold text-[var(--brand-text)]">{title}</h3>
      </div>

      <div className={`grid gap-4 ${showAdd ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
        <div>
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
            SPH
          </p>
          <RxPowerStepper
            value={formatPowerLabel(values.sph)}
            onDecrease={() => stepField("sph", -1)}
            onIncrease={() => stepField("sph", 1)}
          />
        </div>
        <div>
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
            CYL
          </p>
          <RxPowerStepper
            value={formatPowerLabel(values.cyl)}
            onDecrease={() => stepField("cyl", -1)}
            onIncrease={() => stepField("cyl", 1)}
          />
        </div>
        <div>
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
            AXIS
          </p>
          <RxPowerStepper
            value={formatAxisPickerLabel(values.axis)}
            onDecrease={() => stepAxis(-1)}
            onIncrease={() => stepAxis(1)}
          />
        </div>
        {showAdd ? (
          <div>
            <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
              ADD
            </p>
            <RxPowerStepper
              value={formatPowerLabel(values.add)}
              onDecrease={() => stepField("add", -1)}
              onIncrease={() => stepField("add", 1)}
            />
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-center text-xs font-semibold text-[var(--brand-text-muted)]">
        {side === "right" ? "OD — Oculus Dexter" : "OS — Oculus Sinister"}
      </p>
    </ColorCard>
  );
}

export function ColorEnterPowerScreen() {
  const router = useRouter();
  const order = useColorLensOrder();
  const lensType = (order.lensType as ColorLensTypeId | undefined) ?? "single-vision";

  const [prescription, setPrescription] = useState<ColorLensPrescription>(() =>
    order.prescription ?? createDefaultPrescription(lensType)
  );
  const [sameForBothEyes, setSameForBothEyes] = useState(true);

  const showAdd = lensTypeShowsAdd(lensType);
  const axisOptions = useMemo(() => getAxisOptionsForLensType(lensType), [lensType]);

  useEffect(() => {
    setPrescription((current) =>
      snapPrescriptionToLensType(
        order.prescription ?? current,
        lensType
      )
    );
  }, [lensType, order.prescription]);

  const updateEye = useCallback(
    (side: EyeSide, field: PowerField, value: number) => {
      setPrescription((current) => {
        const nextEye = { ...current[side], [field]: value };
        if (sameForBothEyes) {
          return { right: nextEye, left: { ...nextEye } };
        }
        return { ...current, [side]: nextEye };
      });
    },
    [sameForBothEyes]
  );

  const handleContinue = () => {
    const snapped = snapPrescriptionToLensType(prescription, lensType);
    router.push(
      buildColorLensPath("/color/lens-specifications", {
        ...order,
        prescription: snapped,
      })
    );
  };

  return (
    <div className="relative mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <ColorPageHeader
        title="Enter Power"
        subtitle="Set prescription values for each eye"
        backHref="/color"
      />

      <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-3">
        <input
          type="checkbox"
          checked={sameForBothEyes}
          onChange={(event) => {
            const checked = event.target.checked;
            setSameForBothEyes(checked);
            if (checked) {
              setPrescription((current) => ({
                right: current.right,
                left: { ...current.right },
              }));
            }
          }}
          className="size-4 accent-[var(--brand-primary)]"
        />
        <span className="text-sm font-bold text-[var(--brand-text)]">
          Same power for both eyes
        </span>
      </label>

      <div className="space-y-4">
        <EyePowerCard
          side="right"
          title="Right Eye"
          badge="R"
          values={prescription.right}
          showAdd={showAdd}
          axisOptions={axisOptions}
          onFieldChange={(field, value) => updateEye("right", field, value)}
        />

        {!sameForBothEyes ? (
          <EyePowerCard
            side="left"
            title="Left Eye"
            badge="L"
            values={prescription.left}
            showAdd={showAdd}
            axisOptions={axisOptions}
            onFieldChange={(field, value) => updateEye("left", field, value)}
          />
        ) : null}

        <ColorPrimaryButton onClick={handleContinue}>
          Continue
          <ArrowRight className="size-5" />
        </ColorPrimaryButton>
      </div>
    </div>
  );
}
