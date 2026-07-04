"use client";

import { PrescriptionWheelPicker } from "@/components/shop/prescription-wheel-picker";
import { WHOLESALE_STEP_OPTIONS } from "@/lib/wholesale-range-options";

type WholesaleRangePickerProps = {
  from: number;
  to: number;
  step: number;
  boundOptions: number[];
  onFromChange: (value: number) => void;
  onToChange: (value: number) => void;
  onStepChange: (value: number) => void;
};

export function WholesaleRangePicker({
  from,
  to,
  step,
  boundOptions,
  onFromChange,
  onToChange,
  onStepChange,
}: WholesaleRangePickerProps) {
  const stepOptions = [...WHOLESALE_STEP_OPTIONS];

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)]">
      <div className="grid grid-cols-3 bg-[color-mix(in_srgb,var(--brand-card)_85%,var(--brand-primary)_15%)] px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
        <span>From</span>
        <span>To</span>
        <span>Step</span>
      </div>
      <div className="grid grid-cols-3 items-center px-1 py-2">
        <PrescriptionWheelPicker
          options={boundOptions}
          value={from}
          onChange={onFromChange}
        />
        <PrescriptionWheelPicker
          options={boundOptions}
          value={to}
          onChange={onToChange}
        />
        <PrescriptionWheelPicker
          options={stepOptions}
          value={step}
          onChange={onStepChange}
        />
      </div>
    </div>
  );
}
