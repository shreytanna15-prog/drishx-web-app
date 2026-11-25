"use client";

import { Blend, Eye, Layers, ShoppingCart, Boxes } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, type ComponentType } from "react";
import { CatalogSearchBar } from "@/components/shop/catalog-search-bar";
import { ShopItemsGrid } from "@/components/shop/shop-items-grid";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  parseShopCategory,
  SHOP_CATEGORIES,
  type ShopCategoryId,
} from "@/lib/shop-navigation";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<
  ShopCategoryId,
  ComponentType<{ className?: string }>
> = {
  sv: Eye,
  kt: Layers,
  v2: Blend,
};

const CATEGORY_CODES: Record<ShopCategoryId, string> = {
  sv: "SV",
  kt: "KT",
  v2: "V2",
};

export function ShopScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = parseShopCategory(searchParams.get("category"));

  const handleTabChange = useCallback(
    (value: string) => {
      const category = parseShopCategory(value);
      router.replace(`/shop?category=${category}`, { scroll: false });
    },
    [router]
  );

  return (
    <div className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(100%,36rem)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-4xl">
              Shop
            </h1>
            <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)] sm:text-base">
              Browse lens catalog by category
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild className="h-11 rounded-xl border-[var(--brand-input-border)] px-4 font-semibold text-[var(--brand-primary)]">
              <Link href="/shop/catalog"><Boxes className="size-4" />Catalog stock</Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="h-11 shrink-0 rounded-xl border-[var(--brand-input-border)] px-4 font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10"
            >
              <Link href="/cart">
                <ShoppingCart className="size-4" />
                View cart
              </Link>
            </Button>
          </div>
        </div>

        <CatalogSearchBar className="max-w-xl" />

        <Tabs
          value={activeCategory}
          onValueChange={handleTabChange}
          className="w-full gap-5"
        >
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand-label)]">
              Lens type
            </p>
            <TabsList
              className={cn(
                "grid h-auto! w-full grid-cols-3 gap-2 rounded-none border-0 bg-transparent p-0 sm:gap-3",
                "group-data-horizontal/tabs:h-auto!"
              )}
            >
              {SHOP_CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.id];
                return (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className={cn(
                      "group relative h-auto! flex-col items-stretch gap-0 rounded-2xl border px-3 py-3.5 text-left shadow-none transition-all duration-200 sm:px-4 sm:py-4",
                      "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
                      "hover:border-[color-mix(in_srgb,var(--brand-primary)_55%,var(--brand-card-border))]",
                      "hover:bg-[color-mix(in_srgb,var(--brand-primary)_6%,var(--brand-card))]",
                      "text-[var(--brand-text-muted)]",
                      "data-active:border-[var(--brand-primary)] data-active:bg-[color-mix(in_srgb,var(--brand-primary)_14%,var(--brand-card))]",
                      "data-active:text-[var(--brand-text)] data-active:shadow-[0_10px_28px_-14px_rgba(240,161,50,0.65)]",
                      "data-[state=active]:border-[var(--brand-primary)] data-[state=active]:bg-[color-mix(in_srgb,var(--brand-primary)_14%,var(--brand-card))]",
                      "data-[state=active]:text-[var(--brand-text)] data-[state=active]:shadow-[0_10px_28px_-14px_rgba(240,161,50,0.65)]",
                      "after:hidden!"
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-x-3 top-0 h-0.5 rounded-full opacity-0 transition-opacity",
                        "bg-[var(--brand-primary)]",
                        "group-data-active:opacity-100 group-data-[state=active]:opacity-100"
                      )}
                    />
                    <span className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors sm:size-10",
                          "border-[var(--brand-card-border)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)]",
                          "text-[var(--brand-text-muted)]",
                          "group-data-active:border-[color-mix(in_srgb,var(--brand-primary)_50%,transparent)]",
                          "group-data-active:bg-[var(--brand-primary)] group-data-active:text-[var(--brand-primary-text)]",
                          "group-data-[state=active]:border-[color-mix(in_srgb,var(--brand-primary)_50%,transparent)]",
                          "group-data-[state=active]:bg-[var(--brand-primary)] group-data-[state=active]:text-[var(--brand-primary-text)]"
                        )}
                      >
                        <Icon className="size-4 sm:size-[1.15rem]" />
                      </span>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider",
                          "bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)] text-[var(--brand-text-muted)]",
                          "group-data-active:bg-[var(--brand-primary)] group-data-active:text-[var(--brand-primary-text)]",
                          "group-data-[state=active]:bg-[var(--brand-primary)] group-data-[state=active]:text-[var(--brand-primary-text)]"
                        )}
                      >
                        {CATEGORY_CODES[cat.id]}
                      </span>
                    </span>
                    <span className="mt-3 block text-[13px] font-extrabold leading-snug tracking-tight text-current sm:text-sm">
                      {cat.tabLabel}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-medium text-[var(--brand-text-muted)] sm:text-xs">
                      {cat.subtitle}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {SHOP_CATEGORIES.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="mt-0 space-y-4">
              <ShopItemsGrid
                category={cat.id}
                uppercase={cat.id === "sv" || cat.id === "v2"}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
