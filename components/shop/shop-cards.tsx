"use client";

import { ChevronRight, Eye, Layers, ScanEye } from "lucide-react";
import Link from "next/link";
import { CatalogThumb } from "@/components/shop/catalog-thumb";
import { CategoryLensBleed } from "@/components/shop/category-lens-bleed";
import {
  catalogImageUrlForShopCategory,
  type CatalogImagesResponse,
} from "@/lib/catalog-images-api";
import type { LensCatalogItem } from "@/lib/lenses-api";
import type { ShopCategoryId } from "@/lib/shop-navigation";
import { useTheme } from "@/contexts/theme-context";

const CATEGORY_ICONS: Record<ShopCategoryId, typeof Eye> = {
  sv: ScanEye,
  kt: Eye,
  v2: Layers,
};

type ShopItemCardProps = {
  item: LensCatalogItem;
  category: ShopCategoryId;
  uppercase?: boolean;
  imageUrl?: string | null;
};

export function ShopItemCard({
  item,
  category,
  uppercase,
  imageUrl,
}: ShopItemCardProps) {
  const disabled = item.productCount < 1;
  const href = `/shop/products?category=${category}&item=${encodeURIComponent(item.name)}`;

  return (
    <Link
      href={disabled ? "#" : href}
      aria-disabled={disabled}
      onClick={disabled ? (e) => e.preventDefault() : undefined}
      className={cn(
        "group flex min-h-[7.5rem] flex-col items-center justify-center rounded-2xl border p-5 text-center transition-all",
        "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/50 hover:bg-[color-mix(in_srgb,var(--brand-primary)_6%,var(--brand-card))] hover:shadow-[0_12px_28px_-12px_rgba(240,161,50,0.35)]"
      )}
    >
      <CatalogThumb
        src={imageUrl}
        alt={item.name}
        className="mb-3 size-16"
      />
      <h3
        className={cn(
          "text-base font-extrabold leading-snug text-[var(--brand-text)]",
          uppercase && "uppercase tracking-wide"
        )}
      >
        {item.name}
      </h3>
      <p className="mt-2 text-sm font-medium text-[var(--brand-text-muted)]">
        {disabled
          ? "No products yet"
          : `${item.productCount} product${item.productCount === 1 ? "" : "s"}`}
      </p>
      {!disabled && (
        <ChevronRight className="mt-3 size-4 text-[var(--brand-text-muted)] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-[var(--brand-primary)] group-hover:opacity-100" />
      )}
    </Link>
  );
}

type ShopCategoryCardProps = {
  id: ShopCategoryId;
  title: string;
  subtitle: string;
  active?: boolean;
  onSelect?: () => void;
  imageUrl?: string | null;
  catalogImages?: CatalogImagesResponse | null;
  productCount?: number | null;
};

export function ShopCategoryCard({
  id,
  title,
  subtitle,
  active,
  onSelect,
  imageUrl,
  catalogImages = null,
  productCount,
}: ShopCategoryCardProps) {
  const Icon = CATEGORY_ICONS[id];
  const { resolvedTheme } = useTheme();
  const resolvedImageUrl =
    catalogImageUrlForShopCategory(catalogImages, id, resolvedTheme) ??
    imageUrl;
  const countLabel =
    productCount == null
      ? "Browse"
      : `${productCount} Product${productCount === 1 ? "" : "s"}`;

  const CardTag = onSelect ? "button" : "div";

  return (
    <CardTag
      {...(onSelect
        ? { type: "button" as const, onClick: onSelect }
        : {})}
      className={cn(
        "flex min-h-[15rem] w-full flex-col overflow-hidden rounded-[1.25rem] border p-4 text-left transition-all",
        "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
        active
          ? "border-[var(--brand-primary)]/55 bg-[color-mix(in_srgb,var(--brand-primary)_10%,var(--brand-card))] shadow-[0_8px_24px_-10px_rgba(240,161,50,0.35)]"
          : "hover:border-[var(--brand-primary)]/40 hover:bg-[color-mix(in_srgb,var(--brand-primary)_6%,var(--brand-card))]"
      )}
    >
      <div className="relative mb-2 flex h-[7.5rem] items-center justify-center overflow-hidden">
        {resolvedImageUrl ? (
          <CategoryLensBleed
            src={resolvedImageUrl}
            alt={title}
            className="size-[6.75rem]"
          />
        ) : (
          <span
            className={cn(
              "mt-8 flex size-14 items-center justify-center rounded-2xl",
              active
                ? "bg-[var(--brand-primary)] text-[var(--brand-primary-text)]"
                : "bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]"
            )}
          >
            <Icon className="size-6" />
          </span>
        )}

        <span className="absolute right-0 top-0 z-[2] flex size-7 items-center justify-center rounded-full border border-[var(--brand-card-border)] bg-[var(--brand-primary)]/10">
          <ChevronRight className="size-4 text-[var(--brand-text-muted)]" />
        </span>
      </div>

      <h3 className="mt-2 text-lg font-extrabold text-[var(--brand-text)]">
        {title}
      </h3>
      <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
        {subtitle}
      </p>

      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="text-sm font-bold text-[var(--brand-primary)]">
          {countLabel}
        </span>
        <span className="text-lg font-bold text-[var(--brand-primary)]" aria-hidden>
          →
        </span>
      </div>
    </CardTag>
  );
}
