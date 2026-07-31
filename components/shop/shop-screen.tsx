"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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

export function ShopScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = parseShopCategory(searchParams.get("category"));
  const [activeCategory, setActiveCategory] =
    useState<ShopCategoryId>(initialCategory);

  useEffect(() => {
    setActiveCategory(parseShopCategory(searchParams.get("category")));
  }, [searchParams]);

  const handleTabChange = useCallback(
    (value: string) => {
      const category = parseShopCategory(value);
      setActiveCategory(category);
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

        <CatalogSearchBar className="max-w-xl" />

        <Tabs
          value={activeCategory}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList
            className={cn(
              "mb-2 h-auto w-full flex-wrap justify-start gap-2 rounded-2xl border p-1.5",
              "border-[var(--brand-card-border)] bg-[var(--brand-card)]"
            )}
          >
            {SHOP_CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
                  "text-[var(--brand-text-muted)] data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-[var(--brand-primary-text)] data-[state=active]:shadow-[0_4px_14px_-4px_rgba(240,161,50,0.55)]"
                )}
              >
                {cat.tabLabel}
              </TabsTrigger>
            ))}
          </TabsList>

          {SHOP_CATEGORIES.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="mt-4 space-y-4">
              <div className="rounded-2xl border border-[var(--brand-card-border)] bg-[color-mix(in_srgb,var(--brand-primary)_5%,var(--brand-card))] px-4 py-3 sm:px-5">
                <p className="text-sm font-bold text-[var(--brand-text)]">
                  {cat.title}
                </p>
                <p className="text-xs font-medium text-[var(--brand-text-muted)]">
                  {cat.subtitle}
                </p>
              </div>
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
