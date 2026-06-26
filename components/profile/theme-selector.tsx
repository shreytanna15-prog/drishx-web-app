"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: {
  id: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export function ThemeSelector() {
  const { preference, setPreference } = useTheme();

  return (
    <section className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.2)]">
      <h2 className="text-base font-extrabold text-[var(--brand-text)]">
        Appearance
      </h2>
      <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
        Choose light, dark, or match your device
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {OPTIONS.map(({ id, label, icon: Icon }) => {
          const active = preference === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPreference(id)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border px-3 py-4 transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/50",
                active
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/14 text-[var(--brand-primary)] shadow-[inset_0_0_0_1px_rgba(240,161,50,0.25)]"
                  : "border-[var(--brand-card-border)] bg-[color-mix(in_srgb,var(--brand-card)_94%,var(--brand-primary)_6%)] text-[var(--brand-text-muted)] hover:border-[var(--brand-primary)]/40 hover:text-[var(--brand-text)]"
              )}
              aria-pressed={active}
            >
              <Icon className="size-5" />
              <span className="text-xs font-bold sm:text-sm">{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
