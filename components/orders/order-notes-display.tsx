"use client";

import { parseColorHexFromNotesLine } from "@/lib/color-lens-notes";

export function OrderNotesDisplay({ notes }: { notes: string }) {
  const lines = notes.split("\n").filter((line) => line.trim());

  return (
    <div className="space-y-1">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        const colorHex = parseColorHexFromNotesLine(trimmed);

        if (colorHex) {
          return (
            <p
              key={`${index}-${trimmed}`}
              className="flex flex-wrap items-center gap-2 text-sm leading-5 text-[var(--brand-text)]"
            >
              <span>{trimmed}</span>
              <span
                className="inline-block size-4 shrink-0 rounded-full border border-black/15 shadow-sm"
                style={{ backgroundColor: colorHex }}
                aria-label={`Color swatch ${colorHex}`}
                title={colorHex}
              />
            </p>
          );
        }

        return (
          <p
            key={`${index}-${trimmed}`}
            className="text-sm leading-5 text-[var(--brand-text)]"
          >
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
