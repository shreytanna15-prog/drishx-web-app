"use client";

import { cn } from "@/lib/utils";

export function TintStrengthSlider({
  value,
  accentHex,
  onChange,
  disabled,
}: {
  value: number;
  accentHex: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const percent = Math.round(value);

  return (
    <div className={cn("space-y-3", disabled && "opacity-55")}>
      <div className="relative h-3">
        <div className="absolute inset-0 rounded-full bg-[var(--brand-background)]" />
        <div
          className="absolute inset-y-0 left-0 rounded-full opacity-90 transition-[width]"
          style={{ width: `${percent}%`, backgroundColor: accentHex }}
        />
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={percent}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
          style={
            {
              "--thumb-border": accentHex,
            } as React.CSSProperties
          }
          aria-label="Tint strength"
        />
      </div>
    </div>
  );
}

export function LightnessSlider({
  colorHex,
  value,
  onChange,
  label = "Brightness",
}: {
  colorHex: string;
  hue: number;
  saturation: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  const percent = Math.round(value);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
        {label}
      </span>
      <div
        className="relative flex h-52 w-9 items-center justify-center rounded-full p-1"
        style={{
          background: `linear-gradient(to bottom, color-mix(in srgb, ${colorHex} 20%, white), ${colorHex}, #111)`,
        }}
      >
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={percent}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 w-48 -rotate-90 cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
          style={{ borderColor: colorHex }}
          aria-label={label}
        />
      </div>
      <span className="text-xs font-bold text-[var(--brand-text-muted)]">{percent}%</span>
    </div>
  );
}
