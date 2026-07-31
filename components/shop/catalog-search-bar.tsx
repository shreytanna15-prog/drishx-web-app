"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CatalogSearchBar({
  className,
  placeholder = "Search lenses, brand, coating, power…",
  initialQuery = "",
}: {
  className?: string;
  placeholder?: string;
  initialQuery?: string;
  replaceOnSubmit?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    const href = q
      ? `/shop/search?q=${encodeURIComponent(q)}`
      : "/shop/search";
    router.push(href);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative w-full", className)}
      role="search"
    >
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--brand-text-muted)]" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search catalog"
        className="h-11 rounded-xl border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] pl-10 pr-3"
      />
    </form>
  );
}
