import type { FilterOption } from "@/lib/types/lens";

export type ShopCategoryId = "sv" | "kt" | "v2";

export type ShopCategory = {
  id: ShopCategoryId;
  title: string;
  subtitle: string;
  tabLabel: string;
};

export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    id: "sv",
    title: "Single Vision",
    subtitle: "SV products",
    tabLabel: "Single Vision",
  },
  {
    id: "kt",
    title: "Kryptok",
    subtitle: "KT products",
    tabLabel: "Kryptok",
  },
  {
    id: "v2",
    title: "Progressive",
    subtitle: "V2 products",
    tabLabel: "Progressive",
  },
];

export function shopCategoryToFilter(category: ShopCategoryId): FilterOption {
  switch (category) {
    case "sv":
      return "Single Vision";
    case "kt":
      return "Kryptok";
    case "v2":
      return "Progressive";
  }
}

export function shopCategoryToApiType(category: ShopCategoryId): string {
  switch (category) {
    case "sv":
      return "single-vision";
    case "kt":
      return "kryptok";
    case "v2":
      return "progressive";
  }
}

export function shopCategoryDisplayTitle(category: ShopCategoryId): string {
  switch (category) {
    case "sv":
      return "Single Vision";
    case "kt":
      return "Kryptok";
    case "v2":
      return "Progressive";
  }
}

export function parseShopCategory(raw: string | null | undefined): ShopCategoryId {
  if (raw === "sv" || raw === "kt" || raw === "v2") {
    return raw;
  }
  return "sv";
}

export function getShopCategoryById(id: ShopCategoryId): ShopCategory {
  return SHOP_CATEGORIES.find((c) => c.id === id) ?? SHOP_CATEGORIES[0];
}
