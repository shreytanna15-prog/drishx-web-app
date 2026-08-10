"use client";

import { cn } from "@/lib/utils";

type CategoryLensBleedProps = {
  src: string;
  alt: string;
  className?: string;
};

/**
 * Lens art with a true CSS alpha radial mask.
 * Pass a transparent PNG (lens highlights only); the mask fades alpha into the card.
 */
export function CategoryLensBleed({
  src,
  alt,
  className,
}: CategoryLensBleedProps) {
  return (
    <span
      className={cn(
        "category-lens-bleed relative block shrink-0 overflow-hidden",
        className
      )}
      aria-hidden={alt ? undefined : true}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="category-lens-bleed__img pointer-events-none absolute object-contain"
        loading="lazy"
      />
    </span>
  );
}
