"use client";

import { useCallback, useEffect, useRef } from "react";
import { formatPowerLabel, powersEqual } from "@/lib/cart-utils";
import { cn } from "@/lib/utils";

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 3;
export const PRESCRIPTION_PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;

type PrescriptionWheelPickerProps = {
  options: number[];
  value: number;
  onChange: (value: number) => void;
  formatLabel?: (value: number) => string;
  className?: string;
};

function findOptionIndex(options: number[], value: number): number {
  const index = options.findIndex((option) => Math.abs(option - value) < 0.001);
  return index >= 0 ? index : 0;
}

export function PrescriptionWheelPicker({
  options,
  value,
  onChange,
  formatLabel = formatPowerLabel,
  className,
}: PrescriptionWheelPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const centerPadding = (PRESCRIPTION_PICKER_HEIGHT - ITEM_HEIGHT) / 2;

  const scrollToIndex = useCallback((index: number, smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: index * ITEM_HEIGHT,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    const index = findOptionIndex(options, value);
    scrollToIndex(index);
  }, [options, value, scrollToIndex]);

  useEffect(() => {
    if (options.length === 0) {
      return;
    }
    if (!options.some((option) => powersEqual(option, value))) {
      onChange(options[0]!);
    }
  }, [options, value, onChange]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      const index = Math.round(el.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, options.length - 1));
      const selected = options[clamped];
      if (selected !== undefined && Math.abs(selected - value) > 0.001) {
        onChange(selected);
      }
      scrollToIndex(clamped, true);
    }, 80);
  };

  const handleOptionClick = (index: number) => {
    const selected = options[index];
    if (selected !== undefined) {
      onChange(selected);
      scrollToIndex(index, true);
    }
  };

  if (options.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-[var(--brand-text-muted)]",
          className
        )}
        style={{ height: PRESCRIPTION_PICKER_HEIGHT }}
      >
        —
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ height: PRESCRIPTION_PICKER_HEIGHT }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 rounded-lg border border-[var(--brand-primary)]/35 bg-[var(--brand-primary)]/8"
        style={{ height: ITEM_HEIGHT }}
      />
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          scrollSnapType: "y mandatory",
          paddingTop: centerPadding,
          paddingBottom: centerPadding,
        }}
      >
        {options.map((option, index) => {
          const isSelected = Math.abs(option - value) < 0.001;
          return (
            <button
              key={`${option}-${index}`}
              type="button"
              onClick={() => handleOptionClick(index)}
              className={cn(
                "flex w-full items-center justify-center transition-all",
                isSelected
                  ? "text-base font-extrabold text-[var(--brand-text)]"
                  : "text-sm font-medium text-[var(--brand-text-muted)] opacity-50 hover:opacity-80"
              )}
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: "center",
              }}
            >
              {formatLabel(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
