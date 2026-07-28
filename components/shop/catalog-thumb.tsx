"use client";

import { cn } from "@/lib/utils";

type CatalogThumbProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
};

/** Shared product/category thumbnail with muted fallback. */
export function CatalogThumb({
  src,
  alt,
  className,
  imgClassName,
}: CatalogThumbProps) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-xl border border-[var(--brand-card-border)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,var(--brand-card))]",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={cn("size-full object-contain p-1", imgClassName)}
          loading="lazy"
        />
      ) : (
        <span className="m-auto size-1/3 rounded-full bg-[var(--brand-primary)]/25" />
      )}
    </span>
  );
}
