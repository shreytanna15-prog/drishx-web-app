"use client";

import { CategoryLensBleed } from "@/components/shop/category-lens-bleed";
import { useTheme } from "@/contexts/theme-context";
import { catalogImageUrlForLensType } from "@/lib/catalog-images-api";
import type { LensType } from "@/lib/types/lens";
import { cn } from "@/lib/utils";

type CatalogThumbProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  lensType?: LensType | string | null;
};

/** Shared product thumbnail using the same radial blend as shop category cards. */
export function CatalogThumb({
  src,
  alt,
  className,
  lensType,
}: CatalogThumbProps) {
  const { resolvedTheme } = useTheme();
  const blendedSrc =
    catalogImageUrlForLensType(lensType ?? undefined, resolvedTheme) ?? src;

  if (!blendedSrc) {
    return (
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden bg-transparent",
          className
        )}
      >
        <span className="size-1/3 rounded-full bg-[var(--brand-primary)]/25" />
      </span>
    );
  }

  return (
    <CategoryLensBleed
      src={blendedSrc}
      alt={alt}
      className={cn("bg-transparent", className)}
    />
  );
}
