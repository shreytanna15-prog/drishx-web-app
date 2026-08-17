"use client";

import { cn } from "@/lib/utils";

type CategoryLensBleedProps = {
  src: string;
  alt: string;
  className?: string;
};

/**
 * Photorealistic glass cutout. Studio fill is already punched to alpha in the PNG.
 * Mask only feathers square photo corners.
 */
export function CategoryLensBleed({
  src,
  alt,
  className,
}: CategoryLensBleedProps) {
  return (
    <span
      className={cn(
        "category-lens-bleed relative mx-auto block shrink-0 overflow-hidden bg-transparent",
        className
      )}
      aria-hidden={alt ? undefined : true}
    >
      <span className="category-lens-bleed__mask">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="category-lens-bleed__img pointer-events-none absolute inset-0 size-full object-contain"
          loading="lazy"
        />
      </span>
    </span>
  );
}
