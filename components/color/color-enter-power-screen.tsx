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
import { RxAxisField } from "@/components/rx/rx-axis-field";
import { RxPowerStepper } from "@/components/rx/rx-power-stepper";
import { formatPowerLabel } from "@/lib/cart-utils";
import type { ColorLensTypeId } from "@/lib/color-lens";
import { buildColorLensPath } from "@/lib/color-lens-order";
import {
  buildAddOptions,
  buildCylOptions,
  buildSphOptions,
  createDefaultPrescription,
  lensTypeShowsAdd,
  snapPrescriptionToLensType,
  snapToOption,
  stepEyePower,
  type ColorLensPrescription,
  type EyePowerValues,
} from "@/lib/color-lens-prescription";
import {
  snapToRxAxis,
  stepRxAxis,
  stepRxSphCyl,
} from "@/lib/rx-order";

type EyeSide = "right" | "left";
type PowerField = keyof EyePowerValues;

function EyePowerCard({
  side,
  title,
  badge,
  values,
  showAdd,
  onStepField,
  onAxisChange,
}: {
  side: EyeSide;
  title: string;
  badge: string;
  values: EyePowerValues;
  showAdd: boolean;
  onStepField: (field: PowerField, direction: 1 | -1) => void;
  onAxisChange: (value: number) => void;
}) {
  const formatFieldValue = (field: PowerField, value: number) => {
    if (field === "axis") {
      return String(Math.round(value));
    }
    return formatPowerLabel(value);
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
            value={formatFieldValue("sph", values.sph)}
            onDecrease={() => onStepField("sph", -1)}
            onIncrease={() => onStepField("sph", 1)}
          />
        </div>
        <div>
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
            CYL
          </p>
          <RxPowerStepper
            value={formatFieldValue("cyl", values.cyl)}
            onDecrease={() => onStepField("cyl", -1)}
            onIncrease={() => onStepField("cyl", 1)}
          />
        </div>
        <div>
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
            AXIS
          </p>
          <RxAxisField
            value={values.axis}
            onDecrease={() => onStepField("axis", -1)}
            onIncrease={() => onStepField("axis", 1)}
            onCustomChange={onAxisChange}
          />
        </div>
        {showAdd ? (
          <div>
            <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
              ADD
            </p>
            <RxPowerStepper
              value={formatFieldValue("add", values.add)}
              onDecrease={() => onStepField("add", -1)}
              onIncrease={() => onStepField("add", 1)}
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
  const sphOptions = useMemo(() => buildSphOptions(), []);
  const cylOptions = useMemo(() => buildCylOptions(), []);
  const addOptions = useMemo(() => buildAddOptions(), []);

  useEffect(() => {
    setPrescription((current) =>
      snapPrescriptionToLensType(order.prescription ?? current, lensType)
    );
  }, [lensType, order.prescription]);

  const snapPower = useCallback(
    (field: PowerField, value: number): number => {
      if (field === "axis") {
        return snapToRxAxis(value);
      }
      if (field === "sph") {
        return snapToOption(value, sphOptions);
      }
      if (field === "cyl") {
        return snapToOption(value, cylOptions);
      }
      return snapToOption(value, addOptions);
    },
    [addOptions, cylOptions, sphOptions]
  );

  const stepField = useCallback(
    (field: PowerField, current: number, direction: 1 | -1): number => {
      if (field === "axis") {
        return stepRxAxis(current, direction);
      }
      if (field === "sph" || field === "cyl") {
        return stepRxSphCyl(field, current, direction);
      }
      return stepEyePower(field, current, direction);
    },
    []
  );

  const updateEyeField = useCallback(
    (side: EyeSide, field: PowerField, direction: 1 | -1) => {
      setPrescription((current) => {
        const updatedEye: EyePowerValues = {
          ...current[side],
          [field]: snapPower(
            field,
            stepField(field, current[side][field], direction)
          ),
        };

        if (sameForBothEyes) {
          return {
            right: { ...updatedEye },
            left: { ...updatedEye },
          };
        }

        return {
          ...current,
          [side]: updatedEye,
        };
      });
    },
    [sameForBothEyes, snapPower, stepField]
  );

  const updateAxisValue = useCallback(
    (side: EyeSide, value: number) => {
      setPrescription((current) => {
        const updatedEye: EyePowerValues = {
          ...current[side],
          axis: snapToRxAxis(value),
        };

        if (sameForBothEyes) {
          return {
            right: { ...updatedEye },
            left: { ...updatedEye },
          };
        }

        return {
          ...current,
          [side]: updatedEye,
        };
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
          onStepField={(field, direction) => updateEyeField("right", field, direction)}
          onAxisChange={(value) => updateAxisValue("right", value)}
        />

        {!sameForBothEyes ? (
          <EyePowerCard
            side="left"
            title="Left Eye"
            badge="L"
            values={prescription.left}
            showAdd={showAdd}
            onStepField={(field, direction) => updateEyeField("left", field, direction)}
            onAxisChange={(value) => updateAxisValue("left", value)}
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
