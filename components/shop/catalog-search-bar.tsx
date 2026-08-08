"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { cn } from "@/lib/utils";

export function CatalogSearchBar({
  className,
  placeholder = "Search lenses, power, coating, brand...",
  initialQuery = "",
}: {
  className?: string;
  placeholder?: string;
  initialQuery?: string;
  replaceOnSubmit?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    const href = q
      ? `/shop/search?q=${encodeURIComponent(q)}`
      : "/shop/search";
    router.push(href);
  }

  function openFilters() {
    router.push("/shop/search");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative w-full", className)}
      role="search"
    >
      <div
        className={cn(
          "flex h-12 items-center gap-2.5 rounded-full border px-2 transition-colors",
          "border-[color-mix(in_srgb,var(--brand-primary)_28%,var(--brand-card-border))]",
          "bg-[var(--brand-card-elevated,var(--brand-card))]",
          "shadow-[0_10px_28px_-18px_rgba(0,0,0,0.55)]",
          focused &&
            "border-[color-mix(in_srgb,var(--brand-primary)_55%,var(--brand-card-border))] bg-[var(--brand-card)]"
        )}
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border",
            "border-[color-mix(in_srgb,var(--brand-primary)_22%,transparent)]",
            "bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)]",
            "text-[var(--brand-primary)]"
          )}
        >
          <Search className="size-4" aria-hidden />
        </span>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          aria-label="Search catalog"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-sm font-medium outline-none",
            "text-[var(--brand-text)] placeholder:text-[var(--brand-placeholder)]"
          )}
        />

        <button
          type="button"
          onClick={openFilters}
          aria-label="Open filters"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
            "border-[color-mix(in_srgb,var(--brand-primary)_35%,transparent)]",
            "bg-[color-mix(in_srgb,var(--brand-primary)_14%,transparent)]",
            "text-[var(--brand-primary)]",
            "hover:bg-[color-mix(in_srgb,var(--brand-primary)_22%,transparent)]"
          )}
        >
          <SlidersHorizontal className="size-4" />
        </button>
      </div>
    </form>
  );
}
